import Link from "next/link";
import { notFound } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import { profile } from "@/lib/queries/people";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobStatus";
import type { JobStatus } from "@prisma/client";

/** Profile and performance record (PRD 7.2): tier, XP, earnings, completed
 *  work, courses finished, and the reverse-chrono ledger — every figure
 *  read from real rows, never asserted. */
export default async function PersonPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const person = await profile(userId);
  if (!person) notFound();

  const isClient = person.role === "CLIENT";

  return (
    <div>
      <PageHeader
        eyebrow={person.departmentName ?? "Krysalis"}
        title={person.name}
        meta={person.title ?? undefined}
        actions={
          !isClient ? (
            <StatusBadge tone="gold">{`Tier ${person.tierLevel} — ${person.tierName}`}</StatusBadge>
          ) : undefined
        }
      />
      <div className="max-w-3xl space-y-8 px-6 py-6">
        {!isClient ? (
          <div className="grid grid-cols-3 gap-4 rounded-m border border-line bg-surface p-4">
            <div>
              <Eyebrow>XP</Eyebrow>
              <p className="figure mt-0.5 text-base text-gold">{person.xp.toLocaleString("en-US")}</p>
            </div>
            <div>
              <Eyebrow>Earnings</Eyebrow>
              <p className="figure mt-0.5 text-base text-gold">{formatMoney(person.earnings)}</p>
            </div>
            <div>
              <Eyebrow>Jobs completed</Eyebrow>
              <p className="figure mt-0.5 text-base text-primary">{person.completedJobs.length}</p>
            </div>
          </div>
        ) : null}

        <section>
          <Eyebrow as="h2">Completed work</Eyebrow>
          {person.completedJobs.length > 0 ? (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="eyebrow py-2 pr-4 font-normal">Job</th>
                  <th className="eyebrow py-2 pr-4 font-normal">Client</th>
                  <th className="eyebrow py-2 pr-4 font-normal">Department</th>
                  <th className="eyebrow py-2 pr-4 font-normal">Completed</th>
                  <th className="eyebrow py-2 text-right font-normal">Gross</th>
                </tr>
              </thead>
              <tbody>
                {person.completedJobs.map((job) => (
                  <tr key={job.id} className="h-9 border-b border-line">
                    <td className="pr-4">
                      <Link
                        href={`/dashboard/marketplace/${job.id}`}
                        className="font-medium text-primary hover:text-accent"
                      >
                        {job.title}
                      </Link>
                    </td>
                    <td className="pr-4 text-secondary">{job.accountName}</td>
                    <td className="pr-4 text-secondary">{job.departmentName}</td>
                    <td className="figure pr-4 text-secondary">{formatDate(job.completedAt)}</td>
                    <td className="figure text-right text-primary">{formatMoney(job.grossValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-sm text-secondary">
              No completed engagements yet. Accepted work lands here when it ships.
            </p>
          )}
        </section>

        {person.activeJobs.length > 0 ? (
          <section>
            <Eyebrow as="h2">Currently on</Eyebrow>
            <ul className="mt-2">
              {person.activeJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex h-11 items-center justify-between gap-4 border-b border-line"
                >
                  <Link
                    href={`/dashboard/marketplace/${job.id}`}
                    className="text-sm font-medium text-primary hover:text-accent"
                  >
                    {job.title}
                  </Link>
                  <StatusBadge tone={JOB_STATUS_TONE[job.status as JobStatus]}>
                    {JOB_STATUS_LABEL[job.status as JobStatus]}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {person.coursesFinished.length > 0 ? (
          <section>
            <Eyebrow as="h2">Courses finished</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {person.coursesFinished.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/dashboard/academy/${course.id}`}
                    className="text-sm text-primary hover:text-accent"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!isClient ? (
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow as="h2">Performance record</Eyebrow>
              {person.ledgerTotal > person.ledger.length ? (
                <span className="figure text-xs text-muted">
                  Latest {person.ledger.length} of {person.ledgerTotal}
                </span>
              ) : null}
            </div>
            {person.ledger.length > 0 ? (
              <table className="mt-2 w-full text-left text-sm">
                <tbody>
                  {person.ledger.map((row) => (
                    <tr key={row.id} className="h-9 border-b border-line">
                      <td className="figure w-16 pr-4 text-gold">+{row.amount}</td>
                      <td className="pr-4 text-secondary">
                        {row.label}
                        {row.refLabel ? (
                          <span className="text-muted"> · {row.refLabel}</span>
                        ) : null}
                      </td>
                      <td className="figure w-28 text-right text-muted">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-secondary">
                Nothing in the ledger yet. Lessons, accepted bids, and shipped work land here.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
