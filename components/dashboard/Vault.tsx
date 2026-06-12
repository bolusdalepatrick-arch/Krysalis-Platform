"use client";

import { useApp } from "@/lib/state";
import { VAULT_ITEMS } from "@/lib/data";

const TYPE_ICON: Record<string, string> = { SOP: "📄", Playbook: "📘", Training: "🎓" };

export default function Vault() {
  const { state } = useApp();
  const items = VAULT_ITEMS.filter((v) => v.departmentId === state.activeDepartment);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
        <h1 className="font-display text-xl font-bold tracking-tight">The Vault</h1>
        <p className="text-xs text-soft">SOPs, playbooks and training modules — indexed for every agent.</p>

        {/* single-column horizontal cards on mobile; tiled grid upward (PRD §4.2 + §8.1) */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <button
              key={v.id}
              className="card-pop flex items-start gap-3.5 rounded-2xl border border-ink/10 bg-surface/50 p-4 text-left md:flex-col md:gap-3"
            >
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl"
              >
                {TYPE_ICON[v.type]}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold leading-snug text-ink">{v.title}</span>
                  <span className="rounded-full border border-glow/40 bg-glow/10 px-2 py-0.5 text-[10px] font-medium text-glow">
                    {v.tag}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-soft">{v.description}</span>
                <span className="mt-2 block text-[10px] uppercase tracking-wider text-soft/70">
                  {v.type} · {v.updated}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
