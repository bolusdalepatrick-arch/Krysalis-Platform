import PageHeader from "@/components/PageHeader";
import LinkPill from "@/components/LinkPill";
import PipelineBoard from "@/components/crm/PipelineBoard";
import PipelineTable from "@/components/crm/PipelineTable";
import { STAGE_ORDER, stageLabel } from "@/components/crm/stages";
import { DEALS, personById } from "@/lib/mock";
import type { DealStage, MockPerson } from "@/lib/mock";

function crmHref(params: { view?: string; stage?: string; owner?: string }): string {
  const q = new URLSearchParams();
  if (params.view === "board") q.set("view", "board");
  if (params.stage) q.set("stage", params.stage);
  if (params.owner) q.set("owner", params.owner);
  const s = q.toString();
  return s ? `/dashboard/crm?${s}` : "/dashboard/crm";
}

/** Pipeline (PRD 7.11): dense table by default, board grouping on toggle. */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; stage?: string; owner?: string }>;
}) {
  const params = await searchParams;
  const board = params.view === "board";

  const stageFilter = STAGE_ORDER.includes(params.stage as DealStage)
    ? (params.stage as DealStage)
    : undefined;
  const ownerIds = [...new Set(DEALS.map((d) => d.ownerId))];
  const owners = ownerIds
    .map((id) => personById(id))
    .filter((p): p is MockPerson => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  const ownerFilter = ownerIds.includes(params.owner ?? "") ? params.owner : undefined;

  const filtered = DEALS.filter(
    (d) =>
      (!stageFilter || d.stage === stageFilter) &&
      (!ownerFilter || d.ownerId === ownerFilter),
  );

  const open = DEALS.filter((d) => d.stage !== "WON" && d.stage !== "LOST").length;
  const won = DEALS.filter((d) => d.stage === "WON").length;
  const lost = DEALS.filter((d) => d.stage === "LOST").length;

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Pipeline"
        meta={
          <>
            <span className="figure">{DEALS.length}</span> deals ·{" "}
            <span className="figure">{open}</span> open ·{" "}
            <span className="figure">{won}</span> won ·{" "}
            <span className="figure">{lost}</span> lost
          </>
        }
        actions={
          <>
            <div className="flex items-center gap-1">
              <LinkPill
                href={crmHref({ stage: stageFilter, owner: ownerFilter })}
                active={!board}
              >
                Table
              </LinkPill>
              <LinkPill
                href={crmHref({ view: "board", stage: stageFilter, owner: ownerFilter })}
                active={board}
              >
                Board
              </LinkPill>
            </div>
            <button
              type="button"
              disabled
              className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
            >
              New deal
            </button>
          </>
        }
      />
      <div className="px-6 py-5">
        {board ? (
          <PipelineBoard deals={DEALS} />
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
                {owners.map((o) => (
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
              <PipelineTable deals={filtered} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
