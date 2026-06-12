import { coursesWithBodies } from "../../prisma/seed-data";
import type { MockCourse } from "./types";

/** The course catalog, re-exported from the canonical seed narrative
 *  (prisma/seed-data.ts) with all authored lesson bodies merged. */
export const COURSES: MockCourse[] = coursesWithBodies();

export function courseById(id: string): MockCourse | undefined {
  return COURSES.find((c) => c.id === id);
}

export function lessonCount(course: MockCourse): number {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}
