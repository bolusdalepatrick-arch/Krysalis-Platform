import Link from "next/link";
import type { JobStatus } from "@prisma/client";
import StatusBadge from "@/components/StatusBadge";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobStatus";
import { formatDate, formatMoney } from "@/lib/format";

export interface AccountJobRow {
  id: string;
  title: string;
  status: string;
  grossValue: string;
  dueAt: string | null;
}

/** The engagements table on an account page (PRD 7.11) — jobs, once any exist. */
export default function AccountJobsTable({ jobs }: { jobs: AccountJobRow[] }) {
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow py-2 pr-4 text-left font-normal">Job</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Status</th>
          <th className="eyebrow py-2 pr-4 text-right font-normal">Gross</th>
          <th className="eyebrow py-2 text-left font-normal">Due</th>
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
              <StatusBadge tone={JOB_STATUS_TONE[j.status as JobStatus]}>
                {JOB_STATUS_LABEL[j.status as JobStatus]}
              </StatusBadge>
            </td>
            <td className="pr-4 text-right">
              <span className="figure">{formatMoney(j.grossValue)}</span>
            </td>
            <td>
              <span className="figure text-secondary">
                {j.dueAt ? formatDate(j.dueAt) : "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
