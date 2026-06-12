import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import StatusBadge from "@/components/StatusBadge";
import { TIER_NAMES } from "@/lib/mock";
import type { MockPerson } from "@/lib/mock";

export interface BoardRow {
  person: MockPerson;
  /** Pre-formatted figure for the right-aligned column. */
  figure: string;
}

/** One ranked board (PRD 7.7): rank in mono, member with tier badge, a single
 *  right-aligned figure. No charts, no stored scores. */
export default function BoardTable({
  rows,
  figureHeader,
  figureTitle,
}: {
  rows: BoardRow[];
  figureHeader: string;
  figureTitle?: string;
}) {
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
          <tr key={row.person.id} className="h-9 border-b border-line">
            <td className="figure px-3 text-muted">{i + 1}</td>
            <td className="px-3">
              <span className="flex items-center gap-2">
                <AvatarBadge id={row.person.id} name={row.person.name} size={20} />
                <Link
                  href={`/dashboard/people/${row.person.id}`}
                  className="font-medium text-primary hover:text-accent"
                >
                  {row.person.name}
                </Link>
                <StatusBadge tone="gold">{TIER_NAMES[row.person.tier]}</StatusBadge>
              </span>
            </td>
            <td className="figure px-3 text-right text-primary">{row.figure}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
