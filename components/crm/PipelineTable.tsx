import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { STAGE_TONE, stageLabel } from "@/components/crm/stages";
import { formatDate, formatMoney } from "@/lib/format";
import { accountById, personById } from "@/lib/mock";
import type { MockDeal } from "@/lib/mock";

/** Days since creation, rendered like "29 d". */
function ageLabel(createdAt: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );
  return `${days} d`;
}

/** The dense pipeline table (PRD 7.11) — the default CRM view. */
export default function PipelineTable({ deals }: { deals: MockDeal[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow py-2 pr-4 text-left font-normal">Deal</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Account</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Owner</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Stage</th>
          <th className="eyebrow py-2 pr-4 text-right font-normal">Value</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Source</th>
          <th className="eyebrow py-2 pr-4 text-left font-normal">Age</th>
          <th className="eyebrow py-2 text-left font-normal">Last activity</th>
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
          deals.map((d) => {
            const account = accountById(d.accountId);
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
                  {account ? (
                    <Link
                      href={`/dashboard/crm/accounts/${account.id}`}
                      className="text-secondary hover:text-accent"
                    >
                      {account.name}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="pr-4">
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
                <td className="pr-4">
                  <span className="figure text-2xs uppercase text-secondary">
                    {d.source}
                  </span>
                </td>
                <td className="pr-4">
                  <span className="figure text-secondary">{ageLabel(d.createdAt)}</span>
                </td>
                <td>
                  <span className="figure text-secondary">
                    {formatDate(d.lastActivityAt)}
                  </span>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
