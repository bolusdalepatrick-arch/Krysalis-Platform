import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Markdown from "@/components/Markdown";
import PageHeader from "@/components/PageHeader";
import { getSessionUser } from "@/lib/auth";
import { lessonPage } from "@/lib/queries/academy";
import { XP_AMOUNTS } from "@/lib/xp";
import MarkCompleteButton from "../../../components/MarkCompleteButton";

/** The lesson reader (PRD 7.2): serif markdown body, one completion
 *  control, prev/next across the course's lesson order. */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const lesson = await lessonPage(courseId, lessonId, viewer.id);
  if (!lesson) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={lesson.courseTitle}
        title={lesson.title}
        meta={`Module: ${lesson.moduleTitle}${lesson.durationMin ? ` · ${lesson.durationMin} min` : ""}`}
      />
      <div className="max-w-2xl px-6 py-6">
        {lesson.body ? (
          <Markdown>{lesson.body}</Markdown>
        ) : (
          <p className="text-sm text-secondary">
            The full text of this lesson is being written; the outline is current.
          </p>
        )}
        <div className="mt-6 border-t border-line pt-4">
          <MarkCompleteButton
            lessonId={lesson.id}
            completedAt={lesson.completedAt}
            courseXp={XP_AMOUNTS.COURSE_COMPLETED}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
          {lesson.prev ? (
            <Link
              href={`/dashboard/academy/${lesson.courseId}/lesson/${lesson.prev.id}`}
              className="text-accent underline-offset-2 hover:underline"
            >
              Previous: {lesson.prev.title}
            </Link>
          ) : (
            <span />
          )}
          {lesson.next ? (
            <Link
              href={`/dashboard/academy/${lesson.courseId}/lesson/${lesson.next.id}`}
              className="text-right text-accent underline-offset-2 hover:underline"
            >
              Next: {lesson.next.title}
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
