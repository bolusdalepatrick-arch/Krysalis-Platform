import { notFound, redirect } from "next/navigation";
import Markdown from "@/components/Markdown";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { getSessionUser } from "@/lib/auth";
import { jobDetail } from "@/lib/queries/marketplace";
import BidsPanel from "../components/BidsPanel";
import EconomicsStrip from "../components/EconomicsStrip";
import JobFacts from "../components/JobFacts";
import StatusActions from "../components/StatusActions";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobStatus";

/** Job detail (PRD 7.1): serif description, economics strip, the live bid
 *  table, the status machine's controls, and the facts rail. */
export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const detail = await jobDetail(jobId);
  if (!detail) notFound();
  const { job, bids, workers, channel, files, poolRemainder } = detail;

  const isWorker = workers.some((w) => w.id === viewer.id);
  const isAdmin = viewer.role === "ADMIN";

  return (
    <div>
      <PageHeader
        eyebrow={`${job.departmentName} · ${job.accountName}`}
        title={job.title}
        meta={job.brief}
        actions={
          <StatusBadge tone={JOB_STATUS_TONE[job.status]}>
            {JOB_STATUS_LABEL[job.status]}
          </StatusBadge>
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
          <BidsPanel
            jobId={job.id}
            jobStatus={job.status}
            workerPool={job.workerPool}
            poolRemainder={poolRemainder}
            viewer={{
              id: viewer.id,
              name: viewer.name,
              role: viewer.role,
              tier: viewer.currentTierLevel,
            }}
            bids={bids}
          />
        </div>
        <JobFacts
          workers={workers}
          channel={channel}
          files={files}
          dueAt={job.dueAt}
          completedAt={job.completedAt}
        >
          <StatusActions
            jobId={job.id}
            status={job.status}
            isWorker={isWorker}
            isAdmin={isAdmin}
          />
        </JobFacts>
      </div>
    </div>
  );
}
