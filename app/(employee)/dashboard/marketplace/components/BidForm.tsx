"use client";

import { useState, useTransition } from "react";
import { placeBid, updateBid } from "@/app/actions/marketplace";
import type { BidView } from "@/lib/queries/marketplace";

/** Place or edit a bid (PRD 7.1). Placement is optimistic: the row appears
 *  through onOptimistic and reconciles on the action result (PRD section 9). */
function figure(value: string): string {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BidForm({
  jobId,
  viewer,
  workerPool,
  bid,
  onOptimistic,
  onPlaced,
  onClose,
}: {
  jobId: string;
  viewer: { id: string; name: string };
  workerPool: string;
  /** When set, the form edits this PENDING bid instead of placing one. */
  bid?: BidView;
  onOptimistic?: (bid: BidView) => void;
  /** Confirmation echo per PRD 5.7: "Bid placed — 1,200.00 of the 6,500.00 pool." */
  onPlaced?: (message: string) => void;
  onClose?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const proposedSplit = String(formData.get("proposedSplit") ?? "").trim();
    const pitchText = String(formData.get("pitchText") ?? "").trim();
    setError(null);
    startTransition(async () => {
      if (bid) {
        const result = await updateBid({ bidId: bid.id, proposedSplit, pitchText: pitchText || undefined });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onClose?.();
        return;
      }
      onOptimistic?.({
        id: "bid-optimistic",
        jobId,
        memberId: viewer.id,
        memberName: viewer.name,
        proposedSplit,
        pitchText: pitchText || null,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      });
      const result = await placeBid({ jobId, proposedSplit, pitchText: pitchText || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onPlaced?.(
        `Bid placed — ${figure(result.data.proposedSplit)} of the ${figure(workerPool)} pool.`,
      );
    });
  }

  const field =
    "h-9 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted";

  return (
    <form action={submit} className="mt-3 max-w-xl space-y-3 rounded-m border border-line bg-raised p-4">
      <div className="grid grid-cols-[10rem_1fr] gap-3">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Your split</span>
          <input
            name="proposedSplit"
            type="text"
            inputMode="decimal"
            required
            defaultValue={bid?.proposedSplit}
            placeholder="1200.00"
            className={`${field} figure`}
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Pitch</span>
          <input
            name="pitchText"
            type="text"
            defaultValue={bid?.pitchText ?? ""}
            placeholder="Why you, in a sentence or two"
            className={field}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {bid ? "Save bid" : "Place bid"}
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-s border border-line px-3 text-sm text-secondary hover:text-primary"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
