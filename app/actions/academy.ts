"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { applyLessonCompletion } from "@/lib/academy";
import { tierName } from "@/lib/xp";
import { courseIdSchema, firstIssue, lessonIdSchema } from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

class ActionError extends Error {}

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

async function guarded<T>(
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole(...EMPLOYEE_SIDE);
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    return await run(user);
  } catch (error) {
    if (error instanceof ActionError) return fail(error.message);
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}

export async function enrollInCourse(input: unknown): Promise<ActionResult<void>> {
  return guarded(async (user) => {
    const parsed = courseIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
    if (!course) return fail("That course no longer exists. Head back to the catalog.");
    await prisma.enrollment.upsert({
      where: { memberId_courseId: { memberId: user.id, courseId: course.id } },
      update: {},
      create: { memberId: user.id, courseId: course.id },
    });
    revalidatePath("/dashboard/academy");
    revalidatePath(`/dashboard/academy/${course.id}`);
    return ok(undefined);
  });
}

export interface CompletionOutcome {
  completedAt: string;
  /** True when this call wrote the completion; false when it already existed. */
  awarded: boolean;
  progressPct: number;
  courseCompleted: boolean;
  tier: { level: number; name: string };
  tierChanged: boolean;
}

/** Mark a lesson complete (PRD 7.2): idempotent via the LessonCompletion
 *  primary key, progress recomputed from completions (never incremented),
 *  the course bonus awarded exactly once via a conditional flip of
 *  Enrollment.isCompleted — the post-M2 conditional-write rule. */
export async function completeLesson(input: unknown): Promise<ActionResult<CompletionOutcome>> {
  return guarded(async (user) => {
    const parsed = lessonIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const lesson = await prisma.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      include: {
        module: {
          select: {
            course: {
              select: {
                id: true,
                modules: { select: { lessons: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });
    if (!lesson) return fail("That lesson no longer exists. Head back to the course outline.");
    const course = lesson.module.course;
    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

    const result = await prisma.$transaction((tx) =>
      applyLessonCompletion(tx, user.id, lesson.id, course.id, lessonIds),
    );

    const outcome: CompletionOutcome = {
      completedAt: result.completedAt.toISOString(),
      awarded: result.awarded,
      progressPct: result.progressPct,
      courseCompleted: result.courseCompleted,
      tier: result.tier ?? {
        level: user.currentTierLevel,
        name: tierName(user.currentTierLevel),
      },
      tierChanged: result.tierChanged,
    };

    revalidatePath("/dashboard/academy");
    revalidatePath(`/dashboard/academy/${course.id}`);
    revalidatePath(`/dashboard/academy/${course.id}/lesson/${lesson.id}`);
    revalidatePath(`/dashboard/people/${user.id}`);
    if (outcome.tierChanged) revalidatePath("/dashboard", "layout");
    return ok(outcome);
  });
}
