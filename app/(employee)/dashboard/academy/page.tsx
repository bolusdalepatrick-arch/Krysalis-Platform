import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { COURSES, DEPARTMENTS, lessonCount, type MockCourse } from "@/lib/mock";
import { progressPct } from "./components/completion";

/** Academy catalog (PRD 7.2): courses grouped by department, tiles with
 *  module/lesson counts and a thin progress bar — no rings, no donuts. */
export default function AcademyPage() {
  const departments = DEPARTMENTS.filter((d) =>
    COURSES.some((c) => c.departmentId === d.id),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Academy"
        title="Courses"
        meta={`${COURSES.length} courses across ${departments.length} departments`}
      />
      <div className="flex flex-col gap-8 px-6 py-6">
        {departments.map((dept) => (
          <section key={dept.id}>
            <Eyebrow as="h2">{dept.name}</Eyebrow>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {COURSES.filter((c) => c.departmentId === dept.id).map((course) => (
                <CourseTile key={course.id} course={course} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CourseTile({ course }: { course: MockCourse }) {
  const lessons = lessonCount(course);
  const pct = progressPct(course);

  return (
    <div className="rounded-m border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/academy/${course.id}`}
          className="font-bold tracking-[-0.01em] text-primary hover:text-accent"
        >
          {course.title}
        </Link>
        {course.isPrimer ? <StatusBadge tone="accent">Primer</StatusBadge> : null}
      </div>
      <p className="mt-1 text-sm text-secondary">{course.description}</p>
      <p className="figure mt-3 text-xs text-muted">
        {course.modules.length} modules · {lessons} lessons
      </p>
      <div className="mt-2 h-1 rounded-full bg-inset">
        <div className="h-1 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
