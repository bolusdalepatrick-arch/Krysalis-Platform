import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { DEPARTMENTS, accountById } from "@/lib/mock";
import type { MockJob } from "@/lib/mock";
import EconomicsStrip from "./EconomicsStrip";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobStatus";

/** A marketplace posting card (PRD 7.1) — one of the two places cards are
 *  allowed (PRD 5.1.9). */
export default function PostingCard({ job }: { job: MockJob }) {
  const department = DEPARTMENTS.find((d) => d.id === job.departmentId);
  const account = accountById(job.accountId);
  const dateLine = job.dueAt
    ? `Due ${formatDate(job.dueAt)}`
    : job.completedAt
      ? `Completed ${formatDate(job.completedAt)}`
      : "—";

  return (
    <article className="rounded-m border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>{department?.name ?? "—"}</Eyebrow>
        <span className="figure text-xs text-muted">{dateLine}</span>
      </div>
      <h2 className="mt-1.5 text-md font-bold tracking-[-0.01em]">
        <Link
          href={`/dashboard/marketplace/${job.id}`}
          className="text-primary hover:text-accent"
        >
          {job.title}
        </Link>
      </h2>
      <p className="mt-1 line-clamp-2 text-sm text-secondary">{job.brief}</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-sm text-secondary">{account?.name ?? "—"}</p>
        {job.status !== "OPEN" ? (
          <StatusBadge tone={JOB_STATUS_TONE[job.status]}>
            {JOB_STATUS_LABEL[job.status]}
          </StatusBadge>
        ) : null}
      </div>
      <EconomicsStrip job={job} className="mt-3 border-t border-line pt-3" />
    </article>
  );
}
