"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { fetchMessagesAfter, sendMessage } from "@/app/actions/chat";
import MessageRow from "@/components/channels/MessageRow";
import ShadowDraftPanel from "@/components/channels/ShadowDraftPanel";
import { formatDate } from "@/lib/format";
import type { MessageView } from "@/lib/queries/channels";

const POLL_MS = 5000;

/** Newest version of each message wins; thread order by time, then id. */
function mergeById(current: MessageView[], incoming: MessageView[]): MessageView[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

function groupByDay(messages: MessageView[]): { day: string; items: MessageView[] }[] {
  const groups: { day: string; items: MessageView[] }[] = [];
  for (const m of messages) {
    const day = formatDate(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }
  return groups;
}

/**
 * The live thread (PRD 7.3): day-grouped messages, optimistic send (the
 * third and final sanctioned useOptimistic), and a 5-second poll that
 * pauses while the document is hidden. Shared by the hub channel pages and
 * the client portal — the token scopes restyle it.
 */
export default function ChannelThread({
  channelId,
  initialMessages,
  canPost,
  canDecideDrafts,
  placeholder,
  audience,
  posters,
  viewer,
  linkSenders = true,
  showTiers = true,
  prefill,
}: {
  channelId: string;
  initialMessages: MessageView[];
  canPost: boolean;
  canDecideDrafts: boolean;
  placeholder: string;
  audience: string;
  /** Who may post, shown when the viewer can't (department channels). */
  posters: string;
  viewer: { id: string; name: string; tier: number | null };
  linkSenders?: boolean;
  /** Portal threads suppress tier badges — internal vocabulary (PRD 7.8). */
  showTiers?: boolean;
  /** A quiet affordance that prefills the composer (PRD 7.8). */
  prefill?: { label: string; text: string };
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (state: MessageView[], next: MessageView) => mergeById(state, [next]),
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startTransition] = useTransition();
  const latestAt = useRef(initialMessages.at(-1)?.createdAt ?? "1970-01-01T00:00:00.000Z");
  const optimisticSeq = useRef(0);

  // Server refreshes (revalidatePath) replace the base. Locally newer
  // regular messages survive the merge; drafts never do — a draft decided
  // in another window must not resurrect here.
  useEffect(() => {
    setMessages((current) => {
      const serverIds = new Set(initialMessages.map((m) => m.id));
      const serverMax = initialMessages.at(-1)?.createdAt ?? "";
      const keep = current.filter(
        (m) => !serverIds.has(m.id) && !m.isShadowDraft && m.createdAt > serverMax,
      );
      return mergeById(initialMessages, keep);
    });
  }, [initialMessages]);

  useEffect(() => {
    // Removing a tail draft can move this backward — harmless, the poll
    // dedupes by id and only widens the overlap.
    latestAt.current = messages.at(-1)?.createdAt ?? latestAt.current;
  }, [messages]);

  // Freshness (PRD 7.3): poll every 5s, paused on document.hidden. The
  // cursor backs off ten seconds so a row committed out of timestamp order
  // is still caught; id-dedupe absorbs the overlap.
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const after = new Date(Date.parse(latestAt.current) - 10_000).toISOString();
      const result = await fetchMessagesAfter({ channelId, after });
      if (result.ok && result.data.length > 0) {
        setMessages((current) => mergeById(current, result.data));
      }
    };
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [channelId]);

  function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setError(null);
    startTransition(async () => {
      optimisticSeq.current += 1;
      addOptimistic({
        id: `optimistic-${optimisticSeq.current}`,
        senderId: viewer.id,
        senderName: viewer.name,
        senderIsSystem: false,
        senderTier: viewer.tier,
        body,
        isShadowDraft: false,
        approvedById: null,
        approvedByName: null,
        createdAt: new Date().toISOString(),
        bookingCard: null,
      });
      const result = await sendMessage({ channelId, body });
      if (result.ok) {
        setMessages((current) => mergeById(current, [result.data]));
        setDraft("");
      } else {
        setError(result.error);
      }
    });
  }

  const groups = groupByDay(optimistic);

  return (
    <div>
      {groups.length === 0 ? (
        <p className="py-8 text-sm text-secondary">
          No messages yet. Anything posted here is visible to {audience}.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.day}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="eyebrow">{group.day}</span>
                <span aria-hidden className="h-px flex-1 bg-line" />
              </div>
              <div className="mt-4 space-y-4">
                {group.items.map((m) =>
                  m.isShadowDraft ? (
                    <ShadowDraftPanel
                      key={m.id}
                      message={m}
                      active={canDecideDrafts}
                      viewerName={viewer.name}
                      onApproved={(updated) =>
                        setMessages((current) => mergeById(current, [updated]))
                      }
                      onDiscarded={(id) =>
                        setMessages((current) => current.filter((x) => x.id !== id))
                      }
                    />
                  ) : (
                    <MessageRow
                      key={m.id}
                      message={m}
                      linkSender={linkSenders}
                      showTier={showTiers}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {canPost ? (
        <form
          className="mt-6 flex items-center gap-2 rounded-m border border-line bg-raised p-2"
          action={send}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-8 min-w-0 flex-1 bg-transparent px-2 text-md text-primary placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={sending}
            className="h-8 shrink-0 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted">Posting here is for {posters}.</p>
      )}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {canPost && prefill ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setDraft(prefill.text)}
            className="text-sm text-muted underline underline-offset-2 hover:text-primary"
          >
            {prefill.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}
