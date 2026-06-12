"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Logo from "@/components/Logo";
import Markdown from "@/components/Markdown";
import { HumanAvatar } from "@/components/Avatars";
import { useApp } from "@/lib/state";
import type { ManagedUser } from "@/lib/types";

const RANK: Record<string, number> = { client: 0, employee: 1, moderator: 2, admin: 3 };

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-surface/40 p-4 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-glow">{eyebrow}</p>
      <h2 className="mt-0.5 font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const inputCls =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-canvas/50 px-4 text-base text-ink placeholder:text-soft/60 focus:border-accent";

/** Unified Settings & Admin Engine (PRD §7) — sections render by role tier. */
export default function SettingsView() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const rank = RANK[state.role] ?? 0;
  const backHref = state.portalMode === "client" ? "/client-portal" : "/dashboard";

  // ── user tier ──
  const [displayName, setDisplayName] = useState("Patrick Star");
  const [email, setEmail] = useState("patrick@krysalis.ai");
  const [pwSaved, setPwSaved] = useState(false);

  // ── moderator tier drafts ──
  const [guideDraft, setGuideDraft] = useState(state.guideMd);
  const [infoDraft, setInfoDraft] = useState(state.infoMessages.join("\n"));
  const [mdView, setMdView] = useState<"edit" | "preview">("edit"); // mobile toggle
  const [saved, setSaved] = useState(false);

  // ── admin tier ──
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPass, setEditPass] = useState("");
  const [newPosition, setNewPosition] = useState("");

  function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  }

  function saveModerator() {
    dispatch({ type: "guide", md: guideDraft });
    dispatch({
      type: "infoMessages",
      msgs: infoDraft.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function openEditor(u: ManagedUser) {
    setEditing(u);
    setEditName(u.name);
    setEditPass("");
  }

  function saveEditor(e: FormEvent) {
    e.preventDefault();
    if (editing) dispatch({ type: "updateUser", user: { ...editing, name: editName.trim() || editing.name } });
    setEditing(null);
  }

  function toggleStatus(u: ManagedUser) {
    dispatch({ type: "updateUser", user: { ...u, status: u.status === "Active" ? "Suspended" : "Active" } });
  }

  function setPosition(u: ManagedUser, position: string) {
    dispatch({ type: "updateUser", user: { ...u, position } });
  }

  function createAccount() {
    const n = state.users.length + 1;
    const user: ManagedUser = {
      id: `u-${Date.now()}`,
      name: `New Member ${n}`,
      email: `member${n}@krysalis.ai`,
      position: "Employee",
      status: "Active",
    };
    dispatch({ type: "addUser", user });
    openEditor(user);
  }

  function addPosition(e: FormEvent) {
    e.preventDefault();
    const name = newPosition.trim();
    if (!name) return;
    dispatch({ type: "addPosition", name });
    setNewPosition("");
  }

  function logout() {
    dispatch({ type: "role", role: "admin" }); // reset demo session
    router.push("/login");
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-4xl items-center gap-3 px-4">
          <Link
            href={backHref}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-xl text-ink transition-colors hover:bg-ink/5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 3 5 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Logo size={26} />
          <h1 className="font-display text-base font-semibold">System Settings</h1>
          <span className="ml-auto rounded-full border border-ink/15 px-3 py-1 text-[11px] capitalize text-soft">
            viewing as {state.role}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-5 pb-[max(env(safe-area-inset-bottom),5rem)] md:py-8">
        {/* ═══════════ USER TIER — all roles ═══════════ */}
        <Section eyebrow="User Tier" title="Profile">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3 sm:flex-col">
              <HumanAvatar name={displayName || "You"} size={64} />
              <button className="min-h-11 rounded-xl border border-ink/15 px-4 text-xs font-medium text-soft transition-colors hover:text-ink">
                Change avatar
              </button>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">Display name</span>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </label>
            </div>
          </div>
        </Section>

        <Section eyebrow="User Tier" title="Change Password">
          <form onSubmit={savePassword} className="grid gap-3 sm:grid-cols-3">
            <input type="password" placeholder="Current password" aria-label="Current password" className={inputCls} />
            <input type="password" placeholder="New password" aria-label="New password" className={inputCls} />
            <input type="password" placeholder="Confirm new password" aria-label="Confirm new password" className={inputCls} />
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-accent px-6 text-sm font-semibold text-canvas transition-transform active:scale-[0.98]"
              >
                {pwSaved ? "Updated ✓" : "Update password"}
              </button>
            </div>
          </form>
        </Section>

        <Section eyebrow="User Tier" title="Session">
          <button
            onClick={logout}
            className="min-h-12 w-full rounded-xl border border-alert/50 bg-alert/15 font-display text-base font-semibold text-alert transition-colors hover:bg-alert/25 sm:w-auto sm:px-10"
          >
            Log out
          </button>
        </Section>

        {/* ═══════════ MODERATOR TIER — admin, moderator ═══════════ */}
        {rank >= 2 && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-soft">Moderator Tier</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            <Section eyebrow="Client Portal" title="Navigation Guide (Markdown)">
              {/* mobile: edit/preview toggle · md+: side-by-side */}
              <div className="mb-3 flex rounded-full border border-ink/15 bg-canvas/50 p-1 md:hidden">
                {(["edit", "preview"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setMdView(v)}
                    aria-pressed={mdView === v}
                    className={`min-h-9 flex-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                      mdView === v ? "bg-accent text-canvas" : "text-soft"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <textarea
                  value={guideDraft}
                  onChange={(e) => setGuideDraft(e.target.value)}
                  rows={14}
                  aria-label="Navigation guide markdown"
                  className={`w-full rounded-xl border border-ink/15 bg-canvas/50 p-4 font-mono text-sm leading-relaxed text-ink focus:border-accent ${
                    mdView === "preview" ? "hidden md:block" : ""
                  }`}
                />
                <div
                  className={`max-h-[26rem] overflow-y-auto rounded-xl border border-ink/10 bg-canvas/30 p-4 ${
                    mdView === "edit" ? "hidden md:block" : ""
                  }`}
                  aria-label="Live preview"
                >
                  <Markdown source={guideDraft} />
                </div>
              </div>
            </Section>

            <Section eyebrow="Client Portal" title="Header Info Bar Messages">
              <p className="mb-2 text-xs text-soft">One message per line — these rotate in the client portal header.</p>
              <textarea
                value={infoDraft}
                onChange={(e) => setInfoDraft(e.target.value)}
                rows={4}
                aria-label="Info bar messages"
                className="w-full rounded-xl border border-ink/15 bg-canvas/50 p-4 text-sm leading-relaxed text-ink focus:border-accent"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={saveModerator}
                  className="min-h-11 rounded-xl bg-accent px-6 text-sm font-semibold text-canvas transition-transform active:scale-[0.98]"
                >
                  {saved ? "Saved ✓ · live in Client Portal" : "Save"}
                </button>
                <Link href="/client-portal" className="text-xs font-medium text-accent underline-offset-2 hover:underline">
                  Preview Client Portal →
                </Link>
              </div>
            </Section>
          </>
        )}

        {/* ═══════════ ADMIN TIER — admin only ═══════════ */}
        {rank >= 3 && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-soft">Admin Tier</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            <Section eyebrow="Admin Engine" title="User Management Matrix">
              <button
                onClick={createAccount}
                className="mb-4 min-h-11 rounded-xl border border-accent/40 bg-accent/10 px-5 text-sm font-semibold text-ink transition-colors hover:bg-accent/20"
              >
                + Create account
              </button>

              {/* md+: table */}
              <div className="hidden overflow-hidden rounded-xl border border-ink/10 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas/50 text-[11px] uppercase tracking-wider text-soft">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role / Position</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map((u) => (
                      <tr key={u.id} className="border-t border-ink/10">
                        <td className="px-4 py-2.5 font-medium text-ink">{u.name}</td>
                        <td className="px-4 py-2.5 text-soft">{u.email}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={u.position}
                            onChange={(e) => setPosition(u, e.target.value)}
                            aria-label={`Position for ${u.name}`}
                            className="min-h-9 rounded-lg border border-ink/15 bg-canvas/50 px-2 text-sm text-ink focus:border-accent"
                          >
                            {state.positions.map((p) => (
                              <option key={p} value={p} className="bg-surface text-ink">
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              u.status === "Active" ? "bg-glow/15 text-glow" : "bg-alert/15 text-alert"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEditor(u)}
                              className="min-h-9 rounded-lg border border-ink/15 px-3 text-xs font-medium text-soft transition-colors hover:text-ink"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleStatus(u)}
                              className="min-h-9 rounded-lg border border-ink/15 px-3 text-xs font-medium text-soft transition-colors hover:text-ink"
                            >
                              {u.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* <md: stacked cards — actions in a row footer, never horizontal scroll (PRD §8.1) */}
              <div className="space-y-3 md:hidden">
                {state.users.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-ink/10 bg-canvas/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-medium text-ink">{u.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          u.status === "Active" ? "bg-glow/15 text-glow" : "bg-alert/15 text-alert"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-soft">{u.email}</p>
                    <select
                      value={u.position}
                      onChange={(e) => setPosition(u, e.target.value)}
                      aria-label={`Position for ${u.name}`}
                      className="mt-3 min-h-11 w-full rounded-xl border border-ink/15 bg-canvas/50 px-3 text-base text-ink focus:border-accent"
                    >
                      {state.positions.map((p) => (
                        <option key={p} value={p} className="bg-surface text-ink">
                          {p}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex gap-2 border-t border-ink/10 pt-3">
                      <button
                        onClick={() => openEditor(u)}
                        className="min-h-11 flex-1 rounded-xl border border-ink/15 text-sm font-medium text-soft transition-colors active:bg-ink/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        className="min-h-11 flex-1 rounded-xl border border-ink/15 text-sm font-medium text-soft transition-colors active:bg-ink/5"
                      >
                        {u.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="Admin Engine" title="Dynamic Roles Modifier">
              <div className="flex flex-wrap gap-2">
                {state.positions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex min-h-9 items-center rounded-full border border-ink/15 bg-canvas/40 px-4 text-sm text-ink/90"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <form onSubmit={addPosition} className="mt-4 flex gap-2">
                <input
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="e.g. Leads, Custom Sales, AI Auditor"
                  aria-label="New position name"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  className="min-h-11 shrink-0 rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-ink transition-colors hover:bg-accent/20"
                >
                  + Add Custom Position
                </button>
              </form>
              {state.accessRules.length > 0 && (
                <div className="mt-4 rounded-xl border border-ink/10 bg-canvas/30 p-3">
                  <p className="pb-2 text-[10px] font-semibold uppercase tracking-widest text-soft">
                    Auto-generated access rules (stub)
                  </p>
                  {state.accessRules.map((r) => (
                    <p key={r.position} className="py-1 font-mono text-xs text-soft">
                      <span className="text-glow">{r.position}</span> → {r.rule}
                    </p>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </main>

      {/* Edit user modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <form
            onSubmit={saveEditor}
            className="animate-rise relative w-full max-w-sm space-y-3 rounded-2xl border border-ink/15 bg-surface p-5 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold">Edit account</h3>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">Username</span>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-soft">
                New password (mock)
              </span>
              <input
                type="password"
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="min-h-11 flex-1 rounded-xl border border-ink/15 text-sm font-medium text-soft transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-canvas transition-transform active:scale-[0.98]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
