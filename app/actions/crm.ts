"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import {
  applyClaim,
  applyConversion,
  findOrCreateAccountByName,
  stageChangeBody,
  validateStageMove,
} from "@/lib/crm";
import { dec } from "@/lib/money";
import { awardXp } from "@/lib/progression";
import { deliverClaimNotification } from "@/lib/webhooks";
import {
  cardIdSchema,
  convertWonDealSchema,
  createDealSchema,
  firstIssue,
  logDealActivitySchema,
  setDealStageSchema,
  updateDealSchema,
} from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

/** Controlled failure inside a transaction: aborts it, message renders
 *  verbatim (PRD 5.7). */
class ActionError extends Error {}

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

async function guarded<T>(
  roles: SystemRole[],
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole(...roles);
  } catch {
    return fail("You don't have access to that action.");
  }
  // Serializable transactions can abort on a routine write conflict (P2034);
  // one retry resolves the common two-claimers race.
  for (let attempt = 0; ; attempt++) {
    try {
      return await run(user);
    } catch (error) {
      if (error instanceof ActionError) return fail(error.message);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt === 0
      ) {
        continue;
      }
      console.error(error);
      return fail(GENERIC_ACTION_ERROR);
    }
  }
}

function revalidateCrm(dealId?: string, accountId?: string) {
  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard/crm/bounties");
  revalidatePath("/dashboard/crm/accounts");
  if (dealId) revalidatePath(`/dashboard/crm/deals/${dealId}`);
  if (accountId) revalidatePath(`/dashboard/crm/accounts/${accountId}`);
  revalidatePath("/dashboard");
}

// ── Deals (PRD 7.11) ────────────────────────────────────────

export async function createDeal(
  input: unknown,
): Promise<ActionResult<{ dealId: string }>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = createDealSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { accountId, newAccountName, contactName, contactEmail, title, source, value, expectedCloseAt } =
      parsed.data;

    // Serializable for the same reason the claim path is: the account and
    // contact find-or-creates are read-then-write, and SSI only protects
    // when every participant runs serializable (guarded retries P2034).
    const deal = await prisma.$transaction(async (tx) => {
      let resolvedAccountId: string;
      if (accountId) {
        const account = await tx.account.findUnique({ where: { id: accountId } });
        if (!account) throw new ActionError("That account no longer exists.");
        resolvedAccountId = account.id;
      } else {
        const account = await findOrCreateAccountByName(tx, newAccountName!);
        resolvedAccountId = account.id;
        const existingContact = await tx.contact.findFirst({
          where: {
            accountId: account.id,
            email: { equals: contactEmail!, mode: "insensitive" },
          },
        });
        if (!existingContact) {
          const contacts = await tx.contact.count({ where: { accountId: account.id } });
          await tx.contact.create({
            data: {
              accountId: account.id,
              name: contactName!,
              email: contactEmail!,
              isPrimary: contacts === 0,
            },
          });
        }
      }
      return tx.deal.create({
        data: {
          title,
          accountId: resolvedAccountId,
          ownerId: user.id,
          stage: "INBOUND",
          source,
          value: value ? dec(value) : null,
          expectedCloseAt: expectedCloseAt ? new Date(`${expectedCloseAt}T17:00:00`) : null,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidateCrm(deal.id, deal.accountId);
    return ok({ dealId: deal.id });
  });
}

export async function updateDeal(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = updateDealSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { dealId, title, value, expectedCloseAt, ownerId } = parsed.data;

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return fail("That deal no longer exists.");
    if (deal.ownerId !== user.id && user.role !== "ADMIN") {
      return fail("Only the deal's owner or an admin can edit it.");
    }
    if (ownerId && user.role !== "ADMIN") {
      return fail("Only an admin can reassign a deal.");
    }
    if (ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner || owner.isSystem || !EMPLOYEE_SIDE.includes(owner.role as SystemRole)) {
        return fail("Deals are owned by employees.");
      }
    }
    // Conditional write (section 9): a decided deal doesn't change, a
    // racing WON can't have its number edited from under it, and a
    // just-reassigned owner's in-flight edit lands on zero rows.
    const updated = await prisma.deal.updateMany({
      where: {
        id: dealId,
        stage: { notIn: ["WON", "LOST"] },
        ...(user.role === "ADMIN" ? {} : { ownerId: user.id }),
      },
      data: {
        ...(title ? { title } : {}),
        ...(value ? { value: dec(value) } : {}),
        ...(expectedCloseAt ? { expectedCloseAt: new Date(`${expectedCloseAt}T17:00:00`) } : {}),
        ...(ownerId ? { ownerId } : {}),
      },
    });
    if (updated.count === 0) {
      return fail("A decided deal doesn't change. Log an activity instead.");
    }
    revalidateCrm(dealId, deal.accountId);
    return ok(undefined);
  });
}

export async function setDealStage(
  input: unknown,
): Promise<ActionResult<{ tierUp: { level: number; name: string } | null }>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = setDealStageSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { dealId, stage, note } = parsed.data;

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return fail("That deal no longer exists.");
    if (deal.ownerId !== user.id && user.role !== "ADMIN") {
      return fail("Only the deal's owner or an admin can move its stage.");
    }
    const problem = validateStageMove({
      from: deal.stage,
      to: stage,
      hasValue: deal.value !== null,
      note,
    });
    if (problem) return fail(problem);

    const tierUp = await prisma.$transaction(async (tx) => {
      // Conditional write (section 9): guard on the stage we validated
      // against — a racing move loses cleanly instead of double-firing the
      // WON effects — and on ownership, so a just-reassigned owner's
      // in-flight move lands on zero rows.
      const now = new Date();
      const moved = await tx.deal.updateMany({
        where: {
          id: dealId,
          stage: deal.stage,
          ...(user.role === "ADMIN" ? {} : { ownerId: user.id }),
        },
        data: {
          stage,
          ...(stage === "WON" ? { wonAt: now } : {}),
          ...(stage === "LOST" ? { lostAt: now, lostReason: note!.trim() } : {}),
        },
      });
      if (moved.count === 0) {
        throw new ActionError("This deal just moved. Reload to see where it stands.");
      }
      await tx.dealActivity.create({
        data: {
          dealId,
          authorId: user.id,
          kind: "STAGE_CHANGE",
          body: stageChangeBody(deal.stage, stage, note),
          createdAt: now,
        },
      });
      if (stage === "WON") {
        // The owner re-read inside the transaction: a concurrent reassign
        // must not send the DEAL_WON award to the stale owner.
        const fresh = await tx.deal.findUniqueOrThrow({
          where: { id: dealId },
          select: { ownerId: true },
        });
        const award = await awardXp(tx, fresh.ownerId, "DEAL_WON", dealId);
        if (award.tierChanged && fresh.ownerId === user.id) {
          return { level: award.tier.level, name: award.tier.name };
        }
      }
      return null;
    });
    revalidateCrm(dealId, deal.accountId);
    return ok({ tierUp });
  });
}

export async function logDealActivity(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = logDealActivitySchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { dealId, kind, body } = parsed.data;

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return fail("That deal no longer exists.");
    await prisma.dealActivity.create({
      data: { dealId, authorId: user.id, kind, body },
    });
    revalidateCrm(dealId, deal.accountId);
    return ok(undefined);
  });
}

// ── The Bounty Board (PRD 7.12) ─────────────────────────────

export async function claimBookingCard(
  input: unknown,
): Promise<ActionResult<{ accountName: string; dealId: string }>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = cardIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { cardId } = parsed.data;

    const outcome = await prisma.$transaction(
      (tx) => applyClaim(tx, cardId, user),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!outcome.claimed) {
      return fail(
        outcome.claimedByName
          ? `Already claimed by ${outcome.claimedByName}.`
          : "Already claimed.",
      );
    }

    // Outbound notification after commit (PRD 7.12): n8n swaps the meeting
    // host. A failed call never rolls back the claim — the error lands on
    // the card for the admin resend path. Nothing in this best-effort
    // block may convert the committed claim into a reported failure.
    try {
      const card = await prisma.bookingCard.findUniqueOrThrow({ where: { id: cardId } });
      const delivery = await deliverClaimNotification(
        {
          bookingId: card.externalRef,
          claimedBy: { name: user.name, email: user.email },
          claimedAt: card.claimedAt?.toISOString() ?? new Date().toISOString(),
        },
        card.company,
      );
      if (!delivery.delivered) {
        await prisma.bookingCard.update({
          where: { id: cardId },
          data: { lastWebhookError: delivery.error },
        });
      }
    } catch (error) {
      console.error(error);
    }

    revalidateCrm(outcome.dealId, outcome.accountId);
    revalidatePath("/dashboard", "layout");
    return ok({ accountName: outcome.accountName, dealId: outcome.dealId });
  });
}

export async function resendClaimWebhook(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async () => {
    const parsed = cardIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const card = await prisma.bookingCard.findUnique({
      where: { id: parsed.data.cardId },
      include: { claimedBy: { select: { name: true, email: true } } },
    });
    if (!card) return fail("That card no longer exists.");
    if (card.status !== "CLAIMED" || !card.claimedBy || !card.claimedAt) {
      return fail("Only a claimed card notifies n8n.");
    }
    const delivery = await deliverClaimNotification(
      {
        bookingId: card.externalRef,
        claimedBy: { name: card.claimedBy.name, email: card.claimedBy.email },
        claimedAt: card.claimedAt.toISOString(),
      },
      card.company,
    );
    await prisma.bookingCard.update({
      where: { id: card.id },
      data: { lastWebhookError: delivery.delivered ? null : delivery.error },
    });
    revalidatePath("/dashboard/crm/bounties");
    if (!delivery.delivered) return fail(delivery.error);
    return ok(undefined);
  });
}

export async function archiveBookingCard(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async () => {
    const parsed = cardIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    // The one ARCHIVED path (PRD 7.12, ruling pre-M5): expired and
    // unclaimed only, guarded by the conditional write — no auto-archival.
    const archived = await prisma.bookingCard.updateMany({
      where: { id: parsed.data.cardId, status: "UNCLAIMED", slotEnd: { lt: new Date() } },
      data: { status: "ARCHIVED" },
    });
    if (archived.count === 0) {
      return fail("Only an expired, unclaimed card can be archived.");
    }
    revalidateCrm();
    revalidatePath("/dashboard", "layout");
    return ok(undefined);
  });
}

// ── Conversion (PRD 7.11) ───────────────────────────────────

export async function convertWonDeal(
  input: unknown,
): Promise<ActionResult<{ accountName: string; jobId: string | null }>> {
  return guarded(["ADMIN"], async () => {
    const parsed = convertWonDealSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { dealId, provisionPortalUser, accountKind, draftJob } = parsed.data;

    const outcome = await prisma.$transaction(
      (tx) =>
        applyConversion(tx, dealId, {
          provisionPortalUser,
          accountKind,
          draftJob: draftJob
            ? {
                title: draftJob.title,
                brief: draftJob.brief,
                description: draftJob.description,
                departmentId: draftJob.departmentId,
                workerPool: draftJob.workerPool,
                dueAt: draftJob.dueAt ? new Date(`${draftJob.dueAt}T17:00:00`) : null,
              }
            : null,
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!outcome.converted) return fail(outcome.error);

    revalidateCrm(dealId, outcome.accountId);
    revalidatePath("/dashboard/marketplace");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/client-portal");
    return ok({ accountName: outcome.accountName, jobId: outcome.jobId });
  });
}
