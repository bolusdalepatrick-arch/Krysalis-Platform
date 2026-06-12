import { notFound } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { BIDS, DEPARTMENTS, accountById, jobById } from "@/lib/mock";
import BidTable from "../components/BidTable";
import EconomicsStrip from "../components/EconomicsStrip";
import JobFacts from "../components/JobFacts";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "../components/job-status";

/** Job detail (PRD 7.1): serif description, economics strip, bid table,
 *  and the facts rail — workers, channel, dates, delivered files. */
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = jobById(jobId);
  if (!job) notFound();

  const department = DEPARTMENTS.find((d) => d.id === job.departmentId);
  const account = accountById(job.accountId);
  const bids = BIDS.filter((b) => b.jobId === job.id);

  return (
    <div>
      <PageHeader
        eyebrow={`${department?.name ?? "—"} · ${account?.name ?? "—"}`}
        title={job.title}
        meta={job.brief}
        actions={
          <>
            <StatusBadge tone={JOB_STATUS_TONE[job.status]}>
              {JOB_STATUS_LABEL[job.status]}
            </StatusBadge>
            {job.status === "OPEN" ? (
              <button
                type="button"
                disabled
                className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
              >
                Place bid
              </button>
            ) : null}
          </>
        }
      />
      <div className="flex items-start gap-6 px-6 py-6">
        <div className="min-w-0 max-w-2xl flex-1 space-y-6">
          <div className="rounded-m border border-line bg-surface p-4">
            <EconomicsStrip job={job} />
          </div>
          {job.description ? (
            <Markdown>{job.description}</Markdown>
          ) : (
            <p className="prose-serif text-secondary">{job.brief}</p>
          )}
          <section>
            <Eyebrow as="h2" className="mb-2">
              Bids
            </Eyebrow>
            {bids.length > 0 ? (
              <BidTable bids={bids} />
            ) : (
              <p className="text-sm text-secondary">
                No bids yet. Bids placed while the posting is open appear here.
              </p>
            )}
          </section>
        </div>
        <JobFacts job={job} />
      </div>
    </div>
  );
}
