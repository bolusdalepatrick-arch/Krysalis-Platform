"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AgentAvatar, AgentBadge, HumanAvatar } from "@/components/Avatars";
import { useApp } from "@/lib/state";
import { MEMBERS } from "@/lib/data";
import type { Agent, ChatMessage, ConvoKey, Member } from "@/lib/types";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uid() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.kind === "self") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%]">
          <p className="mb-0.5 pr-1 text-right text-[10px] text-soft">You · {msg.time}</p>
          <div className="rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2 text-[15px] leading-relaxed text-canvas shadow-sm">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }
  const agent = msg.kind === "agent";
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[70%]">
        <p className="mb-0.5 pl-1 text-[10px] text-soft">
          {msg.author} {agent && <span className="text-glow">· agent</span>} · {msg.time}
        </p>
        <div
          className={`rounded-2xl rounded-tl-sm px-3.5 py-2 text-[15px] leading-relaxed shadow-sm ${
            agent ? "border border-glow/30 bg-glow/10 text-ink" : "bg-surface text-ink"
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function CollabDeck() {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newChannel, setNewChannel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const dept = state.activeDepartment;
  const channels = state.channels.filter((c) => c.departmentId === dept);
  const members = MEMBERS.filter((p) => p.departmentId === dept);
  const agents = state.agents.filter((a) => a.departmentId === dept);

  // Desktop fallback: show the first channel when nothing is selected.
  // On mobile, null = stay on the list screen (stacked navigation, PRD §8.1).
  const fallbackKey: ConvoKey | null = channels[0] ? `ch:${channels[0].id}` : null;
  const convoKey = state.activeConvo ?? fallbackKey;
  const mobileThreadOpen = state.activeConvo !== null;

  const messages = convoKey ? (state.messages[convoKey] ?? []) : [];

  // resolve thread header info
  let header: { title: string; sub?: string; agent?: Agent; member?: Member } = { title: "" };
  if (convoKey?.startsWith("ch:")) {
    const ch = state.channels.find((c) => `ch:${c.id}` === convoKey);
    header = { title: `#${ch?.name ?? "channel"}`, sub: `${members.length + agents.length + 1} members` };
  } else if (convoKey?.startsWith("dm:")) {
    const p = MEMBERS.find((p) => `dm:${p.id}` === convoKey);
    if (p) header = { title: p.name, sub: p.online ? "Online" : "Away", member: p };
  } else if (convoKey?.startsWith("agent:")) {
    const a = state.agents.find((a) => `agent:${a.id}` === convoKey);
    if (a)
      header = {
        title: a.name,
        sub: a.status === "running" ? (a.currentWorkflow ?? "Running workflows") : "Idle · ready for commands",
        agent: a,
      };
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [convoKey, messages.length]);

  function open(key: ConvoKey) {
    dispatch({ type: "convo", key });
  }

  function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !convoKey) return;
    dispatch({ type: "send", key: convoKey, msg: { id: uid(), author: "You", time: now(), text, kind: "self" } });
    setDraft("");

    // Agents acknowledge instantly and reference their n8n workflow (PRD §5 Pattern 1)
    const agent = header.agent;
    if (agent) {
      const key = convoKey;
      setTimeout(() => {
        dispatch({
          type: "send",
          key,
          msg: { id: uid(), author: agent.name, time: now(), text: agent.ack, kind: "agent" },
        });
        dispatch({ type: "agentStatus", id: agent.id, status: "running", workflow: agent.currentWorkflow });
        setTimeout(() => {
          dispatch({ type: "agentStatus", id: agent.id, status: "idle", lastRun: "Just now" });
        }, 4000);
      }, 800);
    }
  }

  function viewInAgentControl(agentId: string) {
    dispatch({ type: "convo", key: null });
    dispatch({ type: "highlight", id: agentId });
    dispatch({ type: "tab", tab: "agents" });
  }

  function createChannel(e: FormEvent) {
    e.preventDefault();
    const name = newChannel.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!name) return;
    const id = `${dept}-${name}-${Date.now().toString(36)}`;
    dispatch({ type: "addChannel", channel: { id, name, departmentId: dept } });
    dispatch({ type: "convo", key: `ch:${id}` });
    setNewChannel("");
    setModalOpen(false);
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ───────── Left rail: channels · humans · ⚡ AI agents ───────── */}
      <div
        className={`min-h-0 w-full flex-col md:flex md:w-72 md:shrink-0 md:border-r md:border-ink/10 ${
          mobileThreadOpen ? "hidden" : "flex"
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-canvas/95 p-2 backdrop-blur-sm">
          <button
            onClick={() => setModalOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-sm font-medium text-soft transition-colors hover:border-accent/50 hover:text-ink"
          >
            + Create New Channel / Manage Members
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6 pt-3">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-soft">Channels</p>
          {channels.map((c) => {
            const key = `ch:${c.id}`;
            const active = convoKey === key;
            return (
              <button
                key={c.id}
                onClick={() => open(key)}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm transition-colors ${
                  active ? "bg-accent/15 text-ink" : "text-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <span aria-hidden className="text-soft">
                  #
                </span>
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}

          <p className="px-2 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-soft">
            Direct Messages
          </p>
          {members.map((p) => {
            const key = `dm:${p.id}`;
            const active = convoKey === key;
            return (
              <button
                key={p.id}
                onClick={() => open(key)}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm transition-colors ${
                  active ? "bg-accent/15 text-ink" : "text-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <HumanAvatar name={p.name} online={p.online} size={28} />
                <span className="min-w-0 flex-1 truncate text-left">{p.name}</span>
                <span className="truncate text-[10px] text-soft/70">{p.title}</span>
              </button>
            );
          })}

          {/* ⚡ AI Agents — first-class co-workers, directly beneath humans (PRD §5 Pattern 1) */}
          <p className="px-2 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-glow">⚡ AI Agents</p>
          {agents.map((a) => {
            const key = `agent:${a.id}`;
            const active = convoKey === key;
            return (
              <button
                key={a.id}
                onClick={() => open(key)}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm transition-colors ${
                  active ? "bg-glow/10 text-ink" : "text-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <AgentAvatar name={a.name} status={a.status} size={28} />
                <span className="min-w-0 flex-1 truncate text-left">{a.name}</span>
                <AgentBadge role={a.role} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Right pane: conversation thread ───────── */}
      <div
        className={`min-w-0 flex-1 flex-col bg-canvas ${
          mobileThreadOpen
            ? "fixed inset-0 z-40 flex pt-[env(safe-area-inset-top)] md:static md:z-auto md:pt-0"
            : "hidden md:flex"
        }`}
      >
        {convoKey ? (
          <>
            <div className="flex min-h-14 items-center gap-2.5 border-b border-ink/10 bg-canvas/95 px-3 backdrop-blur-sm">
              <button
                onClick={() => dispatch({ type: "convo", key: null })}
                aria-label="Back to conversations"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink transition-colors hover:bg-ink/5 md:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M11 3 5 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {header.agent && <AgentAvatar name={header.agent.name} status={header.agent.status} size={32} />}
              {header.member && <HumanAvatar name={header.member.name} online={header.member.online} size={32} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-sm font-semibold">{header.title}</h2>
                  {header.agent && <AgentBadge role={header.agent.role} />}
                </div>
                {header.sub && (
                  <p className="truncate text-[11px] text-soft">
                    {header.agent && (
                      <span className={header.agent.status === "running" ? "text-glow" : ""}>
                        {header.agent.status === "running" ? "● " : "○ "}
                      </span>
                    )}
                    {header.sub}
                  </p>
                )}
              </div>
              {header.agent && (
                <button
                  onClick={() => viewInAgentControl(header.agent!.id)}
                  className="min-h-11 shrink-0 rounded-xl px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  View in Agent Control →
                </button>
              )}
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 md:px-5">
              {messages.length === 0 && (
                <p className="pt-10 text-center text-sm text-soft">No messages yet — say hi 👋</p>
              )}
              {messages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
            </div>

            <form
              onSubmit={send}
              className="flex items-center gap-2 border-t border-ink/10 bg-canvas px-3 py-2.5 pb-[max(env(safe-area-inset-bottom),0.625rem)]"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={header.agent ? `Command ${header.title}…` : `Message ${header.title}…`}
                aria-label="Message composer"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-ink/15 bg-surface/60 px-4 text-base text-ink placeholder:text-soft/60 focus:border-accent"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-canvas shadow-md transition-transform active:scale-90"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M2 9 16 2l-3.5 14L8.6 10.4 2 9Z" fill="currentColor" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-soft">Select a conversation</div>
        )}
      </div>

      {/* Mock modal: create channel / manage members (PRD §4.2) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="animate-rise relative w-full max-w-md rounded-2xl border border-ink/15 bg-surface p-5 shadow-2xl">
            <h3 className="font-display text-lg font-semibold">Create channel · Manage members</h3>
            <p className="mt-1 text-xs text-soft">Mock workflow — the channel is added to this department locally.</p>
            <form onSubmit={createChannel} className="mt-4 space-y-3">
              <input
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                placeholder="new-channel-name"
                aria-label="New channel name"
                className="min-h-11 w-full rounded-xl border border-ink/15 bg-canvas/50 px-4 text-base placeholder:text-soft/60 focus:border-accent"
              />
              <div className="rounded-xl border border-ink/10 p-3">
                <p className="pb-2 text-[10px] font-semibold uppercase tracking-widest text-soft">Members (mock)</p>
                {members.slice(0, 3).map((p) => (
                  <label key={p.id} className="flex min-h-10 items-center gap-2.5 text-sm text-ink/90">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-(--accent-primary)" />
                    {p.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-11 flex-1 rounded-xl border border-ink/15 text-sm font-medium text-soft transition-colors hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-canvas transition-transform active:scale-[0.98]"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
