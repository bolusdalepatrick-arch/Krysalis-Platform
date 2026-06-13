import type { Prisma } from "@prisma/client";
import { awardXp } from "@/lib/progression";
import type { Tier } from "@/lib/xp";

/** The session cookie that lands a new hire on /dashboard/welcome on their
 *  first dashboard visit, then stops (PRD 7.13). Lives here, not in the
 *  "use server" action file, which may export only async functions. */
export const WELCOME_LANDED_COOKIE = "krysalis_welcome_landed";

/** Client setup finalization (PRD 7.13, pre-M7 ruling). The individual
 *  strip's step 3 auto-satisfies when the account has no engagement — but
 *  completion is otherwise derived live from `mostRecentJobId`, so a later
 *  staffed job would flip the auto-satisfied step back open and re-strand a
 *  client who already saw "Set up · completed". To make finishing final, we
 *  durably stamp `briefReviewedAt` the moment a job-less individual finishes
 *  the two interactive steps. A client with a job keeps the normal "Mark as
 *  reviewed" path (briefReviewedAt stays null until they click).
 *
 *  Returns true when it stamped. No-op for business clients (they never set
 *  `detailsConfirmedAt`) and for anyone with a non-OPEN job. */
export async function finalizeJoblessSetup(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<boolean> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      accountId: true,
      detailsConfirmedAt: true,
      portalStartDismissedAt: true,
      briefReviewedAt: true,
    },
  });
  if (!user || !user.accountId) return false;
  // Only once both interactive steps are done and the brief isn't reviewed.
  if (!user.detailsConfirmedAt || !user.portalStartDismissedAt || user.briefReviewedAt) {
    return false;
  }
  // A staffed engagement keeps the explicit review path — don't pre-stamp.
  const jobs = await tx.job.count({
    where: { accountId: user.accountId, status: { not: "OPEN" } },
  });
  if (jobs > 0) return false;

  const stamped = await tx.user.updateMany({
    where: { id: userId, briefReviewedAt: null },
    data: { briefReviewedAt: new Date() },
  });
  return stamped.count > 0;
}

/** Stamp the employee first-week completion and award the one-time XP (PRD
 *  7.13). The conditional stamp on the null timestamp is the once-only
 *  guard: only the request that flips it from null awards
 *  ONBOARDING_COMPLETED, so a double-click or a race awards exactly once.
 *  The caller re-verifies the three checks before invoking this. */
export async function applyOnboardingCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ awarded: boolean; tier?: Tier; tierChanged?: boolean }> {
  const stamped = await tx.user.updateMany({
    where: { id: userId, onboardingCompletedAt: null },
    data: { onboardingCompletedAt: new Date() },
  });
  if (stamped.count === 0) return { awarded: false };
  const award = await awardXp(tx, userId, "ONBOARDING_COMPLETED", null);
  return { awarded: true, tier: award.tier, tierChanged: award.tierChanged };
}
