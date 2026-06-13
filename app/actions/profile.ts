"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { firstIssue, updateProfileSchema } from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

/** Everyone with a portal or hub can edit their own name and title (PRD
 *  7.9); email and role stay read-only. A parked USER has no profile to
 *  edit. */
const ALLOWED: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN", "CLIENT"];

export async function updateProfile(input: unknown): Promise<ActionResult<void>> {
  let user: User;
  try {
    user = await requireRole(...ALLOWED);
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, title: parsed.data.title ?? null },
    });
    revalidatePath("/settings");
    revalidatePath(`/dashboard/people/${user.id}`);
    revalidatePath("/dashboard", "layout");
    revalidatePath("/client-portal");
    return ok(undefined);
  } catch (error) {
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}
