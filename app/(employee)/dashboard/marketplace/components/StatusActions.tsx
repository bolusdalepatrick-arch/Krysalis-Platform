"use client";

import { useState, useTransition } from "react";
import {
  approveCompletion,
  requestChanges,
  startJob,
  submitForReview,
} from "@/app/actions/marketplace";
import Eyebrow from "@/components/Eyebrow";

/** The status machine's controls (PRD 7.1), shown to the roles that may
 *  pull each lever: start, submit for review (optional note), request
 *  changes (note required), approve completion. */
export default function StatusActions({
  jobId,
  status,
  isWorker,
  isAdmin,
}: {
  jobId: string;
  status: string;
  isWorker: boolean;
  isAdmin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "That didn't complete. Retry in a moment.");
      else setNote("");
    });
  };

  const primary =
    "h-8 w-full rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60";
  const secondary =
    "h-8 w-full rounded-s border border-line px-3 text-sm font-medium text-secondary hover:text-primary disabled:opacity-60";
  const noteField =
    "h-9 w-full rounded-s border border-line bg-inset px-3 text-sm text-primary placeholder:text-muted";

  const showStart = status === "ASSIGNED" && (isWorker || isAdmin);
  const showSubmit = status === "IN_PROGRESS" && (isWorker || isAdmin);
  const showReviewControls = status === "REVIEW" && isAdmin;
  if (!showStart && !showSubmit && !showReviewControls) return null;

  return (
    <section>
      <Eyebrow as="h2">Next step</Eyebrow>
      <div className="mt-2 space-y-2">
        {showStart ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => startJob({ jobId }))}
            className={primary}
          >
            Start job
          </button>
        ) : null}
        {showSubmit ? (
          <>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note for the channel (optional)"
              aria-label="Note for the channel"
              className={noteField}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => submitForReview({ jobId, note: note || undefined }))}
              className={primary}
            >
              Submit for review
            </button>
          </>
        ) : null}
        {showReviewControls ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => approveCompletion({ jobId }))}
              className={primary}
            >
              Approve completion
            </button>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to change"
              aria-label="What needs to change"
              className={noteField}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => requestChanges({ jobId, note }))}
              className={secondary}
            >
              Request changes
            </button>
          </>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </section>
  );
}
