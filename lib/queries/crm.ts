import type {
  AccountKind,
  AccountStatus,
  ActivityKind,
  BookingStatus,
  DealSource,
  DealStage,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";

/** CRM reads (PRD 7.11–7.12). Decimal and Date fields are serialized so
 *  views and client components can take them as props. */

// ── Pipeline ────────────────────────────────────────────────

export interface DealRowView {
  id: string;
  title: string;
  accountId: string;
  accountName: string;
  ownerId: string;
  ownerName: string;
  stage: DealStage;
  value: string | null;
  source: DealSource;
  createdAt: string;
  lastActivityAt: string;
}

const dealRowInclude = {
  account: { select: { name: true } },
  owner: { select: { name: true } },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { createdAt: true },
  },
} satisfies Prisma.DealInclude;

type DealRowData = Prisma.DealGetPayload<{ include: typeof dealRowInclude }>;

function toDealRow(deal: DealRowData): DealRowView {
  return {
    id: deal.id,
    title: deal.title,
    accountId: deal.accountId,
    accountName: deal.account.name,
    ownerId: deal.ownerId,
    ownerName: deal.owner.name,
    stage: deal.stage,
    value: deal.value?.toFixed(2) ?? null,
    source: deal.source,
    createdAt: deal.createdAt.toISOString(),
    lastActivityAt: (deal.activities[0]?.createdAt ?? deal.createdAt).toISOString(),
  };
}

export interface PipelineData {
  deals: DealRowView[];
  counts: { total: number; open: number; won: number; lost: number };
  owners: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
}

export async function pipelineData(filter: {
  stage?: DealStage;
  ownerId?: string;
}): Promise<PipelineData> {
  const [deals, byStage, owners, accounts] = await Promise.all([
    prisma.deal.findMany({
      where: {
        ...(filter.stage ? { stage: filter.stage } : {}),
        ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
      },
      include: dealRowInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.deal.groupBy({ by: ["stage"], _count: true }),
    prisma.user.findMany({
      where: { ownedDeals: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const count = (stage: DealStage) => byStage.find((s) => s.stage === stage)?._count ?? 0;
  const total = byStage.reduce((sum, s) => sum + s._count, 0);
  return {
    deals: deals.map(toDealRow),
    counts: {
      total,
      open: total - count("WON") - count("LOST"),
      won: count("WON"),
      lost: count("LOST"),
    },
    owners,
    accounts,
  };
}

// ── Deal detail ─────────────────────────────────────────────

export interface ActivityView {
  id: string;
  kind: ActivityKind;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface DealDetailView {
  id: string;
  title: string;
  stage: DealStage;
  source: DealSource;
  value: string | null;
  expectedCloseAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  accountId: string;
  accountName: string;
  accountKind: AccountKind;
  accountStatus: AccountStatus;
  accountHasThread: boolean;
  accountHasPortalUser: boolean;
  ownerId: string;
  ownerName: string;
  contact: { name: string; title: string | null; email: string } | null;
  card: { externalRef: string } | null;
  job: { id: string; title: string } | null;
  activities: ActivityView[];
}

export async function dealDetail(dealId: string): Promise<DealDetailView | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      account: {
        include: {
          contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
          channel: { select: { id: true } },
          portalUsers: { where: { role: "CLIENT" }, select: { id: true }, take: 1 },
        },
      },
      owner: { select: { name: true } },
      bookingCard: { select: { externalRef: true } },
      job: { select: { id: true, title: true } },
      activities: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!deal) return null;
  const contact = deal.account.contacts[0] ?? null;
  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage,
    source: deal.source,
    value: deal.value?.toFixed(2) ?? null,
    expectedCloseAt: deal.expectedCloseAt?.toISOString() ?? null,
    wonAt: deal.wonAt?.toISOString() ?? null,
    lostAt: deal.lostAt?.toISOString() ?? null,
    lostReason: deal.lostReason,
    accountId: deal.accountId,
    accountName: deal.account.name,
    accountKind: deal.account.kind,
    accountStatus: deal.account.status,
    accountHasThread: deal.account.channel !== null,
    accountHasPortalUser: deal.account.portalUsers.length > 0,
    ownerId: deal.ownerId,
    ownerName: deal.owner.name,
    contact: contact
      ? { name: contact.name, title: contact.title, email: contact.email }
      : null,
    card: deal.bookingCard ? { externalRef: deal.bookingCard.externalRef } : null,
    job: deal.job,
    activities: deal.activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      authorId: a.authorId,
      authorName: a.author.name,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

// ── Accounts ────────────────────────────────────────────────

export interface AccountRowView {
  id: string;
  name: string;
  kind: AccountKind;
  status: AccountStatus;
  website: string | null;
  dealCount: number;
  jobCount: number;
  contactCount: number;
}

export async function accountRows(): Promise<AccountRowView[]> {
  const accounts = await prisma.account.findMany({
    include: { _count: { select: { deals: true, jobs: true, contacts: true } } },
    orderBy: { name: "asc" },
  });
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    status: a.status,
    website: a.website,
    dealCount: a._count.deals,
    jobCount: a._count.jobs,
    contactCount: a._count.contacts,
  }));
}

export interface AccountDetailView {
  id: string;
  name: string;
  kind: AccountKind;
  status: AccountStatus;
  website: string | null;
  notes: string | null;
  contacts: { id: string; name: string; email: string; title: string | null; isPrimary: boolean }[];
  deals: DealRowView[];
  jobs: { id: string; title: string; status: string; grossValue: string; dueAt: string | null }[];
  portalUsers: { id: string; name: string; email: string }[];
}

export async function accountDetail(accountId: string): Promise<AccountDetailView | null> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      deals: { include: dealRowInclude, orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" } },
      portalUsers: {
        where: { role: "CLIENT" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    kind: account.kind,
    status: account.status,
    website: account.website,
    notes: account.notes,
    contacts: account.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      title: c.title,
      isPrimary: c.isPrimary,
    })),
    deals: account.deals.map(toDealRow),
    jobs: account.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      grossValue: j.grossValue.toFixed(2),
      dueAt: j.dueAt?.toISOString() ?? null,
    })),
    portalUsers: account.status === "ACTIVE" ? account.portalUsers : [],
  };
}

// ── The Bounty Board (PRD 7.12) ─────────────────────────────

export interface CardView {
  id: string;
  externalRef: string;
  name: string;
  email: string;
  company: string;
  companySize: string;
  automationGoal: string;
  slotStart: string;
  slotEnd: string;
  status: BookingStatus;
  claimedByName: string | null;
  claimedById: string | null;
  claimedAt: string | null;
  submittedAt: string;
  dealId: string | null;
  dealTitle: string | null;
  lastWebhookError: string | null;
  /** slotEnd in the past — the admin Archive affordance (ruling, pre-M5). */
  expired: boolean;
}

const cardInclude = {
  claimedBy: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true } },
} satisfies Prisma.BookingCardInclude;

type CardData = Prisma.BookingCardGetPayload<{ include: typeof cardInclude }>;

function toCardView(card: CardData, now: Date): CardView {
  return {
    id: card.id,
    externalRef: card.externalRef,
    name: card.name,
    email: card.email,
    company: card.company,
    companySize: card.companySize,
    automationGoal: card.automationGoal,
    slotStart: card.slotStart.toISOString(),
    slotEnd: card.slotEnd.toISOString(),
    status: card.status,
    claimedByName: card.claimedBy?.name ?? null,
    claimedById: card.claimedBy?.id ?? null,
    claimedAt: card.claimedAt?.toISOString() ?? null,
    submittedAt: card.submittedAt.toISOString(),
    dealId: card.deal?.id ?? null,
    dealTitle: card.deal?.title ?? null,
    lastWebhookError: card.lastWebhookError,
    expired: card.slotEnd < now,
  };
}

export interface BountiesData {
  unclaimed: CardView[];
  claimed: CardView[];
  /** Claimed cards whose outbound notification failed — the admin resend
   *  path (PRD 7.12). */
  failures: CardView[];
}

export async function bountiesData(now = new Date()): Promise<BountiesData> {
  const cards = await prisma.bookingCard.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: cardInclude,
  });
  const views = cards.map((c) => toCardView(c, now));
  return {
    unclaimed: views
      .filter((c) => c.status === "UNCLAIMED")
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    claimed: views
      .filter((c) => c.status === "CLAIMED")
      .sort((a, b) => (b.claimedAt ?? "").localeCompare(a.claimedAt ?? "")),
    failures: views.filter((c) => c.status === "CLAIMED" && c.lastWebhookError !== null),
  };
}

// ── The Today view's blocks (section 6) ─────────────────────

export async function pipelineCounts(viewer: {
  id: string;
  role: string;
}): Promise<Record<DealStage, number>> {
  const byStage = await prisma.deal.groupBy({
    by: ["stage"],
    _count: true,
    ...(viewer.role === "ADMIN" ? {} : { where: { ownerId: viewer.id } }),
  });
  const counts: Record<DealStage, number> = {
    INBOUND: 0,
    DISCOVERY: 0,
    PROPOSAL: 0,
    VERBAL: 0,
    WON: 0,
    LOST: 0,
  };
  for (const row of byStage) counts[row.stage] = row._count;
  return counts;
}

export async function unclaimedBounties(
  now = new Date(),
): Promise<{ count: number; newest: CardView | null }> {
  const cards = await prisma.bookingCard.findMany({
    where: { status: "UNCLAIMED" },
    include: cardInclude,
    orderBy: { submittedAt: "desc" },
  });
  return {
    count: cards.length,
    newest: cards.length > 0 ? toCardView(cards[0], now) : null,
  };
}
