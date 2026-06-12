import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  canDecideShadowDraft,
  canPostChannel,
  canViewChannel,
  type ChannelFacts,
  type ChannelViewer,
} from "@/lib/channels";

/** Channel reads. Visibility, posting, and draft rights all derive from
 *  lib/channels.ts; Shadow drafts are filtered out for viewers who cannot
 *  decide them (PRD 7.3). */

export const channelInclude = {
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
  members: { select: { userId: true, user: { select: { name: true } } } },
} satisfies Prisma.ChannelInclude;

export type ChannelRow = Prisma.ChannelGetPayload<{ include: typeof channelInclude }>;

export function toFacts(channel: ChannelRow): ChannelFacts {
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
  /** Completed jobs' channels stay listed but read archived (PRD 7.3). */
  jobs: { href: string; label: string; archived?: boolean }[];
  clients: { href: string; label: string }[];
  direct: { href: string; label: string }[];
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
  // A DM is labeled with the other person's name (PRD section 8: "derived
  // label for DMs").
  const dmLink = (channel: ChannelRow) => ({
    href: `/dashboard/channels/${channel.id}`,
    label:
      channel.members.find((m) => m.userId !== viewer.id)?.user.name ?? channel.name,
  });
  return {
    firm: visible.filter((c) => c.kind === "FIRM").map(link),
    departments: visible.filter((c) => c.kind === "DEPARTMENT").map(link),
    jobs: visible
      .filter((c) => c.kind === "JOB")
      .map((c) => ({ ...link(c), archived: c.job?.status === "COMPLETED" })),
    clients: visible.filter((c) => c.kind === "ACCOUNT").map(link),
    direct: visible
      .filter((c) => c.kind === "DM")
      .map(dmLink)
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export interface MessageView {
  id: string;
  senderId: string;
  senderName: string;
  senderIsSystem: boolean;
  /** Tier badge level for employee-side senders; null for clients and
   *  system users, who are outside the tier system (PRD 7.2). */
  senderTier: number | null;
  body: string;
  isShadowDraft: boolean;
  approvedById: string | null;
  /** "Shadow · approved by {name}" attribution — muted, badge-free. */
  approvedByName: string | null;
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
  jobStatus: string | null;
  accountName: string | null;
  /** DM partner's name — the derived label (PRD section 8). */
  dmPartnerName: string | null;
  canPost: boolean;
  /** "Draft update" affordance and draft action rights (PRD 7.3). */
  canDecideDrafts: boolean;
  messages: MessageView[];
}

const messageInclude = {
  sender: {
    select: { id: true, name: true, isSystem: true, role: true, currentTierLevel: true },
  },
  bookingCard: { include: { claimedBy: { select: { name: true } } } },
} satisfies Prisma.MessageInclude;

type MessageRowData = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

async function toMessageViews(rows: MessageRowData[]): Promise<MessageView[]> {
  // approvedById is intentionally a display-only scalar (PRD section 8);
  // resolve names in one batched lookup.
  const approverIds = [...new Set(rows.map((m) => m.approvedById).filter((id): id is string => !!id))];
  const approvers =
    approverIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: approverIds } },
          select: { id: true, name: true },
        })
      : [];
  const approverName = new Map(approvers.map((u) => [u.id, u.name]));

  return rows.map((m) => ({
    id: m.id,
    senderId: m.sender.id,
    senderName: m.sender.name,
    senderIsSystem: m.sender.isSystem,
    senderTier:
      !m.sender.isSystem && m.sender.role !== "CLIENT" && m.sender.role !== "USER"
        ? m.sender.currentTierLevel
        : null,
    body: m.body,
    isShadowDraft: m.isShadowDraft,
    approvedById: m.approvedById,
    approvedByName: m.approvedById ? (approverName.get(m.approvedById) ?? null) : null,
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
  }));
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
  const facts = toFacts(channel);
  if (!canViewChannel(viewer, facts)) return null;
  const decidesDrafts = canDecideShadowDraft(viewer, facts);

  const rows = await prisma.message.findMany({
    where: { channelId, ...(decidesDrafts ? {} : { isShadowDraft: false }) },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  });

  return {
    id: channel.id,
    kind: channel.kind,
    name: channel.name,
    departmentName: channel.department?.name ?? null,
    jobTitle: channel.job?.title ?? null,
    jobId: channel.job?.id ?? null,
    jobStatus: channel.job?.status ?? null,
    accountName: channel.account?.name ?? null,
    dmPartnerName:
      channel.kind === "DM"
        ? (channel.members.find((m) => m.userId !== viewer.id)?.user.name ?? null)
        : null,
    canPost: canPostChannel(viewer, facts),
    canDecideDrafts: decidesDrafts,
    messages: await toMessageViews(rows),
  };
}

/** The 5-second poll's read (PRD 7.3): messages at or after the cursor in
 *  a channel the viewer can see, drafts filtered by draft rights. The
 *  client dedupes by id, so the >= overlap is safe. */
export async function messagesAfter(
  channelId: string,
  afterIso: string,
  viewer: ChannelViewer,
): Promise<MessageView[] | null> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: channelInclude,
  });
  if (!channel) return null;
  const facts = toFacts(channel);
  if (!canViewChannel(viewer, facts)) return null;
  const decidesDrafts = canDecideShadowDraft(viewer, facts);

  const rows = await prisma.message.findMany({
    where: {
      channelId,
      createdAt: { gte: new Date(afterIso) },
      ...(decidesDrafts ? {} : { isShadowDraft: false }),
    },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return toMessageViews(rows);
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
    senderTier: number | null;
    body: string;
    createdAt: string;
  }[]
> {
  const messages = await prisma.message.findMany({
    where: { isShadowDraft: false },
    include: {
      sender: {
        select: { id: true, name: true, isSystem: true, role: true, currentTierLevel: true },
      },
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
      senderTier:
        !m.sender.isSystem && m.sender.role !== "CLIENT" && m.sender.role !== "USER"
          ? m.sender.currentTierLevel
          : null,
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
    include: { channel: { include: channelInclude } },
    orderBy: { createdAt: "desc" },
  });
  return drafts
    .filter((m) => canDecideShadowDraft(viewer, toFacts(m.channel)))
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
