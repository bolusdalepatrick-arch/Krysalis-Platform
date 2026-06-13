import type { AccountKind, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sharedAssetsForAccount, type VaultRow } from "@/lib/queries/vault";

/** Portal reads (PRD 7.8). Everything here is the client-safe projection:
 *  jobs carry gross value and a plain-language status only — never
 *  firmMargin, workerPool, bids, or deal stages — and every read is scoped
 *  to the account passed in (resolved from the session, never a URL id). */

const MANAGING_DIRECTOR_ID = "u-mara";

/** Plain-language engagement status for clients (PRD 7.8) — no internal
 *  vocabulary. OPEN never surfaces: a client's engagement exists once it is
 *  staffed. */
const CLIENT_STATUS_LABEL: Record<JobStatus, string> = {
  OPEN: "Being scoped",
  ASSIGNED: "Scheduled with our team",
  IN_PROGRESS: "In progress",
  REVIEW: "In review with our team",
  COMPLETED: "Delivered",
};

export interface ClientJobView {
  id: string;
  title: string;
  /** Plain-language label; the raw status never crosses to the client. */
  statusLabel: string;
  isCompleted: boolean;
  /** What the client paid — theirs to see; the firm's margin is not. */
  grossValue: string;
  description: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface PortalContact {
  name: string;
  title: string | null;
  email: string;
}

export interface PortalViewerState {
  name: string;
  portalStartDismissedAt: string | null;
  detailsConfirmedAt: string | null;
  briefReviewedAt: string | null;
}

export interface PortalData {
  account: { id: string; name: string; kind: AccountKind };
  jobs: ClientJobView[];
  contact: PortalContact | null;
  threadChannelId: string | null;
  infoBar: { id: string; text: string; href: string | null }[];
  guideMarkdown: string;
  assets: VaultRow[];
  viewer: PortalViewerState;
  /** The account's most recent job, for the individual setup strip's step 3
   *  (PRD 7.13, pre-M7 ruling); null auto-satisfies the step. */
  mostRecentJobId: string | null;
}

function toClientJob(job: {
  id: string;
  title: string;
  status: JobStatus;
  grossValue: { toFixed(n: number): string };
  description: string;
  dueAt: Date | null;
  completedAt: Date | null;
}): ClientJobView {
  return {
    id: job.id,
    title: job.title,
    statusLabel: CLIENT_STATUS_LABEL[job.status],
    isCompleted: job.status === "COMPLETED",
    grossValue: job.grossValue.toFixed(2),
    description: job.description,
    dueAt: job.dueAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

/** The owning employee from the account's won deal, else the managing
 *  director (PRD 7.8). */
async function portalContact(accountId: string): Promise<PortalContact | null> {
  const won = await prisma.deal.findFirst({
    where: { accountId, stage: "WON" },
    orderBy: { wonAt: "desc" },
    select: { owner: { select: { name: true, title: true, email: true } } },
  });
  const person =
    won?.owner ??
    (await prisma.user.findUnique({
      where: { id: MANAGING_DIRECTOR_ID },
      select: { name: true, title: true, email: true },
    }));
  return person ? { name: person.name, title: person.title, email: person.email } : null;
}

/** Assemble the whole portal for an account (PRD 7.8). The caller has
 *  already authorized the viewer for this account (canViewAccount); this
 *  only ever reads the one account's data. `viewerId` is the session user,
 *  for the onboarding stamps. */
export async function portalData(
  accountId: string,
  viewerId: string,
): Promise<PortalData | null> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      name: true,
      kind: true,
      // Client-safe job projection: no firmMargin, workerPool, bids, or deal.
      jobs: {
        // A staffed engagement and onward — OPEN postings aren't the client's
        // business until work is scheduled.
        where: { status: { not: "OPEN" } },
        select: {
          id: true,
          title: true,
          status: true,
          grossValue: true,
          description: true,
          dueAt: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      channel: { select: { id: true } },
    },
  });
  if (!account) return null;

  const [contact, infoBar, guide, assets, viewer] = await Promise.all([
    portalContact(accountId),
    prisma.infoBarMessage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, text: true, href: true },
    }),
    prisma.portalGuide.findUnique({ where: { id: "main" }, select: { markdown: true } }),
    sharedAssetsForAccount(accountId),
    prisma.user.findUnique({
      where: { id: viewerId },
      select: {
        name: true,
        portalStartDismissedAt: true,
        detailsConfirmedAt: true,
        briefReviewedAt: true,
      },
    }),
  ]);

  return {
    account: { id: account.id, name: account.name, kind: account.kind },
    jobs: account.jobs.map(toClientJob),
    contact,
    threadChannelId: account.channel?.id ?? null,
    infoBar,
    guideMarkdown: guide?.markdown ?? "",
    assets,
    viewer: {
      name: viewer?.name ?? "",
      portalStartDismissedAt: viewer?.portalStartDismissedAt?.toISOString() ?? null,
      detailsConfirmedAt: viewer?.detailsConfirmedAt?.toISOString() ?? null,
      briefReviewedAt: viewer?.briefReviewedAt?.toISOString() ?? null,
    },
    mostRecentJobId: account.jobs[0]?.id ?? null,
  };
}
