import type { Prisma, PrismaClient } from "@prisma/client";
import type { ShadowFacts } from "./types";

/** Loads the only facts the deterministic Shadow may read (PRD 7.3):
 *  status, pool allocation, time to due date, latest delivered assets,
 *  and the last 10 human messages. */
export async function loadShadowFacts(
  db: PrismaClient | Prisma.TransactionClient,
  jobId: string,
): Promise<ShadowFacts | null> {
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      bids: { where: { status: "ACCEPTED" }, select: { proposedSplit: true } },
      vaultAssets: { orderBy: { createdAt: "desc" }, take: 2, select: { title: true } },
      channel: { select: { id: true } },
    },
  });
  if (!job) return null;

  const allocated = job.bids.reduce(
    (sum, bid) => sum.add(bid.proposedSplit),
    job.workerPool.sub(job.workerPool),
  );
  const poolAllocatedPct = job.workerPool.isZero()
    ? 0
    : allocated.div(job.workerPool).toNumber() * 100;

  const now = new Date();
  const daysToDue = job.dueAt
    ? Math.round((job.dueAt.getTime() - now.getTime()) / 86_400_000)
    : null;
  const dueLabel = job.dueAt
    ? job.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const recent = job.channel
    ? await db.message.findMany({
        where: {
          channelId: job.channel.id,
          isShadowDraft: false,
          // Human messages only — the Shadow never quotes itself or the Gate.
          sender: { isSystem: false },
        },
        include: { sender: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return {
    jobId: job.id,
    jobTitle: job.title,
    status: job.status,
    poolAllocatedPct,
    daysToDue,
    dueLabel,
    latestAssets: job.vaultAssets.map((a) => a.title),
    recentMessages: recent
      .reverse()
      .map((m) => ({ sender: m.sender.name, body: m.body })),
  };
}
