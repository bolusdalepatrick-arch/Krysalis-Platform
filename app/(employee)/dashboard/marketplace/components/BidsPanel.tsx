"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import StatusBadge, { type StatusTone } from "@/components/StatusBadge";
import { acceptBid, rejectBid, withdrawBid } from "@/app/actions/marketplace";
import type { ActionResult } from "@/lib/actions";
import { formatDate, formatMoney } from "@/lib/format";
import type { BidView } from "@/lib/queries/marketplace";
import BidForm from "./BidForm";

const TONE: Record<BidView["status"], StatusTone> = {
  PENDING: "neutral",
  ACCEPTED: "ok",
  REJECTED: "danger",
};
const LABEL: Record<BidView["status"], string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};
const ORDER: Record<BidView["status"], number> = { ACCEPTED: 0, PENDING: 1, REJECTED: 2 };

/** The bid table plus every bid affordance (PRD 7.1): place (optimistic),
 *  edit and withdraw while pending, accept and reject for admins. */
export default function BidsPanel({
  jobId,
  jobStatus,
  workerPool,
  poolRemainder,
  viewer,
  bids,
}: {
  jobId: string;
  jobStatus: string;
  workerPool: string;
  poolRemainder: string;
  viewer: { id: string; name: string; role: string };
  bids: BidView[];
}) {
  const [optimisticBids, addOptimistic] = useOptimistic(
    bids,
    (state: BidView[], bid: BidView) => [...state, bid],
  );
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAdmin = viewer.role === "ADMIN";
  const own = bids.find((b) => b.memberId === viewer.id);
  const canPlace = jobStatus === "OPEN" && !own;

  const decide = (
    action: (input: unknown) => Promise<ActionResult<void>>,
    bidId: string,
  ) => {
    setRowError(null);
    startTransition(async () => {
      const result = await action({ bidId });
      if (!result.ok) setRowError(result.error);
    });
  };

  const sorted = [...optimisticBids].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.createdAt.localeCompare(b.createdAt),
  );
  const rowButton =
    "h-7 rounded-s border border-line px-2.5 text-xs font-medium text-secondary hover:text-primary disabled:opacity-60";

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">Bids</h2>
        <p className="figure text-xs text-muted">
          Unallocated pool: {formatMoney(poolRemainder)}
        </p>
      </div>
      {sorted.length > 0 ? (
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-line-strong">
              <th className="eyebrow py-2 pr-4 font-normal">Bidder</th>
              <th className="eyebrow py-2 pr-4 text-right font-normal">Split</th>
              <th className="eyebrow py-2 pr-4 font-normal">Pitch</th>
              <th className="eyebrow py-2 pr-4 font-normal">Status</th>
              <th className="eyebrow py-2 pr-4 font-normal">Placed</th>
              <th className="eyebrow py-2 font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((bid) => (
              <tr key={bid.id} className="border-b border-line align-top">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/dashboard/people/${bid.memberId}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-accent"
                  >
                    <AvatarBadge id={bid.memberId} name={bid.memberName} size={22} />
                    <span className="whitespace-nowrap">{bid.memberName}</span>
                  </Link>
                </td>
                <td className="figure py-2.5 pr-4 text-right text-sm text-primary">
                  {formatMoney(bid.proposedSplit)}
                </td>
                <td className="py-2.5 pr-4 text-sm text-secondary">{bid.pitchText}</td>
                <td className="py-2.5 pr-4">
                  <StatusBadge tone={TONE[bid.status]}>{LABEL[bid.status]}</StatusBadge>
                </td>
                <td className="figure whitespace-nowrap py-2.5 pr-4 text-sm text-secondary">
                  {formatDate(bid.createdAt)}
                </td>
                <td className="py-2.5">
                  {bid.status === "PENDING" && bid.id !== "bid-optimistic" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {bid.memberId === viewer.id ? (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setEditing(true)}
                            className={rowButton}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => decide(withdrawBid, bid.id)}
                            className={rowButton}
                          >
                            Withdraw
                          </button>
                        </>
                      ) : null}
                      {isAdmin ? (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => decide(acceptBid, bid.id)}
                            className="h-7 rounded-s bg-accent px-2.5 text-xs font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => decide(rejectBid, bid.id)}
                            className={rowButton}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-2 text-sm text-secondary">
          No bids yet. Bids placed while the posting is open appear here.
        </p>
      )}
      {rowError ? <p className="mt-2 text-sm text-danger">{rowError}</p> : null}
      {confirmation ? <p className="figure mt-2 text-sm text-ok">{confirmation}</p> : null}
      {canPlace ? (
        <BidForm
          jobId={jobId}
          viewer={viewer}
          workerPool={workerPool}
          onOptimistic={addOptimistic}
          onPlaced={setConfirmation}
        />
      ) : null}
      {own && own.status === "PENDING" && editing ? (
        <BidForm
          jobId={jobId}
          viewer={viewer}
          workerPool={workerPool}
          bid={own}
          onClose={() => setEditing(false)}
        />
      ) : null}
      {jobStatus !== "OPEN" && !own ? (
        <p className="mt-2 text-sm text-muted">Bidding is closed on this posting.</p>
      ) : null}
    </section>
  );
}
