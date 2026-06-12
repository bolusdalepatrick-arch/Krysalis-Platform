"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type {
  Agent,
  Channel,
  ChatMessage,
  ConvoKey,
  DepartmentId,
  ForumPost,
  ForumReply,
  ManagedUser,
  PortalMode,
  Role,
  TabId,
} from "./types";
import {
  AGENTS,
  CHANNELS,
  DEFAULT_POSITIONS,
  FORUM_POSTS,
  GUIDE_MD,
  INFO_MESSAGES,
  SEED_MESSAGES,
  USERS,
} from "./data";

/*
  Global app state (PRD §2). The PRD's `view` field is realized as Next.js
  routes (/login, /dashboard, /client-portal, /settings); `activeAgentDM`
  is realized as activeConvo === `agent:<id>`.
*/
export interface AppState {
  portalMode: PortalMode; // drives the theme class on the root container
  role: Role; // drives settings tiers & visibility (default: admin)
  activeDepartment: DepartmentId;
  activeTab: TabId;
  activeConvo: ConvoKey | null; // null = list view on mobile / default channel on desktop
  highlightAgent: string | null; // card to spotlight in Agent Control
  agents: Agent[];
  channels: Channel[];
  messages: Record<ConvoKey, ChatMessage[]>;
  posts: ForumPost[];
  guideMd: string; // moderator-editable, rendered in the Client Portal
  infoMessages: string[]; // moderator-editable info-bar slides
  users: ManagedUser[];
  positions: string[];
  accessRules: { position: string; rule: string }[];
}

const initialState: AppState = {
  portalMode: "employee",
  role: "admin",
  activeDepartment: "leadership",
  activeTab: "collab",
  activeConvo: null,
  highlightAgent: null,
  agents: AGENTS,
  channels: CHANNELS,
  messages: SEED_MESSAGES,
  posts: FORUM_POSTS,
  guideMd: GUIDE_MD,
  infoMessages: INFO_MESSAGES,
  users: USERS,
  positions: DEFAULT_POSITIONS,
  accessRules: [],
};

export type Action =
  | { type: "portal"; mode: PortalMode }
  | { type: "role"; role: Role }
  | { type: "dept"; id: DepartmentId }
  | { type: "tab"; tab: TabId }
  | { type: "convo"; key: ConvoKey | null }
  | { type: "send"; key: ConvoKey; msg: ChatMessage }
  | { type: "agentStatus"; id: string; status: "running" | "idle"; workflow?: string; lastRun?: string }
  | { type: "highlight"; id: string | null }
  | { type: "upvote"; postId: string; delta: 1 | -1 }
  | { type: "reply"; postId: string; reply: ForumReply }
  | { type: "guide"; md: string }
  | { type: "infoMessages"; msgs: string[] }
  | { type: "addUser"; user: ManagedUser }
  | { type: "updateUser"; user: ManagedUser }
  | { type: "addPosition"; name: string }
  | { type: "addChannel"; channel: Channel };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "portal":
      return { ...s, portalMode: a.mode };
    case "role":
      return { ...s, role: a.role };
    case "dept":
      return { ...s, activeDepartment: a.id, activeConvo: null, highlightAgent: null };
    case "tab":
      return { ...s, activeTab: a.tab };
    case "convo":
      return { ...s, activeConvo: a.key };
    case "send":
      return {
        ...s,
        messages: { ...s.messages, [a.key]: [...(s.messages[a.key] ?? []), a.msg] },
      };
    case "agentStatus":
      return {
        ...s,
        agents: s.agents.map((g) =>
          g.id === a.id
            ? {
                ...g,
                status: a.status,
                currentWorkflow: a.workflow ?? g.currentWorkflow,
                lastRun: a.lastRun ?? g.lastRun,
              }
            : g,
        ),
      };
    case "highlight":
      return { ...s, highlightAgent: a.id };
    case "upvote":
      return {
        ...s,
        posts: s.posts.map((p) => (p.id === a.postId ? { ...p, upvotes: Math.max(0, p.upvotes + a.delta) } : p)),
      };
    case "reply":
      return {
        ...s,
        posts: s.posts.map((p) => (p.id === a.postId ? { ...p, replies: [...p.replies, a.reply] } : p)),
      };
    case "guide":
      return { ...s, guideMd: a.md };
    case "infoMessages":
      return { ...s, infoMessages: a.msgs.length > 0 ? a.msgs : s.infoMessages };
    case "addUser":
      return { ...s, users: [...s.users, a.user] };
    case "updateUser":
      return { ...s, users: s.users.map((u) => (u.id === a.user.id ? a.user : u)) };
    case "addPosition":
      if (s.positions.some((p) => p.toLowerCase() === a.name.toLowerCase())) return s;
      return {
        ...s,
        positions: [...s.positions, a.name],
        accessRules: [...s.accessRules, { position: a.name, rule: "workspace:read · vault:read (stub)" }],
      };
    case "addChannel":
      return { ...s, channels: [...s.channels, a.channel] };
    default:
      return s;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Ctx.Provider value={{ state, dispatch }}>
      <div
        className={`${
          state.portalMode === "client" ? "theme-client" : "theme-employee"
        } min-h-dvh bg-canvas text-ink transition-colors duration-500`}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
