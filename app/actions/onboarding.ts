"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import {
  WELCOME_LANDED_COOKIE,
  applyOnboardingCompletion,
  finalizeJoblessSetup,
} from "@/lib/onboarding";
import { firstWeekStatus } from "@/lib/queries/onboarding";
import { confirmDetailsSchema, firstIssue } from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

/** Client start-here stamps (PRD 7.13). Each is a one-way write guarded by
 *  the null timestamp — a conditional updateMany so a repeat click is a
 *  no-op, never a double-stamp. CLIENT personas only. */

async function guardedClient<T>(
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole("CLIENT");
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    return await run(user);
  } catch (error) {
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}

function revalidatePortal() {
  revalidatePath("/client-portal");
}

/** "Got it" on the business start-here panel and the individual strip's
 *  step 2 — both stamp portalStartDismissedAt once. */
export async function dismissPortalStart(): Promise<ActionResult<void>> {
  return guardedClient(async (user) => {
    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { id: user.id, portalStartDismissedAt: null },
        data: { portalStartDismissedAt: new Date() },
      });
      // If this was the last interactive step for a job-less individual,
      // make the auto-satisfied step 3 durable (ruling, pre-M7).
      await finalizeJoblessSetup(tx, user.id);
    });
    revalidatePortal();
    return ok(undefined);
  });
}

/** Individual strip step 1: confirm name, stamp detailsConfirmedAt. The name
 *  update always applies; the stamp is set once. */
export async function confirmPortalDetails(input: unknown): Promise<ActionResult<void>> {
  return guardedClient(async (user) => {
    const parsed = confirmDetailsSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          name: parsed.data.name,
          detailsConfirmedAt: user.detailsConfirmedAt ?? new Date(),
        },
      });
      await finalizeJoblessSetup(tx, user.id);
    });
    revalidatePortal();
    revalidatePath("/settings");
    return ok(undefined);
  });
}

/** Individual strip step 3: mark the engagement brief reviewed. */
export async function markBriefReviewed(): Promise<ActionResult<void>> {
  return guardedClient(async (user) => {
    await prisma.user.updateMany({
      where: { id: user.id, briefReviewedAt: null },
      data: { briefReviewedAt: new Date() },
    });
    revalidatePortal();
    return ok(undefined);
  });
}

// ── Employee first week (PRD 7.13) ──────────────────────────

/** Records that the new hire has landed on /dashboard/welcome this session,
 *  so the once-per-session redirect from the Today view fires only once
 *  (PRD 7.13). A session cookie — no maxAge — clears on browser close. */
export async function markWelcomeSeen(): Promise<void> {
  const store = await cookies();
  store.set(WELCOME_LANDED_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
}

export interface OnboardingOutcome {
  /** True only when this call wrote the completion; false when it was
   *  already done — so the UI toasts the award only when it happened. */
  awarded: boolean;
  tierUp: { level: number; name: string } | null;
}

/** Finish the first week (PRD 7.13): re-verify the three checks server-side,
 *  stamp onboardingCompletedAt once (the null timestamp is the guard), and
 *  award exactly one ONBOARDING_COMPLETED (50 XP). The conditional stamp
 *  guarantees the award fires at most once even under a double-click. */
export async function completeOnboarding(): Promise<ActionResult<OnboardingOutcome>> {
  let user: User;
  try {
    user = await requireRole(...EMPLOYEE_SIDE);
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    if (user.onboardingCompletedAt !== null) {
      return ok({ awarded: false, tierUp: null }); // already done — idempotent
    }
    const status = await firstWeekStatus(user);
    if (status.doneCount < status.total) {
      return fail("Finish all three checks before completing setup.");
    }

    const outcome = await prisma.$transaction(async (tx) => {
      const award = await applyOnboardingCompletion(tx, user.id);
      return {
        awarded: award.awarded,
        tierUp:
          award.awarded && award.tierChanged && award.tier
            ? { level: award.tier.level, name: award.tier.name }
            : null,
      };
    });

    revalidatePath("/dashboard/welcome");
    revalidatePath(`/dashboard/people/${user.id}`);
    revalidatePath("/dashboard", "layout");
    return ok(outcome);
  } catch (error) {
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}
