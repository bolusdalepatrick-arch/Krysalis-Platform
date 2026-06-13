import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import { STAGE_ORDER, stageLabel } from "@/components/crm/stages";
import { formatMoney, initials } from "@/lib/format";
import type { DealRowView } from "@/lib/queries/crm";

/** Board view (PRD 7.11): six stage columns of single-line rows — a grouping,
 *  not a card grid (rule 5.1.9 holds either way). */
export default function PipelineBoard({ deals }: { deals: DealRowView[] }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {STAGE_ORDER.map((stage) => {
        const entries = deals.filter((d) => d.stage === stage);
        return (
          <div key={stage}>
            <div className="flex items-baseline justify-between">
              <Eyebrow as="h2">{stageLabel(stage)}</Eyebrow>
              <span className="figure text-2xs text-muted">{entries.length}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {entries.map((d) => (
                <div
                  key={d.id}
                  className="flex h-9 items-center justify-between gap-2 rounded-s border border-line bg-surface px-2.5"
                >
                  <Link
                    href={`/dashboard/crm/deals/${d.id}`}
                    className="truncate text-xs text-primary hover:text-accent"
                  >
                    {d.title}
                  </Link>
                  <span className="figure shrink-0 text-2xs text-muted">
                    {d.value !== null ? formatMoney(d.value) : initials(d.ownerName)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
