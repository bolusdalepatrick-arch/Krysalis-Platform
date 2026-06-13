import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { STAGE_TONE, stageLabel } from "@/components/crm/stages";
import { formatDate, formatMoney } from "@/lib/format";
import type { DealRowView } from "@/lib/queries/crm";

export type PipelineSortKey =
  | "deal"
  | "account"
  | "owner"
  | "stage"
  | "value"
  | "source"
  | "age"
  | "activity";

/** Days since creation, rendered like "29 d". */
function ageLabel(createdAt: string, now: Date): string {
  const days = Math.max(
    0,
    Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000),
  );
  return `${days} d`;
}

function SortHeader({
  label,
  column,
  sort,
  desc,
  href,
  align = "left",
}: {
  label: string;
  column: PipelineSortKey;
  sort: PipelineSortKey;
  desc: boolean;
  href: string;
  align?: "left" | "right";
}) {
  const active = sort === column;
  return (
    <th
      className={`py-2 pr-4 font-normal ${align === "right" ? "text-right" : "text-left"}`}
      aria-sort={active ? (desc ? "descending" : "ascending") : undefined}
    >
      <Link href={href} className={`eyebrow hover:text-accent ${active ? "text-accent" : ""}`}>
        {label}
        {active ? <span aria-hidden="true">{desc ? " ↓" : " ↑"}</span> : null}
      </Link>
    </th>
  );
}

/** The dense pipeline table (PRD 7.11) — the default CRM view, sortable by
 *  every column via the header links. */
export default function PipelineTable({
  deals,
  sort,
  desc,
  sortHrefs,
  now,
}: {
  deals: DealRowView[];
  sort: PipelineSortKey;
  desc: boolean;
  /** Header link targets, built by the page so filters survive sorting. */
  sortHrefs: Record<PipelineSortKey, string>;
  now: Date;
}) {
  const header = (label: string, column: PipelineSortKey, align?: "left" | "right") => (
    <SortHeader
      label={label}
      column={column}
      sort={sort}
      desc={desc}
      href={sortHrefs[column]}
      align={align}
    />
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          {header("Deal", "deal")}
          {header("Account", "account")}
          {header("Owner", "owner")}
          {header("Stage", "stage")}
          {header("Value", "value", "right")}
          {header("Source", "source")}
          {header("Age", "age")}
          {header("Last activity", "activity")}
        </tr>
      </thead>
      <tbody>
        {deals.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-6 text-sm text-secondary">
              No deals match these filters. Clear a stage or owner filter to
              widen the view.
            </td>
          </tr>
        ) : (
          deals.map((d) => (
            <tr key={d.id} className="h-9 border-b border-line">
              <td className="pr-4">
                <Link
                  href={`/dashboard/crm/deals/${d.id}`}
                  className="font-medium text-primary hover:text-accent"
                >
                  {d.title}
                </Link>
              </td>
              <td className="pr-4">
                <Link
                  href={`/dashboard/crm/accounts/${d.accountId}`}
                  className="text-secondary hover:text-accent"
                >
                  {d.accountName}
                </Link>
              </td>
              <td className="pr-4">
                <Link
                  href={`/dashboard/people/${d.ownerId}`}
                  className="text-secondary hover:text-accent"
                >
                  {d.ownerName}
                </Link>
              </td>
              <td className="pr-4">
                <StatusBadge tone={STAGE_TONE[d.stage]}>{stageLabel(d.stage)}</StatusBadge>
              </td>
              <td className="pr-4 text-right">
                {d.value !== null ? (
                  <span className="figure">{formatMoney(d.value)}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="pr-4">
                <span className="figure text-2xs uppercase text-secondary">{d.source}</span>
              </td>
              <td className="pr-4">
                <span className="figure text-secondary">{ageLabel(d.createdAt, now)}</span>
              </td>
              <td>
                <span className="figure text-secondary">{formatDate(d.lastActivityAt)}</span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
