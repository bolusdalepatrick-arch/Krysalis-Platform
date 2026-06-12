"use client";

import { useState } from "react";
import { HumanAvatar } from "@/components/Avatars";
import { useApp } from "@/lib/state";

const MOCK_REPLIES = [
  "Good point — adding this to the next sync agenda.",
  "Strong +1. Happy to help make it happen.",
  "Interesting — do we have data to back this up?",
  "Let's pilot it for two weeks and review.",
];

export default function ForumFeed() {
  const { state, dispatch } = useApp();
  const [sort, setSort] = useState<"top" | "new">("top");
  const [voted, setVoted] = useState<Set<string>>(new Set());

  const posts = state.posts
    .filter((p) => p.departmentId === state.activeDepartment)
    .sort((a, b) => (sort === "top" ? b.upvotes - a.upvotes : b.order - a.order));

  function vote(postId: string) {
    const next = new Set(voted);
    if (next.has(postId)) {
      next.delete(postId);
      dispatch({ type: "upvote", postId, delta: -1 });
    } else {
      next.add(postId);
      dispatch({ type: "upvote", postId, delta: 1 });
    }
    setVoted(next);
  }

  function reply(postId: string, n: number) {
    dispatch({
      type: "reply",
      postId,
      reply: {
        id: `r-${Date.now()}`,
        author: "You",
        time: "Just now",
        text: MOCK_REPLIES[n % MOCK_REPLIES.length],
      },
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-3 py-4 md:px-6 md:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Feedback & Discourse</h1>
            <p className="text-xs text-soft">Long-form ideas, proposals and debate for this department.</p>
          </div>
          <div className="flex shrink-0 rounded-full border border-ink/15 bg-surface/50 p-1">
            {(["top", "new"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold capitalize transition-colors ${
                  sort === s ? "bg-accent text-canvas" : "text-soft hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((p, i) => (
            <article key={p.id} className="card-pop rounded-2xl border border-ink/10 bg-surface/50 p-4 md:p-5">
              <div className="flex items-center gap-2.5">
                <HumanAvatar name={p.author} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.author}</p>
                  <p className="text-[11px] text-soft">{p.time}</p>
                </div>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold leading-snug md:text-lg">{p.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{p.body}</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => vote(p.id)}
                  aria-pressed={voted.has(p.id)}
                  className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    voted.has(p.id)
                      ? "border-accent/60 bg-accent/15 text-accent"
                      : "border-ink/15 text-soft hover:border-accent/40 hover:text-ink"
                  }`}
                >
                  ▲ {p.upvotes}
                </button>
                <button
                  onClick={() => reply(p.id, p.replies.length)}
                  className="min-h-11 rounded-xl border border-ink/15 px-4 text-sm font-medium text-soft transition-colors hover:border-accent/40 hover:text-ink"
                >
                  Reply
                </button>
                <span className="ml-auto text-xs text-soft">
                  {p.replies.length} {p.replies.length === 1 ? "reply" : "replies"}
                </span>
              </div>

              {/* nested replies — one indent level (capped at one on mobile too) */}
              {p.replies.length > 0 && (
                <div className="mt-3 space-y-3 border-l-2 border-ink/10 pl-3 md:pl-4">
                  {p.replies.map((r) => (
                    <div key={r.id} className="rounded-xl bg-canvas/50 p-3">
                      <p className="text-xs font-medium text-ink">
                        {r.author} <span className="font-normal text-soft">· {r.time}</span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink/85">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
