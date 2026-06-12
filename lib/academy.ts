import type { Prisma } from "@prisma/client";
import { awardXp } from "@/lib/progression";

/** The lesson-completion transaction body (PRD 7.2), extracted so the
 *  idempotency invariants are testable against a real database (PRD
 *  section 12: "idempotent lesson award").
 *
 *  Order matters: the enrollment upsert takes the row lock FIRST, so
 *  concurrent completions of different lessons serialize and the later
 *  transaction counts the earlier one's committed completion — the
 *  final-lesson course bonus can neither double-fire (conditional flip)
 *  nor be skipped (no transaction-local stale count). Completing a lesson
 *  enrolls you; the first-week checklist treats one completed lesson as
 *  being in the course (PRD 7.13).
 */
export interface LessonCompletionOutcome {
  completedAt: Date;
  awarded: boolean;
  progressPct: number;
  courseCompleted: boolean;
  tier: { level: number; name: string } | null;
  tierChanged: boolean;
}

export async function applyLessonCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
  lessonId: string,
  courseId: string,
  lessonIds: string[],
): Promise<LessonCompletionOutcome> {
  // Enrollment.updatedAt is @updatedAt, so this upsert always writes —
  // the row lock is real even when nothing else changes.
  await tx.enrollment.upsert({
    where: { memberId_courseId: { memberId: userId, courseId } },
    update: {},
    create: { memberId: userId, courseId },
  });

  // Conditional insert: the composite key makes a repeat call a no-op,
  // so the XP award can never fire twice for one lesson.
  const inserted = await tx.lessonCompletion.createMany({
    data: [{ memberId: userId, lessonId }],
    skipDuplicates: true,
  });
  const awarded = inserted.count === 1;

  const completedCount = await tx.lessonCompletion.count({
    where: { memberId: userId, lessonId: { in: lessonIds } },
  });
  const progressPct = Math.round((completedCount / lessonIds.length) * 100);

  await tx.enrollment.update({
    where: { memberId_courseId: { memberId: userId, courseId } },
    data: { progressPct },
  });

  let tier: { level: number; name: string } | null = null;
  let tierChanged = false;
  if (awarded) {
    const result = await awardXp(tx, userId, "LESSON_COMPLETED", lessonId);
    tier = { level: result.tier.level, name: result.tier.name };
    tierChanged = result.tierChanged;
  }

  // Exactly-once course bonus: only the call that flips isCompleted
  // false -> true awards COURSE_COMPLETED.
  let courseCompleted = false;
  if (completedCount === lessonIds.length) {
    const flipped = await tx.enrollment.updateMany({
      where: { memberId: userId, courseId, isCompleted: false },
      data: { isCompleted: true, progressPct: 100 },
    });
    if (flipped.count === 1) {
      courseCompleted = true;
      const result = await awardXp(tx, userId, "COURSE_COMPLETED", courseId);
      tier = { level: result.tier.level, name: result.tier.name };
      tierChanged = tierChanged || result.tierChanged;
    }
  }

  const completion = await tx.lessonCompletion.findUniqueOrThrow({
    where: { memberId_lessonId: { memberId: userId, lessonId } },
  });

  return {
    completedAt: completion.completedAt,
    awarded,
    progressPct: courseCompleted ? 100 : progressPct,
    courseCompleted,
    tier,
    tierChanged,
  };
}
