import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { STAGE_TONE, stageLabel } from "@/components/crm/stages";
import { formatMoney } from "@/lib/format";
import { personById } from "@/lib/mock";
import type { MockDeal } from "@/lib/mock";

/** The deals table on an account page (PRD 7.11). */
export default function AccountDealsTable({ deals }: { deals: MockDeal[] }) {
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow py-2 pr-4 text-left font-normal">Deal</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Stage</th>
          <th className="eyebrow py-2 pr-4 text-right font-normal">Value</th>
          <th className="eyebrow py-2 text-left font-normal">Owner</th>
        </tr>
      </thead>
      <tbody>
        {deals.map((d) => {
          const owner = personById(d.ownerId);
          return (
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
                <StatusBadge tone={STAGE_TONE[d.stage]}>
                  {stageLabel(d.stage)}
                </StatusBadge>
              </td>
              <td className="pr-4 text-right">
                {d.value != null ? (
                  <span className="figure">{formatMoney(d.value)}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                {owner ? (
                  <Link
                    href={`/dashboard/people/${owner.id}`}
                    className="text-secondary hover:text-accent"
                  >
                    {owner.name}
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
