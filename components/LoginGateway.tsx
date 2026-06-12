"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "./Logo";
import { useApp } from "@/lib/state";
import type { PortalMode } from "@/lib/types";

/**
 * Dual-Entry Gateway (PRD §3). The segmented toggle flips the page-level
 * theme class via global state — every themed surface transitions in 500ms.
 * Mock auth: any input signs in; default session is a full Admin.
 */
export default function LoginGateway() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const mode = state.portalMode;

  function setMode(m: PortalMode) {
    dispatch({ type: "portal", mode: m });
  }

  function signIn(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "role", role: "admin" }); // default session = Admin
    router.push(mode === "employee" ? "/dashboard" : "/client-portal");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient themed glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl transition-colors duration-500"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-glow/10 blur-3xl transition-colors duration-500"
      />

      <div className="w-full max-w-md rounded-3xl border border-ink/15 bg-surface/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo size={44} />
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {mode === "employee" ? "Krysalis OS" : "Krysalis Client Platform"}
          </h1>
          <p className="text-sm text-soft">
            {mode === "employee" ? "The internal hub for builders & agents." : "Your engagement, beautifully organized."}
          </p>
        </div>

        {/* Segmented toggle — thumb animates between segments */}
        <div className="relative mb-6 grid grid-cols-2 rounded-full border border-ink/10 bg-canvas/50 p-1">
          <span
            aria-hidden
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent shadow-lg transition-transform duration-300 ease-out ${
              mode === "client" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          {(
            [
              ["employee", "Employee Portal"],
              ["client", "Client Portal"],
            ] as [PortalMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`relative z-10 min-h-11 rounded-full text-sm font-semibold transition-colors duration-300 ${
                mode === m ? "text-canvas" : "text-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">
              Username / Email
            </span>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="you@krysalis.ai"
              autoComplete="username"
              className="min-h-11 w-full rounded-xl border border-ink/15 bg-canvas/50 px-4 text-base text-ink placeholder:text-soft/60 focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">Password</span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="min-h-11 w-full rounded-xl border border-ink/15 bg-canvas/50 px-4 text-base text-ink placeholder:text-soft/60 focus:border-accent"
            />
          </label>

          {/* Reserved slot: password-update / 2FA block lands here in V2 without re-layout (PRD §3). */}
          <div data-slot="security-extras" aria-hidden className="h-3" />

          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-accent font-display text-base font-semibold text-canvas shadow-lg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-soft">
          Mock auth — any credentials work. You land with full <span className="text-ink">Admin</span> access.
        </p>
      </div>
    </main>
  );
}
