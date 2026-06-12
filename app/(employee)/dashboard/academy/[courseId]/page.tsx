import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Circle } from "lucide-react";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import PageHeader from "@/components/PageHeader";
import { getSessionUser } from "@/lib/auth";
import { classroom } from "@/lib/queries/academy";
import EnrollButton from "../components/EnrollButton";

/** The classroom (PRD 7.2): two-pane — ordered module outline with
 *  completion ticks on the left, the reading pane on the right. */
export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const course = await classroom(courseId, viewer.id);
  if (!course) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={`${course.departmentName} · Academy`}
        title={course.title}
        meta={course.description}
        actions={
          course.enrolled ? (
            <span className="figure text-sm text-muted">
              Enrolled · {course.completedLessons} of {course.lessonCount} complete
            </span>
          ) : (
            <EnrollButton courseId={course.id} />
          )
        }
      />
      <div className="flex items-start gap-6 px-6 py-6">
        <aside className="w-72 shrink-0 space-y-5">
          {course.modules.map((module) => (
            <section key={module.id}>
              <Eyebrow as="h2">{module.title}</Eyebrow>
              <ul className="mt-1.5">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/dashboard/academy/${course.id}/lesson/${lesson.id}`}
                      className="flex h-9 items-center gap-2 rounded-s px-2 text-sm text-secondary hover:bg-surface hover:text-primary"
                    >
                      {lesson.completedAt ? (
                        <Check size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-ok" />
                      ) : (
                        <Circle size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                      {lesson.durationMin ? (
                        <span className="figure shrink-0 text-2xs text-muted">
                          {lesson.durationMin} min
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </aside>
        <div className="min-w-0 max-w-2xl flex-1">
          {course.firstLesson?.body ? (
            <>
              <h2 className="text-md font-bold tracking-[-0.01em]">{course.firstLesson.title}</h2>
              <Markdown className="mt-3">{course.firstLesson.body}</Markdown>
            </>
          ) : (
            <p className="text-sm text-secondary">Select a lesson from the outline.</p>
          )}
        </div>
      </div>
    </div>
  );
}
