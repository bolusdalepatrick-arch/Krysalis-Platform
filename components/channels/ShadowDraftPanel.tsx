"use client";

import { useState, useTransition } from "react";
import { approveShadowDraft, discardShadowDraft } from "@/app/actions/chat";
import ChrysalisGlyph from "@/components/ChrysalisGlyph";
import type { MessageView } from "@/lib/queries/channels";

/** A Shadow progress draft (PRD 7.3): inset panel wearing the chrysalis
 *  glyph, visible only to the job's workers, moderators, and admins.
 *  Approve (optionally after an edit) posts it to the channel; discard
 *  deletes it. */
export default function ShadowDraftPanel({
  message,
  active,
  viewerName,
  onApproved,
  onDiscarded,
}: {
  message: MessageView;
  active: boolean;
  viewerName: string;
  onApproved: (updated: MessageView) => void;
  onDiscarded: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(message.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve() {
    setError(null);
    startTransition(async () => {
      const edited = editing && body.trim() !== message.body ? body.trim() : undefined;
      const result = await approveShadowDraft({ messageId: message.id, body: edited });
      if (!result.ok) {
        // Decided in another window: drop the stale panel; the next poll
        // or refresh carries the truth.
        if (result.error.includes("already been decided")) onDiscarded(message.id);
        else setError(result.error);
        return;
      }
      onApproved({
        ...message,
        body: edited ?? message.body,
        isShadowDraft: false,
        approvedByName: viewerName,
        createdAt: new Date().toISOString(),
      });
    });
  }

  function discard() {
    setError(null);
    startTransition(async () => {
      const result = await discardShadowDraft({ messageId: message.id });
      if (!result.ok) {
        if (result.error.includes("already been decided")) onDiscarded(message.id);
        else setError(result.error);
        return;
      }
      onDiscarded(message.id);
    });
  }

  const secondary =
    "h-7 rounded-s border border-line px-2.5 text-xs font-medium text-secondary hover:text-primary disabled:opacity-60";

  return (
    <div className="rounded-m border border-line bg-raised p-3">
      <div className="figure flex items-center gap-1.5 text-2xs text-muted">
        <ChrysalisGlyph />
        <span>Shadow · draft awaiting approval</span>
      </div>
      {editing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          aria-label="Edit the draft"
          className="mt-2 w-full rounded-s border border-line bg-inset px-3 py-2 text-sm text-primary"
        />
      ) : (
        <p className="mt-2 text-sm text-primary">{message.body}</p>
      )}
      {active ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={approve}
            className="h-7 rounded-s bg-accent px-2.5 text-xs font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing((v) => !v)}
            className={secondary}
          >
            {editing ? "Keep the original" : "Edit"}
          </button>
          <button type="button" disabled={pending} onClick={discard} className={secondary}>
            Discard
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
