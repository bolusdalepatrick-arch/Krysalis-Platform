"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimBookingCard } from "@/app/actions/crm";
import { useToast } from "@/components/toast/ToastProvider";

/** The one button on a booking card (PRD 7.12). Deliberately not
 *  optimistic: two people race this, so it shows a pending state and the
 *  result is authoritative — the loser reads the truth in place. */
export default function ClaimButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function claim() {
    setError(null);
    startTransition(async () => {
      const result = await claimBookingCard({ cardId });
      if (result.ok) {
        push(
          `Claimed — the discovery call is yours. Deal opened under ${result.data.accountName}.`,
        );
      } else {
        // The refresh below swaps this card to its claimed state, which
        // unmounts the inline sentence — the toast outlives the refresh so
        // the loser actually reads "Already claimed by {name}."
        setError(result.error);
        push(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={claim}
        disabled={pending}
        className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Claiming" : "Claim"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
