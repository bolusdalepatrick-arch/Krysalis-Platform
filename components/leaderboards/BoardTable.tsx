import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import TierBadge from "@/components/TierBadge";

export interface BoardRow {
  userId: string;
  name: string;
  tierLevel: number;
  /** Pre-formatted figure for the right-aligned column. */
  figure: string;
}

/** One ranked board (PRD 7.7): rank in mono, member with tier badge, a single
 *  right-aligned figure. No charts, no stored scores. */
export default function BoardTable({
  rows,
  figureHeader,
  figureTitle,
  emptyLabel,
}: {
  rows: BoardRow[];
  figureHeader: string;
  figureTitle?: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-secondary">{emptyLabel}</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow h-9 w-14 px-3 text-left font-normal">Rank</th>
          <th className="eyebrow h-9 px-3 text-left font-normal">Member</th>
          <th className="eyebrow h-9 px-3 text-right font-normal" title={figureTitle}>
            {figureHeader}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.userId} className="h-9 border-b border-line">
            <td className="figure px-3 text-muted">{i + 1}</td>
            <td className="px-3">
              <span className="flex items-center gap-2">
                <AvatarBadge id={row.userId} name={row.name} size={20} />
                <Link
                  href={`/dashboard/people/${row.userId}`}
                  className="font-medium text-primary hover:text-accent"
                >
                  {row.name}
                </Link>
                <TierBadge level={row.tierLevel} />
              </span>
            </td>
            <td className="figure px-3 text-right text-primary">{row.figure}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
