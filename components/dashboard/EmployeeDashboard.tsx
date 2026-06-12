"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { useApp } from "@/lib/state";
import { COMPANY_VALUES, CORE_GOALS, DEPARTMENTS } from "@/lib/data";
import type { DepartmentId, TabId } from "@/lib/types";
import CollabDeck from "./CollabDeck";
import ForumFeed from "./ForumFeed";
import Vault from "./Vault";
import AgentControl from "./AgentControl";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "collab", icon: "💬", label: "Collaboration Deck" },
  { id: "forum", icon: "🗣", label: "Forum Feed" },
  { id: "vault", icon: "📦", label: "The Vault" },
  { id: "agents", icon: "🤖", label: "Agent Control" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state, dispatch } = useApp();

  function pick(id: DepartmentId) {
    dispatch({ type: "dept", id });
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-4 pb-4 pt-5">
        <Logo size={30} label="Krysalis OS" />
      </div>

      {/* Sticky values panel — pinned beneath the logo, employee-only (PRD §4.1) */}
      <div className="sticky top-0 z-10 border-y border-ink/10 bg-surface/80 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-glow">Our Values</p>
        <ul className="mt-1.5 space-y-1">
          {COMPANY_VALUES.map((v) => (
            <li key={v} className="text-xs leading-relaxed text-ink/80">
              ✦ {v}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-glow">Core Goals</p>
        <ul className="mt-1.5 space-y-1">
          {CORE_GOALS.map((g) => (
            <li key={g} className="text-xs leading-relaxed text-soft">
              {g}
            </li>
          ))}
        </ul>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Departments">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-soft">Departments</p>
        {DEPARTMENTS.map((d) => {
          const active = state.activeDepartment === d.id;
          return (
            <button
              key={d.id}
              onClick={() => pick(d.id)}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                active ? "bg-accent/15 text-ink" : "text-soft hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {active && <span aria-hidden className="absolute left-0 h-5 w-1 rounded-full bg-accent" />}
              <span aria-hidden className="text-lg">
                {d.icon}
              </span>
              {d.name}
            </button>
          );
        })}

        <p className="px-2 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-widest text-soft">System</p>
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <span aria-hidden className="text-lg">
            ⚙️
          </span>
          System Settings
        </Link>
      </nav>

      <div className="border-t border-ink/10 px-4 py-3 text-[11px] text-soft">
        Krysalis Agentic OS · V1 mockup
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { state, dispatch } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const dept = DEPARTMENTS.find((d) => d.id === state.activeDepartment) ?? DEPARTMENTS[0];

  // This route is always Theme A
  useEffect(() => {
    if (state.portalMode !== "employee") dispatch({ type: "portal", mode: "employee" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the active tab scrolled into view on the mobile scrollable tab bar
  useEffect(() => {
    tabRefs.current[state.activeTab]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [state.activeTab]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-ink/10 bg-surface/30 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sticky top bar */}
      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-ink/10 bg-canvas/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="grid h-11 w-11 place-items-center rounded-xl text-ink transition-colors hover:bg-ink/5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <Logo size={24} />
        <span className="truncate font-display text-sm font-semibold">
          {dept.icon} {dept.name}
        </span>
      </header>

      {/* Mobile drawer (values panel lives inside, PRD §8.1) */}
      <div className={`fixed inset-0 z-40 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto border-r border-ink/10 bg-canvas pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-label="Navigation drawer"
        >
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Main viewport */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Tab bar — pinned, horizontally scrollable + snap below md */}
        <nav
          className="flex shrink-0 snap-x snap-mandatory gap-1 overflow-x-auto border-b border-ink/10 bg-canvas/60 px-2 backdrop-blur-sm [scrollbar-width:none]"
          aria-label="Workspace tabs"
        >
          {TABS.map((t) => {
            const active = state.activeTab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                onClick={() => dispatch({ type: "tab", tab: t.id })}
                aria-current={active ? "page" : undefined}
                className={`relative min-h-12 shrink-0 snap-start whitespace-nowrap px-4 text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-soft hover:text-ink"
                }`}
              >
                <span aria-hidden className="mr-1.5">
                  {t.icon}
                </span>
                {t.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-colors ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Tab content — keyed for fade/slide transition, no layout jank */}
        <div key={`${state.activeDepartment}-${state.activeTab}`} className="animate-rise min-h-0 flex-1">
          {state.activeTab === "collab" && <CollabDeck />}
          {state.activeTab === "forum" && <ForumFeed />}
          {state.activeTab === "vault" && <Vault />}
          {state.activeTab === "agents" && <AgentControl />}
        </div>
      </main>
    </div>
  );
}
