import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Markdown from "@/components/Markdown";
import { courseById } from "@/lib/mock";
import { COMPLETED_LESSON_IDS, flattenLessons } from "../../../components/completion";

/** Lesson reader (PRD 7.2): serif markdown body, one completion affordance,
 *  prev/next across the course's flattened lesson order. */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = courseById(courseId);
  if (!course) notFound();

  const flat = flattenLessons(course);
  const index = flat.findIndex((f) => f.lesson.id === lessonId);
  if (index === -1) notFound();

  const { lesson, moduleTitle } = flat[index];
  const prev = index > 0 ? flat[index - 1].lesson : undefined;
  const next = index < flat.length - 1 ? flat[index + 1].lesson : undefined;
  const completed = COMPLETED_LESSON_IDS.has(lesson.id);

  return (
    <div>
      <PageHeader
        eyebrow={course.title}
        title={lesson.title}
        meta={
          <>
            Module: {moduleTitle}
            {lesson.durationMin ? (
              <>
                {" · "}
                <span className="figure">{lesson.durationMin} min</span>
              </>
            ) : null}
          </>
        }
      />
      <div className="px-6 py-6">
        <div className="max-w-2xl">
          {lesson.body ? (
            <Markdown>{lesson.body}</Markdown>
          ) : (
            <p className="text-secondary">
              The full text of this lesson is being written; the outline is current.
            </p>
          )}
          <div className="mt-8">
            {completed ? (
              <p className="figure flex items-center gap-2 text-sm text-muted">
                <Check size={16} strokeWidth={1.5} />
                Completed Jun 10, 2026
              </p>
            ) : (
              <button
                type="button"
                disabled
                className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
              >
                Mark lesson complete
              </button>
            )}
          </div>
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-4">
            {prev ? (
              <Link
                href={`/dashboard/academy/${course.id}/lesson/${prev.id}`}
                className="text-sm text-accent"
              >
                Previous: {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/dashboard/academy/${course.id}/lesson/${next.id}`}
                className="text-sm text-accent"
              >
                Next: {next.title}
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
