import type { Prisma } from "@prisma/client";
import {
  XP_AMOUNTS,
  remainingForumXpToday,
  tierForXp,
  type Tier,
  type XpReasonKey,
} from "@/lib/xp";

/** Commit an XP award inside a transaction (PRD 7.2): one ledger row, then
 *  the user's aggregate and tier recomputed from it. */
async function commitXp(
  tx: Prisma.TransactionClient,
  userId: string,
  reason: XpReasonKey,
  amount: number,
  refId: string | null,
): Promise<{ tier: Tier; tierChanged: boolean }> {
  await tx.xpEvent.create({ data: { userId, amount, reason, refId } });
  const user = await tx.user.update({
    where: { id: userId },
    data: { experiencePoints: { increment: amount } },
  });
  const tier = tierForXp(user.experiencePoints);
  const tierChanged = tier.level !== user.currentTierLevel;
  if (tierChanged) {
    await tx.user.update({ where: { id: userId }, data: { currentTierLevel: tier.level } });
  }
  return { tier, tierChanged };
}

/** Awards XP inside a transaction (PRD 7.2). Returns the tier so callers can
 *  surface a tier-up. */
export async function awardXp(
  tx: Prisma.TransactionClient,
  userId: string,
  reason: XpReasonKey,
  refId?: string | null,
): Promise<{ tier: Tier; tierChanged: boolean }> {
  return commitXp(tx, userId, reason, XP_AMOUNTS[reason], refId ?? null);
}

/** Forum XP with the daily cap (PRD 7.2: 5 per post/reply, max 25/day). The
 *  cap is an aggregate guard, so the day's forum events are summed before
 *  the award — the caller must run this inside a transaction that has
 *  locked the contributor (the forum action locks the user row). Awards
 *  nothing once the cap is reached. */
export async function awardForumXp(
  tx: Prisma.TransactionClient,
  userId: string,
  refId: string,
  now: Date,
): Promise<{ awarded: boolean; tier?: Tier; tierChanged?: boolean }> {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const today = await tx.xpEvent.aggregate({
    where: { userId, reason: "FORUM_POST", createdAt: { gte: dayStart } },
    _sum: { amount: true },
  });
  const remaining = remainingForumXpToday(today._sum.amount ?? 0);
  if (remaining <= 0) return { awarded: false };
  const { tier, tierChanged } = await commitXp(tx, userId, "FORUM_POST", remaining, refId);
  return { awarded: true, tier, tierChanged };
}
