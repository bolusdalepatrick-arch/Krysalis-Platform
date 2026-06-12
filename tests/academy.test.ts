/** The idempotent lesson award (PRD section 12) — exercised against the
 *  real database through the same transaction body the action runs. A
 *  throwaway user keeps the seeded narrative untouched; cleanup runs in
 *  finally so the integrity suite stays valid either way. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { applyLessonCompletion } from "@/lib/academy";
import { XP_AMOUNTS } from "@/lib/xp";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const TEST_USER = "u-test-academy";

async function cleanup() {
  await prisma.xpEvent.deleteMany({ where: { userId: TEST_USER } });
  await prisma.lessonCompletion.deleteMany({ where: { memberId: TEST_USER } });
  await prisma.enrollment.deleteMany({ where: { memberId: TEST_USER } });
  await prisma.user.deleteMany({ where: { id: TEST_USER } });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function courseLessons(courseId: string): Promise<string[]> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
    },
  });
  return course.modules.flatMap((m) => m.lessons.map((l) => l.id));
}

describe("lesson completion invariants", () => {
  it("awards exactly the 7.2 amounts once, end to end, and never twice", async () => {
    await cleanup();
    await prisma.user.create({
      data: {
        id: TEST_USER,
        email: "test-academy@krysalis.studio",
        name: "Test Academy",
        role: "EMPLOYEE",
        departmentId: "marketing",
      },
    });
    const courseId = "c-voice";
    const lessons = await courseLessons(courseId);

    try {
      // Complete every lesson in order.
      for (const lessonId of lessons) {
        const outcome = await prisma.$transaction((tx) =>
          applyLessonCompletion(tx, TEST_USER, lessonId, courseId, lessons),
        );
        expect(outcome.awarded).toBe(true);
      }

      // Repeat the last lesson: idempotent, nothing awarded, nothing flipped.
      const repeat = await prisma.$transaction((tx) =>
        applyLessonCompletion(tx, TEST_USER, lessons[lessons.length - 1], courseId, lessons),
      );
      expect(repeat.awarded).toBe(false);
      expect(repeat.courseCompleted).toBe(false);
      expect(repeat.progressPct).toBe(100);

      const events = await prisma.xpEvent.findMany({ where: { userId: TEST_USER } });
      const lessonEvents = events.filter((e) => e.reason === "LESSON_COMPLETED");
      const courseEvents = events.filter((e) => e.reason === "COURSE_COMPLETED");
      expect(lessonEvents).toHaveLength(lessons.length);
      expect(courseEvents).toHaveLength(1);
      expect(events.reduce((sum, e) => sum + e.amount, 0)).toBe(
        lessons.length * XP_AMOUNTS.LESSON_COMPLETED + XP_AMOUNTS.COURSE_COMPLETED,
      );

      const user = await prisma.user.findUniqueOrThrow({ where: { id: TEST_USER } });
      expect(user.experiencePoints).toBe(
        lessons.length * XP_AMOUNTS.LESSON_COMPLETED + XP_AMOUNTS.COURSE_COMPLETED,
      );

      const enrollment = await prisma.enrollment.findUniqueOrThrow({
        where: { memberId_courseId: { memberId: TEST_USER, courseId } },
      });
      expect(enrollment.isCompleted).toBe(true);
      expect(enrollment.progressPct).toBe(100);
    } finally {
      await cleanup();
    }
  });

  it("awards the course bonus exactly once when the last two lessons race", async () => {
    await cleanup();
    await prisma.user.create({
      data: {
        id: TEST_USER,
        email: "test-academy@krysalis.studio",
        name: "Test Academy",
        role: "EMPLOYEE",
        departmentId: "operations",
      },
    });
    const courseId = "c-handover";
    const lessons = await courseLessons(courseId);

    try {
      for (const lessonId of lessons.slice(0, -2)) {
        await prisma.$transaction((tx) =>
          applyLessonCompletion(tx, TEST_USER, lessonId, courseId, lessons),
        );
      }

      // The last two lessons complete concurrently. The enrollment row lock
      // serializes them; exactly one transaction flips isCompleted.
      const [a, b] = await Promise.all(
        lessons.slice(-2).map((lessonId) =>
          prisma.$transaction((tx) =>
            applyLessonCompletion(tx, TEST_USER, lessonId, courseId, lessons),
          ),
        ),
      );

      expect([a.courseCompleted, b.courseCompleted].filter(Boolean)).toHaveLength(1);
      const courseEvents = await prisma.xpEvent.count({
        where: { userId: TEST_USER, reason: "COURSE_COMPLETED" },
      });
      expect(courseEvents).toBe(1);
      const enrollment = await prisma.enrollment.findUniqueOrThrow({
        where: { memberId_courseId: { memberId: TEST_USER, courseId } },
      });
      expect(enrollment.isCompleted).toBe(true);
      expect(enrollment.progressPct).toBe(100);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: TEST_USER } });
      expect(user.experiencePoints).toBe(
        lessons.length * XP_AMOUNTS.LESSON_COMPLETED + XP_AMOUNTS.COURSE_COMPLETED,
      );
    } finally {
      await cleanup();
    }
  });
});
