"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { finalizeJoblessSetup } from "@/lib/onboarding";
import { confirmDetailsSchema, firstIssue } from "@/lib/validators";

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
