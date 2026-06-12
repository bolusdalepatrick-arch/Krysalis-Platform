"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import Markdown from "@/components/Markdown";
import { useApp } from "@/lib/state";
import { CLIENT_ASSETS } from "@/lib/data";

/**
 * Client Workspace (PRD §6) — Theme B only. Minimalist: no departments,
 * agents, forum or internal goals. Guide + info bar are moderator-edited
 * in /settings and reflect here live.
 */
export default function ClientPortal() {
  const { state, dispatch } = useApp();
  const msgs = state.infoMessages;
  const [slide, setSlide] = useState(0);
  const touchX = useRef<number | null>(null);

  // this route is always Theme B
  useEffect(() => {
    if (state.portalMode !== "client") dispatch({ type: "portal", mode: "client" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-rotating message slider
  useEffect(() => {
    if (msgs.length < 2) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % msgs.length), 4500);
    return () => clearInterval(t);
  }, [msgs.length]);

  const safeSlide = slide % Math.max(msgs.length, 1);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) {
      setSlide((i) => (i + (dx < 0 ? 1 : msgs.length - 1)) % Math.max(msgs.length, 1));
    }
    touchX.current = null;
  }

  return (
    <div className="min-h-dvh">
      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-4 px-4">
          <Logo size={30} label="Krysalis Client Platform" />
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/settings"
              aria-label="Settings"
              className="grid h-11 w-11 place-items-center rounded-xl text-soft transition-colors hover:bg-ink/5 hover:text-ink"
            >
              ⚙️
            </Link>
          </div>
        </div>

        {/* Dynamic info bar — swipeable, auto-rotating (PRD §6 + §8.1) */}
        <div
          className="border-t border-ink/10 bg-surface/40"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
            <div className="relative h-6 min-w-0 flex-1 overflow-hidden" aria-live="polite">
              {msgs.map((msg, i) => (
                <p
                  key={`${i}-${msg.slice(0, 12)}`}
                  className={`absolute inset-0 truncate text-sm font-medium text-ink/90 transition-all duration-500 ${
                    i === safeSlide ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  }`}
                >
                  ✨ {msg}
                </p>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1.5" role="tablist" aria-label="Info messages">
              {msgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Message ${i + 1}`}
                  aria-selected={i === safeSlide}
                  role="tab"
                  className="grid h-6 w-6 place-items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === safeSlide ? "w-4 bg-alert" : "w-1.5 bg-soft/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-[max(env(safe-area-inset-bottom),2rem)] md:py-10">
        {/* Navigation Guide panel — rendered from moderator-edited Markdown */}
        <section className="rounded-3xl border border-ink/10 bg-surface/40 p-5 md:p-10">
          <Markdown source={state.guideMd} />
        </section>

        {/* Asset panel */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold md:text-xl">Shared with you</h2>
            <span className="text-xs text-soft">{CLIENT_ASSETS.length} files</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CLIENT_ASSETS.map((a) => (
              <div
                key={a.id}
                className="card-pop flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-surface/40 p-4"
              >
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl">
                  {a.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                    {a.isNew && (
                      <span className="shrink-0 rounded-full bg-alert px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-soft">
                    {a.sharedBy} · {a.date}
                  </p>
                </div>
                <button className="min-h-11 shrink-0 rounded-xl border border-accent/40 px-3.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 active:scale-95">
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-soft">
          Krysalis Client Platform · need anything? Your engagement lead replies within one business day.
        </footer>
      </main>
    </div>
  );
}
