import type { DealStage } from "@prisma/client";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import LinkPill from "@/components/LinkPill";
import NewDealPanel from "@/components/crm/NewDealPanel";
import PipelineBoard from "@/components/crm/PipelineBoard";
import PipelineTable, { type PipelineSortKey } from "@/components/crm/PipelineTable";
import { STAGE_ORDER, stageLabel } from "@/components/crm/stages";
import { getSessionUser } from "@/lib/auth";
import { pipelineData, type DealRowView } from "@/lib/queries/crm";

const SORT_KEYS: PipelineSortKey[] = [
  "deal",
  "account",
  "owner",
  "stage",
  "value",
  "source",
  "age",
  "activity",
];

interface Params {
  view?: string;
  stage?: string;
  owner?: string;
  sort?: string;
  dir?: string;
}

function crmHref(params: Params): string {
  const q = new URLSearchParams();
  if (params.view === "board") q.set("view", "board");
  if (params.stage) q.set("stage", params.stage);
  if (params.owner) q.set("owner", params.owner);
  if (params.sort) q.set("sort", params.sort);
  if (params.dir === "desc") q.set("dir", "desc");
  const s = q.toString();
  return s ? `/dashboard/crm?${s}` : "/dashboard/crm";
}

function compare(a: DealRowView, b: DealRowView, key: PipelineSortKey): number {
  switch (key) {
    case "deal":
      return a.title.localeCompare(b.title);
    case "account":
      return a.accountName.localeCompare(b.accountName);
    case "owner":
      return a.ownerName.localeCompare(b.ownerName);
    case "stage":
      return STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    case "value":
      return Number(a.value ?? 0) - Number(b.value ?? 0);
    case "source":
      return a.source.localeCompare(b.source);
    case "age":
      // Older deal = larger age: ascending age is descending createdAt.
      return b.createdAt.localeCompare(a.createdAt);
    case "activity":
      return a.lastActivityAt.localeCompare(b.lastActivityAt);
  }
}

/** Pipeline (PRD 7.11): dense table by default — sortable, filterable by
 *  stage and owner — board grouping on toggle. */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  const board = params.view === "board";
  const stageFilter = STAGE_ORDER.includes(params.stage as DealStage)
    ? (params.stage as DealStage)
    : undefined;

  const data = await pipelineData({ stage: stageFilter, ownerId: undefined });
  const ownerFilter = data.owners.some((o) => o.id === params.owner)
    ? params.owner
    : undefined;

  const sort = SORT_KEYS.includes(params.sort as PipelineSortKey)
    ? (params.sort as PipelineSortKey)
    : "activity";
  const desc = params.sort ? params.dir === "desc" : true;

  const deals = data.deals
    .filter((d) => !ownerFilter || d.ownerId === ownerFilter)
    .sort((a, b) => (desc ? -compare(a, b, sort) : compare(a, b, sort)));

  const base = { stage: stageFilter, owner: ownerFilter };
  const sortHrefs = Object.fromEntries(
    SORT_KEYS.map((key) => [
      key,
      crmHref({
        ...base,
        sort: key,
        // Clicking the active column flips direction; a new column starts
        // ascending.
        dir: sort === key && !desc ? "desc" : undefined,
      }),
    ]),
  ) as Record<PipelineSortKey, string>;

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Pipeline"
        meta={
          <>
            <span className="figure">{data.counts.total}</span> deals ·{" "}
            <span className="figure">{data.counts.open}</span> open ·{" "}
            <span className="figure">{data.counts.won}</span> won ·{" "}
            <span className="figure">{data.counts.lost}</span> lost
          </>
        }
        actions={
          <div className="flex items-center gap-1">
            <LinkPill href={crmHref(base)} active={!board}>
              Table
            </LinkPill>
            <LinkPill href={crmHref({ ...base, view: "board" })} active={board}>
              Board
            </LinkPill>
          </div>
        }
      />
      <NewDealPanel accounts={data.accounts} />
      <div className="px-6 py-5">
        {board ? (
          <PipelineBoard deals={deals} />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <LinkPill href={crmHref({ owner: ownerFilter })} active={!stageFilter}>
                  All stages
                </LinkPill>
                {STAGE_ORDER.map((s) => (
                  <LinkPill
                    key={s}
                    href={crmHref({ stage: s, owner: ownerFilter })}
                    active={stageFilter === s}
                  >
                    {stageLabel(s)}
                  </LinkPill>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <LinkPill href={crmHref({ stage: stageFilter })} active={!ownerFilter}>
                  All owners
                </LinkPill>
                {data.owners.map((o) => (
                  <LinkPill
                    key={o.id}
                    href={crmHref({ stage: stageFilter, owner: o.id })}
                    active={ownerFilter === o.id}
                  >
                    {o.name}
                  </LinkPill>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <PipelineTable
                deals={deals}
                sort={sort}
                desc={desc}
                sortHrefs={sortHrefs}
                now={new Date()}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
