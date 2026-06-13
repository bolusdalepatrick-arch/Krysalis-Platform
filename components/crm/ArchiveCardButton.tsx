"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveBookingCard } from "@/app/actions/crm";

/** The one ARCHIVED path (PRD 7.12, ruling pre-M5): an admin archives an
 *  expired, unclaimed card. No auto-archival. */
export default function ArchiveCardButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function archive() {
    setError(null);
    startTransition(async () => {
      const result = await archiveBookingCard({ cardId });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={archive}
        disabled={pending}
        className="h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary disabled:opacity-60"
      >
        {pending ? "Archiving" : "Archive"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
