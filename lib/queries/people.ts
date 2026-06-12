import type { XpReason } from "@prisma/client";
import { prisma } from "@/lib/db";
import { tierName } from "@/lib/xp";

/** Profile reads (PRD 7.2): tier, XP, earnings, completed work, courses
 *  finished, and the reverse-chrono ledger — figures come from the ledger
 *  and real rows, never an asserted number. */

const REASON_LABEL: Record<XpReason, string> = {
  LESSON_COMPLETED: "Lesson completed",
  COURSE_COMPLETED: "Course completed",
  BID_ACCEPTED: "Bid accepted",
  JOB_COMPLETED: "Job completed",
  DEAL_WON: "Deal won",
  ONBOARDING_COMPLETED: "Onboarding completed",
  FORUM_POST: "Forum post",
};

export interface ProfileLedgerRow {
  id: string;
  amount: number;
  label: string;
  refLabel: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  title: string | null;
  role: string;
  departmentName: string | null;
  tierLevel: number;
  tierName: string;
  xp: number;
  earnings: string;
  completedJobs: {
    id: string;
    title: string;
    accountName: string;
    departmentName: string;
    completedAt: string;
    grossValue: string;
  }[];
  activeJobs: { id: string; title: string; status: string }[];
  coursesFinished: { id: string; title: string }[];
  ledger: ProfileLedgerRow[];
  ledgerTotal: number;
}

async function refLabels(
  events: { reason: XpReason; refId: string | null }[],
): Promise<Map<string, string>> {
  const byReason = (reasons: XpReason[]) =>
    events
      .filter((e) => e.refId && reasons.includes(e.reason))
      .map((e) => e.refId as string);
  const [jobs, lessons, courses, deals, bids] = await Promise.all([
    prisma.job.findMany({
      where: { id: { in: byReason(["JOB_COMPLETED"]) } },
      select: { id: true, title: true },
    }),
    prisma.lesson.findMany({
      where: { id: { in: byReason(["LESSON_COMPLETED"]) } },
      select: { id: true, title: true },
    }),
    prisma.course.findMany({
      where: { id: { in: byReason(["COURSE_COMPLETED"]) } },
      select: { id: true, title: true },
    }),
    prisma.deal.findMany({
      where: { id: { in: byReason(["DEAL_WON"]) } },
      select: { id: true, title: true },
    }),
    prisma.bid.findMany({
      where: { id: { in: byReason(["BID_ACCEPTED"]) } },
      select: { id: true, job: { select: { title: true } } },
    }),
  ]);
  const labels = new Map<string, string>();
  for (const row of [...jobs, ...lessons, ...courses, ...deals]) labels.set(row.id, row.title);
  for (const bid of bids) labels.set(bid.id, bid.job.title);
  return labels;
}

export async function profile(userId: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: { select: { name: true } },
      assignedJobs: {
        include: {
          job: {
            include: {
              account: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
        },
      },
      enrollments: {
        where: { isCompleted: true },
        include: { course: { select: { id: true, title: true } } },
      },
    },
  });
  if (!user || user.isSystem) return null;

  const [events, ledgerTotal] = await Promise.all([
    prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.xpEvent.count({ where: { userId } }),
  ]);
  const labels = await refLabels(events);

  const completed = user.assignedJobs
    .filter((w) => w.job.status === "COMPLETED" && w.job.completedAt)
    .sort((a, b) => b.job.completedAt!.getTime() - a.job.completedAt!.getTime());

  return {
    id: user.id,
    name: user.name,
    title: user.title,
    role: user.role,
    departmentName: user.department?.name ?? null,
    tierLevel: user.currentTierLevel,
    tierName: tierName(user.currentTierLevel),
    xp: user.experiencePoints,
    earnings: user.totalEarnings.toFixed(2),
    completedJobs: completed.map((w) => ({
      id: w.job.id,
      title: w.job.title,
      accountName: w.job.account.name,
      departmentName: w.job.department.name,
      completedAt: w.job.completedAt!.toISOString(),
      grossValue: w.job.grossValue.toFixed(2),
    })),
    activeJobs: user.assignedJobs
      .filter((w) => w.job.status !== "COMPLETED")
      .map((w) => ({ id: w.job.id, title: w.job.title, status: w.job.status })),
    coursesFinished: user.enrollments.map((e) => ({ id: e.course.id, title: e.course.title })),
    ledger: events.map((e) => ({
      id: e.id,
      amount: e.amount,
      label: REASON_LABEL[e.reason],
      refLabel: e.refId ? (labels.get(e.refId) ?? null) : null,
      createdAt: e.createdAt.toISOString(),
    })),
    ledgerTotal,
  };
}
