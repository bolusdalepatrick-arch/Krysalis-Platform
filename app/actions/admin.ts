"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import {
  createEmployeeSchema,
  firstIssue,
  updateUserDepartmentSchema,
  updateUserRoleSchema,
} from "@/lib/validators";

/** The user matrix and Add employee (PRD 7.9), ADMIN only. Confirmation
 *  copy echoes the change (PRD 5.7). */

async function guarded<T>(
  run: (admin: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let admin: User;
  try {
    admin = await requireRole("ADMIN");
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    return await run(admin);
  } catch (error) {
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}

function revalidateMatrix(userId?: string) {
  revalidatePath("/settings");
  revalidatePath("/dashboard", "layout");
  if (userId) revalidatePath(`/dashboard/people/${userId}`);
}

export async function updateUserRole(input: unknown): Promise<ActionResult<string>> {
  return guarded(async (admin) => {
    const parsed = updateUserRoleSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { userId, role } = parsed.data;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return fail("That person no longer exists.");
    if (target.isSystem) return fail("System users keep their role.");
    if (target.id === admin.id && role !== "ADMIN") {
      return fail("Hand off admin to someone else before changing your own role.");
    }
    if (target.role === role) return fail(`${target.name} is already ${role}.`);

    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidateMatrix(userId);
    return ok(`${target.name} is now ${role}.`);
  });
}

export async function updateUserDepartment(input: unknown): Promise<ActionResult<string>> {
  return guarded(async () => {
    const parsed = updateUserDepartmentSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { userId, departmentId } = parsed.data;

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return fail("That person no longer exists.");
    if (target.isSystem) return fail("System users have no department.");

    let label = "no department";
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) return fail("That department no longer exists.");
      label = dept.name;
    }
    await prisma.user.update({ where: { id: userId }, data: { departmentId: departmentId ?? null } });
    revalidateMatrix(userId);
    return ok(`${target.name} moved to ${label}.`);
  });
}

/** Add an employee (PRD 7.9/7.13): the account lands with onboarding pending
 *  (`onboardingCompletedAt` null), so the first-week checklist greets them. */
export async function createEmployee(input: unknown): Promise<ActionResult<{ userId: string }>> {
  return guarded(async () => {
    const parsed = createEmployeeSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { name, email, departmentId, role } = parsed.data;

    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return fail("Pick a department that exists.");

    try {
      const created = await prisma.user.create({
        data: { name, email, role, departmentId, onboardingCompletedAt: null },
      });
      revalidateMatrix(created.id);
      return ok({ userId: created.id });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return fail("Someone already uses that email.");
      }
      throw error;
    }
  });
}
