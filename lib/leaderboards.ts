import { prisma } from "@/lib/db";

/** Leaderboards (PRD 7.7): three ranked boards computed by indexed queries
 *  at request time — no stored scores. Decimal figures are serialized so
 *  the view and BoardTable can take them as props. */

export interface BoardEntry {
  userId: string;
  name: string;
  tierLevel: number;
  /** The ranked quantity, pre-rounded; the view formats it. */
  value: number;
  /** Pre-formatted figure for the right-aligned column. */
  figure: string;
}

const TOP_N = 10;
const DAY_MS = 86_400_000;

function rank(
  rows: { userId: string; name: string; tierLevel: number; value: number }[],
  format: (value: number) => string,
): BoardEntry[] {
  return rows
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, TOP_N)
    .map((r) => ({ ...r, figure: format(r.value) }));
}

/** Jobs executed — count of the member's JobMember rows on COMPLETED jobs.
 *  90-day window filters by the job's completedAt. */
export async function jobsExecutedBoard(opts: { since?: Date } = {}): Promise<BoardEntry[]> {
  const workers = await prisma.jobMember.findMany({
    where: {
      job: {
        status: "COMPLETED",
        ...(opts.since ? { completedAt: { gte: opts.since } } : {}),
      },
      member: { isSystem: false },
    },
    select: {
      memberId: true,
      member: { select: { name: true, currentTierLevel: true } },
    },
  });
  const counts = new Map<string, { name: string; tierLevel: number; value: number }>();
  for (const w of workers) {
    const entry = counts.get(w.memberId) ?? {
      name: w.member.name,
      tierLevel: w.member.currentTierLevel,
      value: 0,
    };
    entry.value += 1;
    counts.set(w.memberId, entry);
  }
  return rank(
    [...counts.entries()].map(([userId, e]) => ({ userId, ...e })),
    (v) => String(v),
  );
}

/** Gross value worked — sum of grossValue across the member's COMPLETED
 *  jobs. On team jobs every worker is credited the full gross (PRD 7.7);
 *  the column tooltip says so. */
export async function grossValueWorkedBoard(
  opts: { since?: Date } = {},
  format: (value: number) => string = (v) => v.toFixed(2),
): Promise<BoardEntry[]> {
  const workers = await prisma.jobMember.findMany({
    where: {
      job: {
        status: "COMPLETED",
        ...(opts.since ? { completedAt: { gte: opts.since } } : {}),
      },
      member: { isSystem: false },
    },
    select: {
      memberId: true,
      member: { select: { name: true, currentTierLevel: true } },
      job: { select: { grossValue: true } },
    },
  });
  const sums = new Map<string, { name: string; tierLevel: number; value: number }>();
  for (const w of workers) {
    const entry = sums.get(w.memberId) ?? {
      name: w.member.name,
      tierLevel: w.member.currentTierLevel,
      value: 0,
    };
    // Decimal to number only for ranking; the figure is formatted from the
    // same Decimal-derived sum, and gross values are well inside 2^53.
    entry.value += Number(w.job.grossValue);
    sums.set(w.memberId, entry);
  }
  return rank(
    [...sums.entries()].map(([userId, e]) => ({ userId, ...e })),
    format,
  );
}

/** Knowledge contributors — trailing 30 days: human messages + 3×forum
 *  posts/replies + 2×lesson completions. Shadow output (any message with
 *  approvedById set), Shadow drafts, and system users are excluded from the
 *  message count (ruling, pre-M6). */
export async function contributorsBoard(now: Date): Promise<BoardEntry[]> {
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const [messages, posts, lessons, people] = await Promise.all([
    prisma.message.groupBy({
      by: ["senderId"],
      where: {
        createdAt: { gte: since },
        isShadowDraft: false,
        approvedById: null,
        sender: { isSystem: false },
      },
      _count: { _all: true },
    }),
    prisma.forumPost.groupBy({
      by: ["authorId"],
      where: { createdAt: { gte: since }, author: { isSystem: false } },
      _count: { _all: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["memberId"],
      where: { completedAt: { gte: since }, member: { isSystem: false } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { isSystem: false },
      select: { id: true, name: true, currentTierLevel: true },
    }),
  ]);

  const score = new Map<string, number>();
  const bump = (id: string, points: number) => score.set(id, (score.get(id) ?? 0) + points);
  for (const m of messages) bump(m.senderId, m._count._all);
  for (const p of posts) bump(p.authorId, 3 * p._count._all);
  for (const l of lessons) bump(l.memberId, 2 * l._count._all);

  const byId = new Map(people.map((p) => [p.id, p]));
  return rank(
    [...score.entries()].flatMap(([userId, value]) => {
      const person = byId.get(userId);
      return person
        ? [{ userId, name: person.name, tierLevel: person.currentTierLevel, value }]
        : [];
    }),
    (v) => String(v),
  );
}
