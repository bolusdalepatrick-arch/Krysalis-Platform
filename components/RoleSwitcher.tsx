"use client";

import { useState, useTransition } from "react";
import { ChevronUp, UserRound } from "lucide-react";
import clsx from "clsx";
import { switchPersona } from "@/app/actions/auth";
import { PERSONAS } from "@/lib/personas";

/**
 * Demo role-switcher pill (PRD 7.10): swaps the persona cookie between the
 * five seeded personas — the live three-way pivot in two clicks.
 */
export default function RoleSwitcher({ activeId }: { activeId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = PERSONAS.find((p) => p.id === activeId);

  return (
    <div className="fixed bottom-3 left-3 z-50 flex flex-col items-start gap-2">
      {open && (
        <div
          className="w-64 rounded-m border border-line bg-raised p-1.5"
          style={{ boxShadow: "var(--shadow-raise)" }}
        >
          <p className="eyebrow px-2 pb-1 pt-1">Preview as</p>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              disabled={pending}
              onClick={() => {
                setOpen(false);
                startTransition(() => switchPersona(p.id));
              }}
              className={clsx(
                "flex w-full flex-col items-start rounded-s px-2 py-1.5 text-left",
                p.id === activeId
                  ? "bg-accent-soft text-primary"
                  : "text-secondary hover:bg-inset hover:text-primary",
              )}
            >
              <span className="text-sm font-medium">{p.name}</span>
              <span className="figure text-2xs text-muted">{p.caption}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-raised py-1.5 pl-3 pr-2.5 text-sm text-primary"
        style={{ boxShadow: "var(--shadow-raise)" }}
      >
        <UserRound size={16} strokeWidth={1.5} aria-hidden />
        <span>{pending ? "Switching" : (active?.name ?? "Choose persona")}</span>
        <ChevronUp
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className={clsx("text-muted transition-transform duration-220", open && "rotate-180")}
        />
      </button>
    </div>
  );
}
