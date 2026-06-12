"use client";

import { useState } from "react";
import { useApp } from "@/lib/state";
import type { PortalMode, Role } from "@/lib/types";

const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: "admin", label: "Admin", icon: "👑" },
  { id: "moderator", label: "Moderator", icon: "🛡" },
  { id: "employee", label: "Employee", icon: "🌿" },
  { id: "client", label: "Client", icon: "🦋" },
];

/**
 * Demo-only floating pill (PRD §2): previews the UI as any role without a
 * real auth backend, plus a live Employee/Client theme toggle.
 */
export default function RoleSwitcher() {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const current = ROLES.find((r) => r.id === state.role) ?? ROLES[0];

  return (
    <div className="fixed bottom-3 left-3 z-50 flex flex-col items-start gap-2 pb-[env(safe-area-inset-bottom)]">
      {open && (
        <div className="animate-rise w-52 rounded-2xl border border-ink/15 bg-surface/95 p-2 shadow-2xl backdrop-blur-md">
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-soft">
            Preview as role
          </p>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                dispatch({ type: "role", role: r.id });
                setOpen(false);
              }}
              className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm transition-colors ${
                state.role === r.id ? "bg-accent/20 text-ink" : "text-soft hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <span aria-hidden>{r.icon}</span>
              {r.label}
              {state.role === r.id && <span className="ml-auto text-accent">●</span>}
            </button>
          ))}
          <div className="my-1.5 border-t border-ink/10" />
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-soft">Theme</p>
          <div className="flex gap-1.5 px-1 pb-1">
            {(["employee", "client"] as PortalMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => dispatch({ type: "portal", mode })}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-medium capitalize transition-colors ${
                  state.portalMode === mode
                    ? "border-accent/60 bg-accent/20 text-ink"
                    : "border-ink/10 text-soft hover:text-ink"
                }`}
              >
                {mode === "employee" ? "🌿 Employee" : "🦋 Client"}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-surface/95 px-4 text-sm font-medium text-ink shadow-xl backdrop-blur-md transition-transform active:scale-95"
      >
        <span aria-hidden>{current.icon}</span>
        <span className="capitalize">{current.label}</span>
        <span className="text-[10px] text-soft">{open ? "▾" : "▴"}</span>
      </button>
    </div>
  );
}
