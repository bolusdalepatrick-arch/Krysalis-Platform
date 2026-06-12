import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canViewChannel, type ChannelFacts, type ChannelViewer } from "@/lib/channels";

/** Channel reads. The rail and the channel page moved to the database with
 *  M2 so the job channels the marketplace provisions are reachable; posting
 *  and polling arrive with M4. */

const channelInclude = {
  department: { select: { id: true, name: true } },
  job: { select: { id: true, title: true, status: true, workers: { select: { memberId: true } } } },
  account: {
    select: {
      id: true,
      name: true,
      portalUsers: { select: { id: true } },
      deals: { where: { stage: "WON" as const }, select: { ownerId: true } },
      jobs: {
        where: { status: { not: "COMPLETED" as const } },
        select: { workers: { select: { memberId: true } } },
      },
    },
  },
  members: { select: { userId: true } },
} satisfies Prisma.ChannelInclude;

type ChannelRow = Prisma.ChannelGetPayload<{ include: typeof channelInclude }>;

function toFacts(channel: ChannelRow): ChannelFacts {
  return {
    kind: channel.kind,
    departmentId: channel.departmentId,
    jobWorkerIds: channel.job?.workers.map((w) => w.memberId) ?? [],
    accountUserIds: channel.account?.portalUsers.map((u) => u.id) ?? [],
    accountOwnerIds: channel.account?.deals.map((deal) => deal.ownerId) ?? [],
    accountWorkerIds:
      channel.account?.jobs.flatMap((job) => job.workers.map((w) => w.memberId)) ?? [],
    memberIds: channel.members.map((m) => m.userId),
  };
}

export interface RailGroups {
  firm: { href: string; label: string }[];
  departments: { href: string; label: string }[];
  jobs: { href: string; label: string }[];
  clients: { href: string; label: string }[];
}

export async function railChannels(viewer: ChannelViewer): Promise<RailGroups> {
  const channels = await prisma.channel.findMany({
    include: channelInclude,
    orderBy: { name: "asc" },
  });
  const visible = channels.filter((channel) => canViewChannel(viewer, toFacts(channel)));
  const link = (channel: ChannelRow) => ({
    href: `/dashboard/channels/${channel.id}`,
    label: channel.kind === "ACCOUNT" ? (channel.account?.name ?? channel.name) : channel.name,
  });
  return {
    firm: visible.filter((c) => c.kind === "FIRM").map(link),
    departments: visible.filter((c) => c.kind === "DEPARTMENT").map(link),
    jobs: visible.filter((c) => c.kind === "JOB").map(link),
    clients: visible.filter((c) => c.kind === "ACCOUNT").map(link),
  };
}

export interface MessageView {
  id: string;
  senderId: string;
  senderName: string;
  senderIsSystem: boolean;
  body: string;
  isShadowDraft: boolean;
  approvedById: string | null;
  createdAt: string;
  bookingCard: {
    id: string;
    externalRef: string;
    name: string;
    company: string;
    companySize: string;
    automationGoal: string;
    slotStart: string;
    slotEnd: string;
    status: "UNCLAIMED" | "CLAIMED" | "ARCHIVED";
    claimedByName: string | null;
    claimedAt: string | null;
    submittedAt: string;
  } | null;
}

export interface ChannelPageData {
  id: string;
  kind: ChannelRow["kind"];
  name: string;
  departmentName: string | null;
  jobTitle: string | null;
  jobId: string | null;
  accountName: string | null;
  messages: MessageView[];
}

export async function channelPage(
  channelId: string,
  viewer: ChannelViewer,
): Promise<ChannelPageData | null> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: channelInclude,
  });
  if (!channel) return null;
  if (!canViewChannel(viewer, toFacts(channel))) return null;

  const messages = await prisma.message.findMany({
    where: { channelId },
    include: {
      sender: { select: { id: true, name: true, isSystem: true } },
      bookingCard: { include: { claimedBy: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: channel.id,
    kind: channel.kind,
    name: channel.name,
    departmentName: channel.department?.name ?? null,
    jobTitle: channel.job?.title ?? null,
    jobId: channel.job?.id ?? null,
    accountName: channel.account?.name ?? null,
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.sender.id,
      senderName: m.sender.name,
      senderIsSystem: m.sender.isSystem,
      body: m.body,
      isShadowDraft: m.isShadowDraft,
      approvedById: m.approvedById,
      createdAt: m.createdAt.toISOString(),
      bookingCard: m.bookingCard
        ? {
            id: m.bookingCard.id,
            externalRef: m.bookingCard.externalRef,
            name: m.bookingCard.name,
            company: m.bookingCard.company,
            companySize: m.bookingCard.companySize,
            automationGoal: m.bookingCard.automationGoal,
            slotStart: m.bookingCard.slotStart.toISOString(),
            slotEnd: m.bookingCard.slotEnd.toISOString(),
            status: m.bookingCard.status,
            claimedByName: m.bookingCard.claimedBy?.name ?? null,
            claimedAt: m.bookingCard.claimedAt?.toISOString() ?? null,
            submittedAt: m.bookingCard.submittedAt.toISOString(),
          }
        : null,
    })),
  };
}

/** The Today view's RECENT ACTIVITY block: the latest non-draft messages
 *  across the channels the viewer can actually see (lib/channels.ts rules —
 *  client threads and other teams' job channels never leak here). */
export async function recentActivity(
  viewer: ChannelViewer,
  limit = 8,
): Promise<
  {
    id: string;
    channelId: string;
    channelName: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
  }[]
> {
  const messages = await prisma.message.findMany({
    where: { isShadowDraft: false },
    include: {
      sender: { select: { id: true, name: true } },
      channel: { include: channelInclude },
    },
    orderBy: { createdAt: "desc" },
    take: limit * 6,
  });
  return messages
    .filter((m) => canViewChannel(viewer, toFacts(m.channel)))
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      channelId: m.channel.id,
      channelName: m.channel.name,
      senderId: m.sender.id,
      senderName: m.sender.name,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
}

/** The Today view's PENDING DRAFTS block: Shadow drafts awaiting the
 *  viewer's approval (workers their jobs'; moderators and admins all). */
export async function pendingDrafts(
  viewer: ChannelViewer,
): Promise<{ id: string; channelId: string; channelName: string; body: string }[]> {
  const drafts = await prisma.message.findMany({
    where: { isShadowDraft: true },
    include: {
      channel: {
        select: { id: true, name: true, job: { select: { workers: { select: { memberId: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const canApproveAll = viewer.role === "ADMIN" || viewer.role === "MODERATOR";
  return drafts
    .filter(
      (m) =>
        canApproveAll ||
        (m.channel.job?.workers ?? []).some((w) => w.memberId === viewer.id),
    )
    .map((m) => ({
      id: m.id,
      channelId: m.channel.id,
      channelName: m.channel.name,
      body: m.body,
    }));
}

/** First channel for the /dashboard/channels redirect. */
export async function firstChannelId(viewer: ChannelViewer): Promise<string | null> {
  const groups = await railChannels(viewer);
  const first =
    groups.departments[0] ?? groups.firm[0] ?? groups.jobs[0] ?? groups.clients[0];
  return first ? first.href.split("/").at(-1)! : null;
}
