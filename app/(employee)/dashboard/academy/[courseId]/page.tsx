import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import { courseById, DEPARTMENTS } from "@/lib/mock";
import { COMPLETED_LESSON_IDS, completedCount } from "../components/completion";

/** Classroom (PRD 7.2): two-pane — ordered module outline on the left with
 *  per-lesson completion ticks, lesson reading surface on the right. */
export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = courseById(courseId);
  if (!course) notFound();

  const deptName =
    DEPARTMENTS.find((d) => d.id === course.departmentId)?.name ?? course.departmentId;
  const enrolled = completedCount(course) > 0;
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div>
      <PageHeader
        eyebrow={`${deptName} · Academy`}
        title={course.title}
        meta={course.description}
        actions={
          enrolled ? (
            <span className="text-sm text-muted">Enrolled</span>
          ) : (
            <button
              type="button"
              disabled
              className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
            >
              Enroll
            </button>
          )
        }
      />
      <div className="flex">
        <aside className="flex w-72 shrink-0 flex-col gap-6 border-r border-line px-6 py-6">
          {course.modules.map((mod) => (
            <div key={mod.id}>
              <Eyebrow as="h2">{mod.title}</Eyebrow>
              <ul className="mt-2">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex h-9 items-center gap-2">
                    {COMPLETED_LESSON_IDS.has(lesson.id) ? (
                      <Check size={16} strokeWidth={1.5} className="shrink-0 text-ok" />
                    ) : (
                      <Circle size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
                    )}
                    <Link
                      href={`/dashboard/academy/${course.id}/lesson/${lesson.id}`}
                      className="truncate text-sm text-primary hover:text-accent"
                    >
                      {lesson.title}
                    </Link>
                    {lesson.durationMin ? (
                      <span className="figure ml-auto shrink-0 text-2xs text-muted">
                        {lesson.durationMin} min
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
        <section className="min-w-0 flex-1 px-6 py-6">
          {firstLesson?.body ? (
            <div className="max-w-2xl">
              <h2 className="font-bold tracking-[-0.01em] text-primary">
                {firstLesson.title}
              </h2>
              <Markdown className="mt-3">{firstLesson.body}</Markdown>
            </div>
          ) : (
            <p className="text-secondary">Select a lesson from the outline.</p>
          )}
        </section>
      </div>
    </div>
  );
}
