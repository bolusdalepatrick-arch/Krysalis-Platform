import type { Prisma } from "@prisma/client";
import { XP_AMOUNTS, tierForXp, type Tier, type XpReasonKey } from "@/lib/xp";

/** Awards XP inside a transaction (PRD 7.2): one ledger row, then the
 *  user's aggregate and tier recomputed from it. Returns the tier so
 *  callers can surface a tier-up. */
export async function awardXp(
  tx: Prisma.TransactionClient,
  userId: string,
  reason: XpReasonKey,
  refId?: string | null,
): Promise<{ tier: Tier; tierChanged: boolean }> {
  const amount = XP_AMOUNTS[reason];
  await tx.xpEvent.create({
    data: { userId, amount, reason, refId: refId ?? null },
  });
  const user = await tx.user.update({
    where: { id: userId },
    data: { experiencePoints: { increment: amount } },
  });
  const tier = tierForXp(user.experiencePoints);
  const tierChanged = tier.level !== user.currentTierLevel;
  if (tierChanged) {
    await tx.user.update({
      where: { id: userId },
      data: { currentTierLevel: tier.level },
    });
  }
  return { tier, tierChanged };
}
