import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import type { JobStatus, MockJob } from "@/lib/mock";

const JOB_TONE: Record<JobStatus, StatusTone> = {
  OPEN: "info",
  ASSIGNED: "neutral",
  IN_PROGRESS: "accent",
  REVIEW: "warn",
  COMPLETED: "ok",
};

/** The engagements table on an account page (PRD 7.11) — jobs, once any exist. */
export default function AccountJobsTable({ jobs }: { jobs: MockJob[] }) {
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow py-2 pr-4 text-left font-normal">Job</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Status</th>
          <th className="eyebrow py-2 pr-4 text-right font-normal">Gross</th>
          <th className="eyebrow py-2 text-left font-normal">Due / completed</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id} className="h-9 border-b border-line">
            <td className="pr-4">
              <Link
                href={`/dashboard/marketplace/${j.id}`}
                className="font-medium text-primary hover:text-accent"
              >
                {j.title}
              </Link>
            </td>
            <td className="pr-4">
              <StatusBadge tone={JOB_TONE[j.status]}>
                {j.status.replace("_", " ")}
              </StatusBadge>
            </td>
            <td className="pr-4 text-right">
              <span className="figure">{formatMoney(j.grossValue)}</span>
            </td>
            <td>
              <span className="figure text-secondary">
                {j.completedAt
                  ? formatDate(j.completedAt)
                  : j.dueAt
                    ? formatDate(j.dueAt)
                    : "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
