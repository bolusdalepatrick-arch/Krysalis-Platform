import type { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { poolRemainder } from "@/lib/money";

/** Marketplace reads (PRD section 9: reads live in lib/queries). Decimal
 *  and Date fields are serialized so views and client components can take
 *  them as props. */

export interface JobView {
  id: string;
  title: string;
  brief: string;
  description: string;
  status: JobStatus;
  grossValue: string;
  workerPool: string;
  firmMargin: string;
  accountId: string;
  accountName: string;
  departmentId: string;
  departmentName: string;
  dealId: string | null;
  dueAt: string | null;
  completedAt: string | null;
}

export interface BidView {
  id: string;
  jobId: string;
  memberId: string;
  memberName: string;
  proposedSplit: string;
  pitchText: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

type JobWithNames = Prisma.JobGetPayload<{
  include: { account: { select: { name: true } }; department: { select: { name: true } } };
}>;

function toJobView(job: JobWithNames): JobView {
  return {
    id: job.id,
    title: job.title,
    brief: job.brief,
    description: job.description,
    status: job.status,
    grossValue: job.grossValue.toFixed(2),
    workerPool: job.workerPool.toFixed(2),
    firmMargin: job.firmMargin.toFixed(2),
    accountId: job.accountId,
    accountName: job.account.name,
    departmentId: job.departmentId,
    departmentName: job.department.name,
    dealId: job.dealId,
    dueAt: job.dueAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export async function boardJobs(filter: {
  status?: JobStatus;
  departmentId?: string;
}): Promise<{ jobs: JobView[]; openCount: number; totalCount: number }> {
  const [jobs, openCount, totalCount] = await Promise.all([
    prisma.job.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      },
      include: { account: { select: { name: true } }, department: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count(),
  ]);
  return { jobs: jobs.map(toJobView), openCount, totalCount };
}

export interface JobDetail {
  job: JobView;
  bids: BidView[];
  workers: { id: string; name: string }[];
  channel: { id: string; name: string } | null;
  files: { id: string; title: string; fileType: string }[];
  /** Unallocated remainder of the worker pool after accepted splits. */
  poolRemainder: string;
}

export async function jobDetail(jobId: string): Promise<JobDetail | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      account: { select: { name: true } },
      department: { select: { name: true } },
      bids: { include: { member: { select: { id: true, name: true } } } },
      workers: { include: { member: { select: { id: true, name: true } } } },
      channel: { select: { id: true, name: true } },
      vaultAssets: { select: { id: true, title: true, fileType: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!job) return null;
  const accepted = job.bids.filter((b) => b.status === "ACCEPTED");
  return {
    job: toJobView(job),
    bids: job.bids
      .map((bid) => ({
        id: bid.id,
        jobId: bid.jobId,
        memberId: bid.memberId,
        memberName: bid.member.name,
        proposedSplit: bid.proposedSplit.toFixed(2),
        pitchText: bid.pitchText,
        status: bid.status,
        createdAt: bid.createdAt.toISOString(),
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    workers: job.workers.map((w) => ({ id: w.member.id, name: w.member.name })),
    channel: job.channel,
    files: job.vaultAssets,
    poolRemainder: poolRemainder(
      job.workerPool,
      accepted.map((b) => b.proposedSplit),
    ).toFixed(2),
  };
}

export async function marketplaceFormOptions(): Promise<{
  accounts: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}> {
  const [accounts, departments] = await Promise.all([
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { accounts, departments };
}

/** The Today view's OPEN WORK block (PRD section 6) — the viewer's
 *  department when they have one. */
export async function openWork(departmentId: string | null): Promise<JobView[]> {
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN", ...(departmentId ? { departmentId } : {}) },
    include: { account: { select: { name: true } }, department: { select: { name: true } } },
    orderBy: { dueAt: "asc" },
  });
  return jobs.map(toJobView);
}
