export type Role = "admin" | "moderator" | "employee" | "client";
export type PortalMode = "employee" | "client";
export type DepartmentId = "leadership" | "marketing" | "research" | "dev";
export type TabId = "collab" | "forum" | "vault" | "agents";

export interface Department {
  id: DepartmentId;
  name: string;
  icon: string;
}

export interface Member {
  id: string;
  name: string;
  title: string;
  online: boolean;
  departmentId: DepartmentId;
}

export interface Agent {
  id: string;
  name: string;
  role: string; // e.g. "Lead Qualifier"
  departmentId: DepartmentId;
  status: "running" | "idle";
  currentWorkflow?: string; // n8n workflow label
  synergy: number; // 0–100, Hermes + vault sync
  vaultNotesIndexed: number;
  quickActions: { label: string }[];
  lastRun: string; // display string (mock; avoids hydration drift)
  ack: string; // canned DM acknowledgment referencing its n8n workflow
}

export interface Channel {
  id: string;
  name: string;
  departmentId: DepartmentId;
}

export interface ChatMessage {
  id: string;
  author: string;
  time: string;
  text: string;
  kind: "human" | "agent" | "self";
}

/** Conversation key: `ch:<channelId>` | `dm:<memberId>` | `agent:<agentId>` */
export type ConvoKey = string;

export interface ForumReply {
  id: string;
  author: string;
  time: string;
  text: string;
}

export interface ForumPost {
  id: string;
  departmentId: DepartmentId;
  author: string;
  time: string;
  title: string;
  body: string;
  upvotes: number;
  order: number; // recency rank for "New" sort
  replies: ForumReply[];
}

export interface VaultItem {
  id: string;
  departmentId: DepartmentId;
  type: "SOP" | "Playbook" | "Training";
  title: string;
  description: string;
  updated: string;
  tag: string;
}

export interface ClientAsset {
  id: string;
  name: string;
  icon: string;
  sharedBy: string;
  date: string;
  isNew: boolean;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  position: string;
  status: "Active" | "Suspended";
}
