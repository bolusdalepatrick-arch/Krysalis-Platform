import Eyebrow from "@/components/Eyebrow";
import LinkPill from "@/components/LinkPill";
import PageHeader from "@/components/PageHeader";
import BoardTable, { type BoardRow } from "@/components/leaderboards/BoardTable";
import { formatMoney } from "@/lib/format";
import { FORUM_POSTS, JOBS, MESSAGES, personById } from "@/lib/mock";

const NOW = new Date("2026-06-12");
const DAY = 24 * 60 * 60 * 1000;

/** Mock lesson completions until the Academy ledger lands (M2); seed ids. */
const LESSON_COMPLETIONS: Record<string, number> = { "u-noor": 1, "u-priya": 2 };

const SYSTEM_SENDERS = new Set(["u-shadow", "u-gate"]);

/** Sort desc, drop zero rows, keep the top 10, format the figure. */
function rank(scores: Map<string, number>, format: (v: number) => string): BoardRow[] {
  return [...scores.entries()]
    .filter(([, value]) => value > 0)
    .flatMap(([id, value]) => {
      const person = personById(id);
      return person ? [{ person, value }] : [];
    })
    .sort((a, b) => b.value - a.value || a.person.name.localeCompare(b.person.name))
    .slice(0, 10)
    .map(({ person, value }) => ({ person, figure: format(value) }));
}

function bump(scores: Map<string, number>, id: string, points: number): void {
  scores.set(id, (scores.get(id) ?? 0) + points);
}

/** Leaderboards (PRD 7.7): three ranked boards computed at request time —
 *  no stored scores. */
export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const sp = await searchParams;
  const is90d = sp.window === "90d";
  const cutoff90 = new Date(NOW.getTime() - 90 * DAY);
  const cutoff30 = new Date(NOW.getTime() - 30 * DAY);

  const completed = JOBS.filter(
    (j) =>
      j.status === "COMPLETED" &&
      (!is90d || (j.completedAt != null && new Date(j.completedAt) >= cutoff90)),
  );

  const jobCounts = new Map<string, number>();
  const grossWorked = new Map<string, number>();
  for (const job of completed) {
    for (const workerId of job.workerIds) {
      bump(jobCounts, workerId, 1);
      bump(grossWorked, workerId, job.grossValue);
    }
  }

  // Knowledge score, trailing 30 days: messages + 3x forum posts and replies
  // + 2x lesson completions.
  const knowledge = new Map<string, number>();
  for (const m of MESSAGES) {
    if (m.isShadowDraft || SYSTEM_SENDERS.has(m.senderId)) continue;
    if (new Date(m.at) >= cutoff30) bump(knowledge, m.senderId, 1);
  }
  for (const post of FORUM_POSTS) {
    if (new Date(post.at) >= cutoff30) bump(knowledge, post.authorId, 3);
    for (const reply of post.replies) {
      if (new Date(reply.at) >= cutoff30) bump(knowledge, reply.authorId, 3);
    }
  }
  for (const [id, count] of Object.entries(LESSON_COMPLETIONS)) bump(knowledge, id, 2 * count);

  return (
    <div>
      <PageHeader
        eyebrow="Leaderboards"
        title="Standings"
        meta="Computed from delivered work and the ledger — nothing stored."
      />
      <div className="flex flex-col gap-8 px-6 py-6">
        <section className="max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <Eyebrow as="h2">Jobs executed</Eyebrow>
            <div className="flex items-center gap-1.5">
              <LinkPill href="/dashboard/leaderboards" active={!is90d}>
                All-time
              </LinkPill>
              <LinkPill href="/dashboard/leaderboards?window=90d" active={is90d}>
                Last 90 days
              </LinkPill>
            </div>
          </div>
          <div className="mt-2">
            <BoardTable rows={rank(jobCounts, String)} figureHeader="Jobs" />
          </div>
        </section>

        <section className="max-w-2xl">
          <Eyebrow as="h2">Gross value worked</Eyebrow>
          <div className="mt-2">
            <BoardTable
              rows={rank(grossWorked, formatMoney)}
              figureHeader="Gross value worked"
              figureTitle="On team jobs every worker is credited the full gross."
            />
          </div>
        </section>

        <section className="max-w-2xl">
          <div className="flex items-baseline justify-between gap-4">
            <Eyebrow as="h2">Knowledge contributors</Eyebrow>
            <span className="figure text-2xs text-muted">Trailing 30 days</span>
          </div>
          <div className="mt-2">
            <BoardTable rows={rank(knowledge, String)} figureHeader="Score" />
          </div>
        </section>
      </div>
    </div>
  );
}
