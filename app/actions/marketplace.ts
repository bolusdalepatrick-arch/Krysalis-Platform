"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { dec, validateJobMoney, validateSplit } from "@/lib/money";
import { awardXp } from "@/lib/progression";
import type { BidView } from "@/lib/queries/marketplace";
import {
  bidIdSchema,
  createJobSchema,
  firstIssue,
  jobIdSchema,
  jobNoteSchema,
  placeBidSchema,
  requestChangesSchema,
  updateBidSchema,
} from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

/** Controlled failure inside a transaction: aborts it, message renders
 *  verbatim (PRD 5.7). */
class ActionError extends Error {}

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
  // one retry resolves the common admin-vs-admin race.
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

function revalidateJob(jobId: string) {
  revalidatePath("/dashboard/marketplace");
  revalidatePath(`/dashboard/marketplace/${jobId}`);
  revalidatePath("/dashboard");
}

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// ── Postings ────────────────────────────────────────────────

export async function createJob(input: unknown): Promise<ActionResult<{ jobId: string }>> {
  return guarded(["ADMIN"], async () => {
    const parsed = createJobSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { title, brief, description, accountId, departmentId, grossValue, workerPool, dueAt, dealId } =
      parsed.data;

    const gross = dec(grossValue);
    const pool = dec(workerPool);
    if (pool.gt(gross)) return fail("The worker pool can't exceed the gross value.");
    const margin = gross.sub(pool);
    const problem = validateJobMoney(gross, pool, margin);
    if (problem) return fail(problem);

    const job = await prisma.job.create({
      data: {
        title,
        brief,
        description,
        status: "OPEN",
        grossValue: gross,
        workerPool: pool,
        firmMargin: margin,
        accountId,
        departmentId,
        dealId: dealId ?? null,
        dueAt: dueAt ? new Date(`${dueAt}T17:00:00`) : null,
      },
    });
    revalidateJob(job.id);
    return ok({ jobId: job.id });
  });
}

// ── Bidding (PRD 7.1 rules) ─────────────────────────────────

export async function placeBid(input: unknown): Promise<ActionResult<BidView>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = placeBidSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { jobId, proposedSplit, pitchText } = parsed.data;

    try {
      const bid = await prisma.$transaction(async (tx) => {
        const job = await tx.job.findUnique({
          where: { id: jobId },
          include: { bids: { where: { status: "ACCEPTED" } } },
        });
        if (!job) throw new ActionError("That posting no longer exists.");
        if (job.status !== "OPEN") {
          throw new ActionError("Bidding is closed on this posting.");
        }
        const problem = validateSplit(
          proposedSplit,
          job.workerPool,
          job.bids.map((b) => b.proposedSplit),
        );
        if (problem) throw new ActionError(problem);
        return tx.bid.create({
          data: {
            jobId,
            memberId: user.id,
            proposedSplit: dec(proposedSplit),
            pitchText: pitchText || null,
          },
        });
      });
      revalidateJob(jobId);
      return ok({
        id: bid.id,
        jobId: bid.jobId,
        memberId: user.id,
        memberName: user.name,
        memberTier: user.currentTierLevel,
        proposedSplit: bid.proposedSplit.toFixed(2),
        pitchText: bid.pitchText,
        status: bid.status,
        createdAt: bid.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return fail("You already have a bid on this posting. Edit or withdraw it instead.");
      }
      throw error;
    }
  });
}

export async function updateBid(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = updateBidSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { bidId, proposedSplit, pitchText } = parsed.data;

    const jobId = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: { job: { include: { bids: { where: { status: "ACCEPTED" } } } } },
      });
      if (!bid) throw new ActionError("That bid no longer exists.");
      if (bid.memberId !== user.id) throw new ActionError("Only the bidder can edit a bid.");
      if (bid.status !== "PENDING") {
        throw new ActionError("Decided bids can't be edited.");
      }
      const problem = validateSplit(
        proposedSplit,
        bid.job.workerPool,
        bid.job.bids.map((b) => b.proposedSplit),
      );
      if (problem) throw new ActionError(problem);
      // Conditional write: a concurrent accept re-evaluates this WHERE
      // against the decided row, so an ACCEPTED split can never be edited.
      const updated = await tx.bid.updateMany({
        where: { id: bidId, status: "PENDING" },
        data: { proposedSplit: dec(proposedSplit), pitchText: pitchText || null },
      });
      if (updated.count === 0) throw new ActionError("Decided bids can't be edited.");
      return bid.jobId;
    });
    revalidateJob(jobId);
    return ok(undefined);
  });
}

export async function withdrawBid(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = bidIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const bid = await prisma.bid.findUnique({ where: { id: parsed.data.bidId } });
    if (!bid) return fail("That bid no longer exists.");
    if (bid.memberId !== user.id) return fail("Only the bidder can withdraw a bid.");
    // Conditional delete: an accepted bid carries the worker's split and
    // must survive a stale withdraw racing the acceptance.
    const deleted = await prisma.bid.deleteMany({
      where: { id: bid.id, memberId: user.id, status: "PENDING" },
    });
    if (deleted.count === 0) return fail("Decided bids can't be withdrawn.");
    revalidateJob(bid.jobId);
    return ok(undefined);
  });
}

export async function acceptBid(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async () => {
    const parsed = bidIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const jobId = await prisma.$transaction(
      async (tx) => {
        const bid = await tx.bid.findUnique({
          where: { id: parsed.data.bidId },
          include: {
            job: { include: { bids: { where: { status: "ACCEPTED" } }, channel: true } },
          },
        });
        if (!bid) throw new ActionError("That bid no longer exists.");
        if (bid.status !== "PENDING") throw new ActionError("This bid has already been decided.");
        // 7.1's table grants acceptBid on OPEN (and ASSIGNED, where staffing
        // continues until bidding closes) — never once work is under way.
        if (bid.job.status !== "OPEN" && bid.job.status !== "ASSIGNED") {
          throw new ActionError("This job is past staffing. Bids can't be accepted once work starts.");
        }
        const problem = validateSplit(
          bid.proposedSplit,
          bid.job.workerPool,
          bid.job.bids.map((b) => b.proposedSplit),
        );
        if (problem) throw new ActionError(problem);

        await tx.bid.update({ where: { id: bid.id }, data: { status: "ACCEPTED" } });
        await tx.jobMember.upsert({
          where: { jobId_memberId: { jobId: bid.jobId, memberId: bid.memberId } },
          update: {},
          create: { jobId: bid.jobId, memberId: bid.memberId },
        });
        await awardXp(tx, bid.memberId, "BID_ACCEPTED", bid.id);
        if (bid.job.status === "OPEN") {
          await tx.job.update({ where: { id: bid.jobId }, data: { status: "ASSIGNED" } });
        }
        if (!bid.job.channel) {
          await tx.channel.create({
            data: { kind: "JOB", name: `job-${slugify(bid.job.title)}`, jobId: bid.jobId },
          });
        }
        return bid.jobId;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidateJob(jobId);
    revalidatePath("/dashboard", "layout");
    return ok(undefined);
  });
}

export async function rejectBid(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async () => {
    const parsed = bidIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const bid = await prisma.bid.findUnique({ where: { id: parsed.data.bidId } });
    if (!bid) return fail("That bid no longer exists.");
    const rejected = await prisma.bid.updateMany({
      where: { id: bid.id, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    if (rejected.count === 0) return fail("This bid has already been decided.");
    revalidateJob(bid.jobId);
    return ok(undefined);
  });
}

// ── Status machine (PRD 7.1) ────────────────────────────────

async function postJobNote(
  tx: Prisma.TransactionClient,
  jobId: string,
  senderId: string,
  body: string,
) {
  const channel = await tx.channel.findUnique({ where: { jobId } });
  if (channel) {
    await tx.message.create({ data: { channelId: channel.id, senderId, body } });
  }
}

export async function startJob(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = jobIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { jobId } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { workers: true },
    });
    if (!job) return fail("That job no longer exists.");
    const isWorker = job.workers.some((w) => w.memberId === user.id);
    if (!isWorker && user.role !== "ADMIN") {
      return fail("Only an assigned worker or an admin can start this job.");
    }
    const moved = await prisma.job.updateMany({
      where: { id: jobId, status: "ASSIGNED" },
      data: { status: "IN_PROGRESS" },
    });
    if (moved.count === 0) return fail("This job isn't waiting to start.");
    revalidateJob(jobId);
    return ok(undefined);
  });
}

export async function submitForReview(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = jobNoteSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { jobId, note } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId }, include: { workers: true } });
      if (!job) throw new ActionError("That job no longer exists.");
      const isWorker = job.workers.some((w) => w.memberId === user.id);
      if (!isWorker && user.role !== "ADMIN") {
        throw new ActionError("Only an assigned worker or an admin can submit this job for review.");
      }
      const moved = await tx.job.updateMany({
        where: { id: jobId, status: "IN_PROGRESS" },
        data: { status: "REVIEW" },
      });
      if (moved.count === 0) throw new ActionError("Only a job in progress can go to review.");
      if (note) await postJobNote(tx, jobId, user.id, note);
    });
    revalidateJob(jobId);
    return ok(undefined);
  });
}

export async function requestChanges(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async (user) => {
    const parsed = requestChangesSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { jobId, note } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const moved = await tx.job.updateMany({
        where: { id: jobId, status: "REVIEW" },
        data: { status: "IN_PROGRESS" },
      });
      if (moved.count === 0) throw new ActionError("Only a job in review can be sent back.");
      await postJobNote(tx, jobId, user.id, note);
    });
    revalidateJob(jobId);
    return ok(undefined);
  });
}

export async function approveCompletion(input: unknown): Promise<ActionResult<void>> {
  return guarded(["ADMIN"], async () => {
    const parsed = jobIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { jobId } = parsed.data;

    await prisma.$transaction(
      async (tx) => {
        const job = await tx.job.findUnique({
          where: { id: jobId },
          include: { workers: true, bids: { where: { status: "ACCEPTED" } } },
        });
        if (!job) throw new ActionError("That job no longer exists.");
        if (job.status !== "REVIEW") {
          throw new ActionError("Only a job in review can be approved as complete.");
        }
        await tx.job.update({
          where: { id: jobId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        for (const worker of job.workers) {
          const split = job.bids.find((b) => b.memberId === worker.memberId)?.proposedSplit;
          if (split) {
            await tx.user.update({
              where: { id: worker.memberId },
              data: { totalEarnings: { increment: split } },
            });
          }
          await awardXp(tx, worker.memberId, "JOB_COMPLETED", jobId);
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidateJob(jobId);
    revalidatePath("/dashboard", "layout");
    return ok(undefined);
  });
}
