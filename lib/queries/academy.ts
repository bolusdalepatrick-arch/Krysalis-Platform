import { prisma } from "@/lib/db";

/** Academy reads (PRD 7.2). Progress always derives from LessonCompletion
 *  rows — Enrollment.progressPct is the denormalized echo, never the truth. */

export interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  moduleCount: number;
  lessonCount: number;
  isPrimer: boolean;
  enrolled: boolean;
  completedLessons: number;
  isCompleted: boolean;
}

export interface CatalogGroup {
  departmentId: string;
  departmentName: string;
  courses: CatalogCourse[];
}

export async function catalog(viewerId: string): Promise<CatalogGroup[]> {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      courses: {
        include: {
          modules: { include: { lessons: { select: { id: true } } } },
          primerFor: { select: { id: true } },
          enrollments: { where: { memberId: viewerId } },
        },
      },
    },
  });
  const completions = await prisma.lessonCompletion.findMany({
    where: { memberId: viewerId },
    select: { lessonId: true },
  });
  const done = new Set(completions.map((c) => c.lessonId));

  return departments
    .filter((d) => d.courses.length > 0)
    .map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      courses: d.courses
        .map((course) => {
          const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            moduleCount: course.modules.length,
            lessonCount: lessonIds.length,
            isPrimer: course.primerFor !== null,
            enrolled: course.enrollments.length > 0,
            completedLessons: lessonIds.filter((id) => done.has(id)).length,
            isCompleted: course.enrollments[0]?.isCompleted ?? false,
          };
        })
        .sort((a, b) => Number(b.isPrimer) - Number(a.isPrimer) || a.title.localeCompare(b.title)),
    }));
}

export interface ClassroomLesson {
  id: string;
  title: string;
  order: number;
  durationMin: number | null;
  completedAt: string | null;
}

export interface Classroom {
  id: string;
  title: string;
  description: string;
  departmentName: string;
  isPrimer: boolean;
  enrolled: boolean;
  modules: { id: string; title: string; lessons: ClassroomLesson[] }[];
  firstLesson: { id: string; title: string; body: string } | null;
  completedLessons: number;
  lessonCount: number;
}

export async function classroom(courseId: string, viewerId: string): Promise<Classroom | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      department: { select: { name: true } },
      primerFor: { select: { id: true } },
      enrollments: { where: { memberId: viewerId } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { completions: { where: { memberId: viewerId } } },
          },
        },
      },
    },
  });
  if (!course) return null;
  const lessons = course.modules.flatMap((m) => m.lessons);
  const first = lessons[0];
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    departmentName: course.department.name,
    isPrimer: course.primerFor !== null,
    enrolled: course.enrollments.length > 0,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        durationMin: lesson.durationMin,
        completedAt: lesson.completions[0]?.completedAt.toISOString() ?? null,
      })),
    })),
    firstLesson: first ? { id: first.id, title: first.title, body: first.body } : null,
    completedLessons: lessons.filter((l) => l.completions.length > 0).length,
    lessonCount: lessons.length,
  };
}

export interface LessonPage {
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  id: string;
  title: string;
  body: string;
  durationMin: number | null;
  completedAt: string | null;
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export async function lessonPage(
  courseId: string,
  lessonId: string,
  viewerId: string,
): Promise<LessonPage | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { completions: { where: { memberId: viewerId } } },
          },
        },
      },
    },
  });
  if (!course) return null;
  const flat = course.modules.flatMap((m) =>
    m.lessons.map((lesson) => ({ lesson, moduleTitle: m.title })),
  );
  const index = flat.findIndex((entry) => entry.lesson.id === lessonId);
  if (index === -1) return null;
  const { lesson, moduleTitle } = flat[index];
  const prev = flat[index - 1]?.lesson ?? null;
  const next = flat[index + 1]?.lesson ?? null;
  return {
    courseId: course.id,
    courseTitle: course.title,
    moduleTitle,
    id: lesson.id,
    title: lesson.title,
    body: lesson.body,
    durationMin: lesson.durationMin,
    completedAt: lesson.completions[0]?.completedAt.toISOString() ?? null,
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };
}
