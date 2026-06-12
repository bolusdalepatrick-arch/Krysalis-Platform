"use client";

import { useState } from "react";
import clsx from "clsx";
import { signIn } from "@/app/actions/auth";

type Side = "employee" | "client";

/**
 * Dual-entry gateway, kept from V1 and restyled (PRD section 6). The toggle
 * previews the two theme scopes with the 500ms crossfade; identity is still
 * decided server-side by the signIn action.
 */
export default function LoginGateway() {
  const [side, setSide] = useState<Side>("employee");

  return (
    <div
      className={clsx(
        "theme-fade min-h-dvh bg-base text-primary",
        side === "employee" ? "theme-employee" : "theme-client",
      )}
    >
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-bold tracking-[-0.01em]">Krysalis</h1>
        <p className="mt-2 text-sm text-secondary">
          {side === "employee"
            ? "The firm's operating system: work, learning, and the record of both."
            : "Your work with the firm — status, files, and a direct line to the team."}
        </p>

        <div
          role="group"
          aria-label="Choose your entrance"
          className="mt-8 grid grid-cols-2 gap-1 rounded-s border border-line bg-inset p-1"
        >
          {(
            [
              ["employee", "Employee hub"],
              ["client", "Client portal"],
            ] as [Side, string][]
          ).map(([s, label]) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              aria-pressed={side === s}
              className={clsx(
                "h-9 rounded-s text-sm",
                side === s
                  ? "border border-line bg-raised font-medium text-primary"
                  : "text-secondary hover:text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="side" value={side} />
          <label className="block">
            <span className="eyebrow mb-1.5 block">Email</span>
            <input
              name="email"
              type="text"
              autoComplete="username"
              placeholder="you@krysalis.studio"
              className="h-10 w-full rounded-s border border-line bg-inset px-3 text-md text-primary placeholder:text-muted"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1.5 block">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-10 w-full rounded-s border border-line bg-inset px-3 text-md text-primary"
            />
          </label>
          <button
            type="submit"
            className="mt-2 h-10 rounded-s bg-accent text-md font-medium text-accent-ink hover:bg-accent-hover"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Demo authentication — any credentials work. The switcher in the corner
          previews each persona once you're in.
        </p>
      </main>
    </div>
  );
}
