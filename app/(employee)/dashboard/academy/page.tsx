import Link from "next/link";
import { redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { getSessionUser } from "@/lib/auth";
import { catalog } from "@/lib/queries/academy";

/** The course catalog (PRD 7.2): grouped by department, tiles with a thin
 *  token-colored progress bar — no rings, no donuts. */
export default async function AcademyPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const groups = await catalog(viewer.id);
  const courseCount = groups.reduce((sum, g) => sum + g.courses.length, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Academy"
        title="Courses"
        meta={`${courseCount} courses across ${groups.length} departments.`}
      />
      <div className="space-y-8 px-6 py-6">
        {groups.map((group) => (
          <section key={group.departmentId}>
            <Eyebrow as="h2">{group.departmentName}</Eyebrow>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {group.courses.map((course) => {
                const pct =
                  course.lessonCount > 0
                    ? Math.round((course.completedLessons / course.lessonCount) * 100)
                    : 0;
                return (
                  <article key={course.id} className="rounded-m border border-line bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-md font-bold tracking-[-0.01em]">
                        <Link
                          href={`/dashboard/academy/${course.id}`}
                          className="text-primary hover:text-accent"
                        >
                          {course.title}
                        </Link>
                      </h3>
                      {course.isPrimer ? <StatusBadge tone="accent">Primer</StatusBadge> : null}
                    </div>
                    <p className="mt-1 text-sm text-secondary">{course.description}</p>
                    <p className="figure mt-2 text-xs text-muted">
                      {course.moduleCount} modules · {course.lessonCount} lessons
                      {course.enrolled
                        ? ` · ${course.completedLessons} of ${course.lessonCount} complete`
                        : ""}
                    </p>
                    <div className="mt-3 h-1 rounded-full bg-inset" aria-hidden>
                      <div className="h-1 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
