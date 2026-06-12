import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobStatus";
import { formatDate, formatMoney } from "@/lib/format";
import {
  BIDS,
  DEPARTMENTS,
  JOBS,
  TIER_NAMES,
  accountById,
  jobById,
  personById,
} from "@/lib/mock";
import { XP_AMOUNTS } from "@/lib/xp";

function departmentName(id: string): string {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? "—";
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const person = personById(userId);
  if (!person || person.isSystem) notFound();

  const department = person.departmentId
    ? DEPARTMENTS.find((d) => d.id === person.departmentId)
    : undefined;

  const completed = JOBS.filter(
    (j) => j.status === "COMPLETED" && j.workerIds.includes(person.id),
  );
  const current = JOBS.filter(
    (j) => j.status !== "COMPLETED" && j.workerIds.includes(person.id),
  );
  const acceptedBids = BIDS.filter(
    (b) => b.memberId === person.id && b.status === "ACCEPTED",
  );

  const ledger = [
    ...completed.map((j) => ({
      amount: XP_AMOUNTS.JOB_COMPLETED,
      reason: "Job completed",
      subject: j.title,
      at: j.completedAt ?? "",
    })),
    ...acceptedBids.map((b) => ({
      amount: XP_AMOUNTS.BID_ACCEPTED,
      reason: "Bid accepted",
      subject: jobById(b.jobId)?.title ?? b.jobId,
      at: b.createdAt,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <>
      <PageHeader
        eyebrow={department?.name ?? "Krysalis"}
        title={person.name}
        meta={person.title || undefined}
        actions={
          <StatusBadge tone="gold">
            Tier {person.tier} — {TIER_NAMES[person.tier]}
          </StatusBadge>
        }
      />
      <div className="space-y-8 px-6 py-6">
        <section className="flex flex-wrap gap-x-12 gap-y-4 rounded-m border border-line bg-surface px-6 py-4">
          <div>
            <Eyebrow>XP</Eyebrow>
            <p className="figure mt-1 text-lg text-gold">
              {person.xp.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <Eyebrow>Earnings</Eyebrow>
            <p className="figure mt-1 text-lg text-gold">{formatMoney(person.earnings)}</p>
          </div>
          <div>
            <Eyebrow>Jobs completed</Eyebrow>
            <p className="figure mt-1 text-lg text-primary">{completed.length}</p>
          </div>
        </section>

        <section>
          <Eyebrow as="h2">Completed work</Eyebrow>
          {completed.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No completed engagements yet. Accepted work lands here when it ships.
            </p>
          ) : (
            <table className="mt-3 w-full text-md">
              <thead>
                <tr className="border-b border-line-strong">
                  <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Job</Eyebrow>
                  <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Client</Eyebrow>
                  <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Department</Eyebrow>
                  <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Completed</Eyebrow>
                  <Eyebrow as="th" className="py-2 text-right font-normal">Gross</Eyebrow>
                </tr>
              </thead>
              <tbody>
                {completed.map((job) => (
                  <tr key={job.id} className="h-9 border-b border-line">
                    <td className="pr-4">
                      <Link
                        href={`/dashboard/marketplace/${job.id}`}
                        className="text-accent hover:underline"
                      >
                        {job.title}
                      </Link>
                    </td>
                    <td className="pr-4 text-secondary">
                      {accountById(job.accountId)?.name ?? "—"}
                    </td>
                    <td className="pr-4 text-secondary">{departmentName(job.departmentId)}</td>
                    <td className="figure pr-4 text-secondary">
                      {job.completedAt ? formatDate(job.completedAt) : "—"}
                    </td>
                    <td className="figure text-right">{formatMoney(job.grossValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <Eyebrow as="h2">Currently on</Eyebrow>
          {current.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No active assignments. Accepted bids place work here.
            </p>
          ) : (
            <ul className="mt-1">
              {current.map((job) => (
                <li
                  key={job.id}
                  className="flex h-11 items-center justify-between gap-4 border-b border-line"
                >
                  <Link
                    href={`/dashboard/marketplace/${job.id}`}
                    className="truncate text-accent hover:underline"
                  >
                    {job.title}
                  </Link>
                  <StatusBadge tone={JOB_STATUS_TONE[job.status]}>
                    {JOB_STATUS_LABEL[job.status]}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <Eyebrow as="h2">Performance record</Eyebrow>
          {ledger.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No entries yet. Accepted bids and completed jobs write the record.
            </p>
          ) : (
            <ul className="mt-1">
              {ledger.map((entry) => (
                <li
                  key={`${entry.reason}-${entry.subject}-${entry.at}`}
                  className="flex h-11 items-center gap-3 border-b border-line"
                >
                  <span className="figure w-12 shrink-0 text-gold">+{entry.amount}</span>
                  <span className="shrink-0 text-secondary">{entry.reason}</span>
                  <span aria-hidden className="text-muted">·</span>
                  <span className="min-w-0 truncate text-primary">{entry.subject}</span>
                  <span className="figure ml-auto shrink-0 text-2xs text-muted">
                    {formatDate(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
