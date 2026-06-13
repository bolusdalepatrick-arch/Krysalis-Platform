import Eyebrow from "@/components/Eyebrow";
import { formatDate, formatMoney } from "@/lib/format";
import type { ClientJobView } from "@/lib/queries/portal";

/**
 * The engagements table (PRD 7.8): status in client language, the delivered
 * date for completed work and the due date otherwise, and the gross value —
 * what the client pays is theirs to see; the firm's margin is not.
 */
export default function EngagementsTable({ jobs }: { jobs: ClientJobView[] }) {
  const ordered = [...jobs].sort(
    (a, b) => Number(a.isCompleted) - Number(b.isCompleted),
  );

  return (
    <section>
      <Eyebrow as="h2">Engagements</Eyebrow>
      {ordered.length === 0 ? (
        <p className="mt-3 text-base text-secondary">
          No engagements yet. Work you commission with Krysalis appears here once it is signed.
        </p>
      ) : (
        <table className="mt-3 w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Engagement</Eyebrow>
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Status</Eyebrow>
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Date</Eyebrow>
              <Eyebrow as="th" className="py-2 text-right font-normal">Value</Eyebrow>
            </tr>
          </thead>
          <tbody>
            {ordered.map((job) => {
              const date = job.isCompleted ? job.completedAt : job.dueAt;
              return (
                <tr key={job.id} className="border-b border-line">
                  <td className="py-3.5 pr-4 text-primary">{job.title}</td>
                  <td className="py-3.5 pr-4 text-secondary">{job.statusLabel}</td>
                  <td className="figure py-3.5 pr-4 text-secondary">
                    {date ? formatDate(date) : "—"}
                  </td>
                  <td className="figure py-3.5 text-right text-primary">
                    {formatMoney(job.grossValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
