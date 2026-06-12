import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import StatusBadge, { type StatusTone } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import { personById } from "@/lib/mock";
import type { BidStatus, MockBid } from "@/lib/mock";

const STATUS_ORDER: Record<BidStatus, number> = { ACCEPTED: 0, PENDING: 1, REJECTED: 2 };
const STATUS_TONE: Record<BidStatus, StatusTone> = {
  PENDING: "neutral",
  ACCEPTED: "ok",
  REJECTED: "danger",
};
const STATUS_LABEL: Record<BidStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

/** The bid table (PRD 7.1): a real table — accepted bids first, then pending,
 *  then rejected; splits right-aligned in mono. */
export default function BidTable({ bids }: { bids: MockBid[] }) {
  const sorted = [...bids].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.createdAt.localeCompare(b.createdAt),
  );

  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-line-strong">
          <th className="eyebrow py-2 pr-4 font-normal">Bidder</th>
          <th className="eyebrow py-2 pr-4 text-right font-normal">Split</th>
          <th className="eyebrow py-2 pr-4 font-normal">Pitch</th>
          <th className="eyebrow py-2 pr-4 font-normal">Status</th>
          <th className="eyebrow py-2 font-normal">Placed</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((bid) => {
          const person = personById(bid.memberId);
          return (
            <tr key={bid.id} className="border-b border-line align-top">
              <td className="py-2.5 pr-4">
                {person ? (
                  <Link
                    href={`/dashboard/people/${person.id}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-accent"
                  >
                    <AvatarBadge id={person.id} name={person.name} size={22} />
                    <span className="whitespace-nowrap">{person.name}</span>
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="figure py-2.5 pr-4 text-right text-sm text-primary">
                {formatMoney(bid.proposedSplit)}
              </td>
              <td className="py-2.5 pr-4 text-sm text-secondary">{bid.pitchText}</td>
              <td className="py-2.5 pr-4">
                <StatusBadge tone={STATUS_TONE[bid.status]}>
                  {STATUS_LABEL[bid.status]}
                </StatusBadge>
              </td>
              <td className="figure whitespace-nowrap py-2.5 text-sm text-secondary">
                {formatDate(bid.createdAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
