import type { MockCourse } from "@/lib/mock";
import { lessonCount } from "@/lib/mock";

export type MockLesson = MockCourse["modules"][number]["lessons"][number];

/** Mock completion state for the session viewer (M0 display only).
 *  Replaced by LessonCompletion reads when the Academy lands on the database. */
export const COMPLETED_LESSON_IDS = new Set<string>(["c-ts-l1", "c-ts-l2", "c-bf-l1"]);

export function completedCount(course: MockCourse): number {
  return course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => COMPLETED_LESSON_IDS.has(l.id)).length,
    0,
  );
}

export function progressPct(course: MockCourse): number {
  const total = lessonCount(course);
  if (total === 0) return 0;
  return Math.round((completedCount(course) / total) * 100);
}

export interface FlatLesson {
  moduleTitle: string;
  lesson: MockLesson;
}

/** The course's lessons in reading order, with their module titles. */
export function flattenLessons(course: MockCourse): FlatLesson[] {
  return course.modules.flatMap((m) =>
    m.lessons.map((lesson) => ({ moduleTitle: m.title, lesson })),
  );
}
