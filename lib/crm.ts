import type { AccountKind, DealStage, Prisma } from "@prisma/client";
import { dec, validateJobMoney } from "@/lib/money";

/** CRM domain rules (PRD 7.11–7.12): stage movement, the claim transaction,
 *  and the won-deal conversion. Pure rules sit on top; the transaction
 *  bodies take a TransactionClient so actions and tests share them, the
 *  same pattern as lib/academy.ts. Error strings follow PRD 5.7. */

export const WORKING_STAGES: DealStage[] = ["INBOUND", "DISCOVERY", "PROPOSAL", "VERBAL"];

function plain(stage: DealStage): string {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

/** Movement is free between the four working stages; WON requires a value,
 *  LOST requires a reason, and a decided deal stays decided (repeat
 *  business opens a new deal — PRD 7.11). Returns null when the move is
 *  allowed, else a renderable sentence. */
export function validateStageMove(move: {
  from: DealStage;
  to: DealStage;
  hasValue: boolean;
  note?: string | null;
}): string | null {
  const { from, to, hasValue, note } = move;
  if (from === to) return `The deal is already in ${plain(to)}.`;
  if (from === "WON" || from === "LOST") {
    return "A decided deal doesn't move stages. Open a new deal for repeat business.";
  }
  if (to === "WON" && !hasValue) {
    return "Set a value first — a deal can't be won without a number.";
  }
  if (to === "LOST" && !(note && note.trim().length >= 3)) {
    return "Say why it was lost — one plain sentence.";
  }
  return null;
}

/** The automatic STAGE_CHANGE activity body, in the seed's register:
 *  "Stage: PROPOSAL to LOST. Chose to hire in-house; revisit Q4." */
export function stageChangeBody(from: DealStage, to: DealStage, note?: string | null): string {
  const base = `Stage: ${from} to ${to}.`;
  const extra = note?.trim();
  return extra ? `${base} ${extra}` : base;
}

/** Case-insensitive account find-or-create (PRD 7.12): repeat visitors
 *  attach to their existing account. New accounts arrive as BUSINESS
 *  prospects — bookings carry a company string; the converting admin
 *  corrects the kind for solo clients (PRD 7.11). */
export async function findOrCreateAccountByName(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<{ id: string; name: string; created: boolean }> {
  const trimmed = name.trim();
  const existing = await tx.account.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (existing) return { ...existing, created: false };
  const created = await tx.account.create({
    data: { name: trimmed, kind: "BUSINESS", status: "PROSPECT" },
    select: { id: true, name: true },
  });
  return { ...created, created: true };
}

export type ClaimOutcome =
  | { claimed: true; accountId: string; accountName: string; dealId: string }
  | { claimed: false; claimedByName: string | null };

/** The claim transaction body (PRD 7.12) — first claim wins, atomically.
 *  The conditional UNCLAIMED → CLAIMED write is the guard (section 9);
 *  zero affected rows means somebody else won and the caller gets their
 *  name. The winner's path opens the CRM thread in the same transaction:
 *  account (find-or-create), contact, DISCOVERY deal, follow-up message. */
export async function applyClaim(
  tx: Prisma.TransactionClient,
  cardId: string,
  claimer: { id: string },
  now = new Date(),
): Promise<ClaimOutcome> {
  const won = await tx.bookingCard.updateMany({
    where: { id: cardId, status: "UNCLAIMED" },
    data: { status: "CLAIMED", claimedById: claimer.id, claimedAt: now },
  });
  if (won.count === 0) {
    const card = await tx.bookingCard.findUnique({
      where: { id: cardId },
      include: { claimedBy: { select: { name: true } } },
    });
    return { claimed: false, claimedByName: card?.claimedBy?.name ?? null };
  }

  const card = await tx.bookingCard.findUniqueOrThrow({ where: { id: cardId } });
  const account = await findOrCreateAccountByName(tx, card.company);

  const contact = await tx.contact.findFirst({
    where: { accountId: account.id, email: { equals: card.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!contact) {
    const hasContacts = await tx.contact.count({ where: { accountId: account.id } });
    await tx.contact.create({
      data: {
        accountId: account.id,
        name: card.name,
        email: card.email,
        isPrimary: hasContacts === 0,
      },
    });
  }

  const deal = await tx.deal.create({
    data: {
      title: `${account.name} — discovery`,
      accountId: account.id,
      ownerId: claimer.id,
      stage: "DISCOVERY",
      source: "WEBSITE",
      createdAt: now,
    },
  });
  await tx.bookingCard.update({ where: { id: cardId }, data: { dealId: deal.id } });
  await tx.dealActivity.create({
    data: {
      dealId: deal.id,
      authorId: claimer.id,
      kind: "STAGE_CHANGE",
      body: "Stage set to DISCOVERY on claim.",
      createdAt: now,
    },
  });

  const board = await tx.channel.findFirst({
    where: { kind: "FIRM", name: "new-business" },
    select: { id: true },
  });
  if (board) {
    await tx.message.create({
      data: {
        channelId: board.id,
        senderId: claimer.id,
        body: `Claimed — deal opened under ${account.name}.`,
        createdAt: now,
      },
    });
  }

  return { claimed: true, accountId: account.id, accountName: account.name, dealId: deal.id };
}

export interface ConversionDraftJob {
  title: string;
  brief: string;
  description: string;
  departmentId: string;
  workerPool: string;
  dueAt?: Date | null;
}

export type ConversionOutcome =
  | {
      converted: true;
      accountId: string;
      accountName: string;
      thread: "created" | "existing";
      portalUser: "created" | "existing" | "skipped";
      jobId: string | null;
    }
  | { converted: false; error: string };

/** The won-deal conversion body (PRD 7.11, as amended pre-M5). Re-runnable
 *  for repeat business: the ACTIVE flip, the thread, and the portal user
 *  are all find-or-skip; only the job draft repeats — and a single deal
 *  still converts into at most one engagement (`Job.dealId` is unique).
 *  Every failure path runs before the first write, so a `converted: false`
 *  outcome never commits a partial conversion. */
export async function applyConversion(
  tx: Prisma.TransactionClient,
  dealId: string,
  options: {
    provisionPortalUser: boolean;
    accountKind?: AccountKind;
    draftJob?: ConversionDraftJob | null;
  },
): Promise<ConversionOutcome> {
  const deal = await tx.deal.findUnique({
    where: { id: dealId },
    include: {
      account: {
        include: {
          contacts: { orderBy: { createdAt: "asc" } },
          portalUsers: { where: { role: "CLIENT" }, select: { id: true } },
          channel: { select: { id: true } },
        },
      },
      job: { select: { id: true } },
    },
  });
  if (!deal) return { converted: false, error: "That deal no longer exists." };
  if (deal.stage !== "WON") {
    return { converted: false, error: "Only a won deal converts to an engagement." };
  }
  const account = deal.account;

  // Validate the whole conversion before touching a row.
  let portalUser: "created" | "existing" | "skipped" = "skipped";
  let contactForUser: { name: string; email: string } | null = null;
  if (options.provisionPortalUser) {
    if (account.portalUsers.length > 0) {
      portalUser = "existing";
    } else {
      const contact = account.contacts.find((c) => c.isPrimary) ?? account.contacts[0];
      if (!contact) {
        return { converted: false, error: "Add a contact before provisioning portal access." };
      }
      const collision = await tx.user.findUnique({
        where: { email: contact.email },
        select: { id: true, accountId: true },
      });
      if (collision && collision.accountId !== account.id) {
        return {
          converted: false,
          error: `A user with ${contact.email} already exists outside this account.`,
        };
      }
      if (collision) {
        portalUser = "existing";
      } else {
        portalUser = "created";
        contactForUser = { name: contact.name, email: contact.email };
      }
    }
  }

  let jobMoney: { gross: Prisma.Decimal; pool: Prisma.Decimal; margin: Prisma.Decimal } | null =
    null;
  if (options.draftJob) {
    if (deal.job) {
      return { converted: false, error: "This deal already opened its engagement." };
    }
    if (deal.value === null) {
      return { converted: false, error: "Set a value first — a deal can't be won without a number." };
    }
    const gross = dec(deal.value);
    const pool = dec(options.draftJob.workerPool);
    if (pool.gt(gross)) {
      return { converted: false, error: "The worker pool can't exceed the deal's value." };
    }
    const margin = gross.sub(pool);
    const problem = validateJobMoney(gross, pool, margin);
    if (problem) return { converted: false, error: problem };
    jobMoney = { gross, pool, margin };
  }

  // Writes begin here; nothing below returns a failure.
  await tx.account.update({
    where: { id: account.id },
    data: {
      status: "ACTIVE",
      ...(options.accountKind ? { kind: options.accountKind } : {}),
    },
  });

  let thread: "created" | "existing" = "existing";
  if (!account.channel) {
    await tx.channel.create({
      data: { kind: "ACCOUNT", name: account.name, accountId: account.id },
    });
    thread = "created";
  }

  if (contactForUser) {
    await tx.user.create({
      data: {
        email: contactForUser.email,
        name: contactForUser.name,
        role: "CLIENT",
        accountId: account.id,
      },
    });
  }

  let jobId: string | null = null;
  if (options.draftJob && jobMoney) {
    const job = await tx.job.create({
      data: {
        title: options.draftJob.title,
        brief: options.draftJob.brief,
        description: options.draftJob.description,
        status: "OPEN",
        grossValue: jobMoney.gross,
        workerPool: jobMoney.pool,
        firmMargin: jobMoney.margin,
        accountId: account.id,
        dealId: deal.id,
        departmentId: options.draftJob.departmentId,
        dueAt: options.draftJob.dueAt ?? null,
      },
    });
    jobId = job.id;
  }

  return {
    converted: true,
    accountId: account.id,
    accountName: account.name,
    thread,
    portalUser,
    jobId,
  };
}
