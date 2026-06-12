"use client";

import { useEffect, useRef } from "react";
import { AgentAvatar, AgentBadge } from "@/components/Avatars";
import { useApp } from "@/lib/state";

/** Agent Squad Deck — Pattern 2 (PRD §5). */
export default function AgentControl() {
  const { state, dispatch } = useApp();
  const agents = state.agents.filter((a) => a.departmentId === state.activeDepartment);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Spotlight a card when arriving via "View in Agent Control →"
  useEffect(() => {
    if (!state.highlightAgent) return;
    cardRefs.current[state.highlightAgent]?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => dispatch({ type: "highlight", id: null }), 3000);
    return () => clearTimeout(t);
  }, [state.highlightAgent, dispatch]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  function trigger(agentId: string, label: string) {
    dispatch({ type: "agentStatus", id: agentId, status: "running", workflow: `Running: ${label} via n8n` });
    timers.current.push(
      setTimeout(() => {
        dispatch({
          type: "agentStatus",
          id: agentId,
          status: "idle",
          workflow: `Last: ${label} · completed ✓`,
          lastRun: "Just now",
        });
      }, 2600),
    );
  }

  function message(agentId: string) {
    dispatch({ type: "convo", key: `agent:${agentId}` });
    dispatch({ type: "tab", tab: "collab" });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-6">
        <h1 className="font-display text-xl font-bold tracking-tight">Agent Squad Deck</h1>
        <p className="text-xs text-soft">
          Every agent assigned to this department — status, brain synergy, and quick triggers.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => {
            const running = a.status === "running";
            const highlighted = state.highlightAgent === a.id;
            return (
              <div
                key={a.id}
                ref={(el) => {
                  cardRefs.current[a.id] = el;
                }}
                className={`card-pop flex flex-col rounded-2xl border bg-surface/50 p-4 md:p-5 ${
                  highlighted ? "border-accent ring-2 ring-accent agent-glow" : "border-ink/10"
                }`}
              >
                {/* 1 · identity header */}
                <div className="flex items-center gap-3">
                  <AgentAvatar name={a.name} status={a.status} size={44} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-base font-semibold">{a.name}</h2>
                    <AgentBadge role={a.role} />
                  </div>
                </div>

                {/* 2 · status indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      running ? "border-glow/50 bg-glow/10 text-glow" : "border-ink/15 text-soft"
                    }`}
                  >
                    <span aria-hidden className={running ? "animate-dotpulse" : ""}>
                      {running ? "●" : "○"}
                    </span>
                    {running ? "Running Workflows" : "Idle"}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs text-soft" title={a.currentWorkflow}>
                  {a.currentWorkflow ?? "No workflow history yet"}
                </p>

                {/* 3 · brain synergy metric */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-soft">Brain Synergy</span>
                    <span className="font-display text-sm font-bold text-ink">{a.synergy}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={a.synergy}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${a.name} brain synergy`}
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-canvas/70"
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${a.synergy}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-soft">
                    Hermes sync · Vault index: {a.vaultNotesIndexed.toLocaleString()} notes
                  </p>
                </div>

                {/* 4 · quick trigger actions — full-width & thumb-sized on mobile */}
                <div className="mt-4 flex flex-col gap-2">
                  {a.quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => trigger(a.id, qa.label)}
                      disabled={running}
                      className={`min-h-11 w-full rounded-xl border text-sm font-medium transition-all active:scale-[0.98] ${
                        running
                          ? "cursor-wait border-ink/10 text-soft/50"
                          : "border-accent/40 bg-accent/10 text-ink hover:bg-accent/20"
                      }`}
                    >
                      {running ? "⏳ Working…" : qa.label}
                    </button>
                  ))}
                </div>

                {/* 5 · footer meta */}
                <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="text-[11px] text-soft">Last run · {a.lastRun}</span>
                  <button
                    onClick={() => message(a.id)}
                    className="min-h-11 rounded-xl px-3 text-xs font-semibold text-accent transition-colors hover:bg-accent/10"
                  >
                    💬 Message Agent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
