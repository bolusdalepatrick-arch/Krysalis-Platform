import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

/** The employee first-week checklist (PRD 7.13), derived entirely from real
 *  rows — no task tables. Three checks plus the single onboardingCompletedAt
 *  stamp; the same derivation feeds the rail count, the welcome page, and the
 *  completeOnboarding re-verification. */

export interface FirstWeekStatus {
  completed: boolean;
  steps: {
    /** Name and title present on the profile. */
    entry: boolean;
    /** Enrolled in the department primer with at least one lesson done. */
    primer: boolean;
    /** At least one message sent by the user in their department channel. */
    checkIn: boolean;
  };
  doneCount: number;
  total: number;
  /** The department's designated primer, for the classroom link. */
  primerCourse: { id: string; title: string } | null;
  /** The department channel, for the check-in link. */
  departmentChannelId: string | null;
  departmentName: string | null;
}

export async function firstWeekStatus(user: User): Promise<FirstWeekStatus> {
  const department = user.departmentId
    ? await prisma.department.findUnique({
        where: { id: user.departmentId },
        select: {
          name: true,
          onboardingCourseId: true,
          onboardingCourse: { select: { id: true, title: true } },
          channel: { select: { id: true } },
        },
      })
    : null;

  const entry = user.name.trim().length > 0 && (user.title?.trim().length ?? 0) > 0;

  let primer = false;
  const primerCourseId = department?.onboardingCourseId ?? null;
  if (primerCourseId) {
    const [enrolled, lessonsDone] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { memberId_courseId: { memberId: user.id, courseId: primerCourseId } },
        select: { id: true },
      }),
      prisma.lessonCompletion.count({
        where: { memberId: user.id, lesson: { module: { courseId: primerCourseId } } },
      }),
    ]);
    primer = enrolled !== null && lessonsDone > 0;
  }

  let checkIn = false;
  if (department?.channel) {
    const posted = await prisma.message.count({
      where: { channelId: department.channel.id, senderId: user.id, isShadowDraft: false },
    });
    checkIn = posted > 0;
  }

  const steps = { entry, primer, checkIn };
  return {
    completed: user.onboardingCompletedAt !== null,
    steps,
    doneCount: Object.values(steps).filter(Boolean).length,
    total: 3,
    primerCourse: department?.onboardingCourse ?? null,
    departmentChannelId: department?.channel?.id ?? null,
    departmentName: department?.name ?? null,
  };
}
