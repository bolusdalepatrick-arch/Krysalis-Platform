import Eyebrow from "@/components/Eyebrow";
import LinkPill from "@/components/LinkPill";
import PageHeader from "@/components/PageHeader";
import BoardTable, { type BoardRow } from "@/components/leaderboards/BoardTable";
import { formatMoney } from "@/lib/format";
import {
  contributorsBoard,
  grossValueWorkedBoard,
  jobsExecutedBoard,
  type BoardEntry,
} from "@/lib/leaderboards";

const DAY = 86_400_000;

function toRows(entries: BoardEntry[]): BoardRow[] {
  return entries.map((e) => ({
    userId: e.userId,
    name: e.name,
    tierLevel: e.tierLevel,
    figure: e.figure,
  }));
}

/** Leaderboards (PRD 7.7): three ranked boards computed at request time by
 *  indexed queries — no stored scores. */
export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const sp = await searchParams;
  const is90d = sp.window === "90d";
  const now = new Date();
  const since = is90d ? new Date(now.getTime() - 90 * DAY) : undefined;

  const [jobsBoard, grossBoard, contributors] = await Promise.all([
    jobsExecutedBoard({ since }),
    grossValueWorkedBoard({}, formatMoney),
    contributorsBoard(now),
  ]);

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
            <BoardTable
              rows={toRows(jobsBoard)}
              figureHeader="Jobs"
              emptyLabel={
                is90d
                  ? "No jobs completed in the last 90 days."
                  : "No completed jobs yet. Finished work ranks here."
              }
            />
          </div>
        </section>

        <section className="max-w-2xl">
          <Eyebrow as="h2">Gross value worked</Eyebrow>
          <div className="mt-2">
            <BoardTable
              rows={toRows(grossBoard)}
              figureHeader="Gross value worked"
              figureTitle="On team jobs every worker is credited the full gross."
              emptyLabel="No completed jobs yet. Gross value ranks here as work ships."
            />
          </div>
        </section>

        <section className="max-w-2xl">
          <div className="flex items-baseline justify-between gap-4">
            <Eyebrow as="h2">Knowledge contributors</Eyebrow>
            <span className="figure text-2xs text-muted">Trailing 30 days</span>
          </div>
          <div className="mt-2">
            <BoardTable
              rows={toRows(contributors)}
              figureHeader="Score"
              figureTitle="Messages + 3x forum posts + 2x lessons, last 30 days. Shadow output and system users excluded."
              emptyLabel="No contributions in the last 30 days yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
