/**
 * Mock-data shapes for M0 (PRD section 13, M0: "mock data still in place").
 * These mirror the section 8 schema closely so the M1 seed can absorb this
 * content with stable ids. All of it is replaced by Prisma reads as each
 * feature milestone lands.
 */
import type { AccountKind, SystemRole } from "@/lib/personas";

export type DepartmentSlug = "engineering" | "design" | "marketing" | "operations";

export interface MockDepartment {
  id: DepartmentSlug;
  name: string;
  description: string;
}

export interface MockPerson {
  id: string;
  name: string;
  title: string;
  role: SystemRole;
  departmentId: DepartmentSlug | null;
  email: string;
  isSystem?: boolean;
  /** CLIENT users: the account they belong to (portal scoping, PRD 7.8). */
  accountId?: string;
  /** Display-only mock progression; M1 recomputes from the XP ledger. */
  xp: number;
  tier: 1 | 2 | 3 | 4 | 5;
  earnings: number;
}

export type JobStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

export interface MockJob {
  id: string;
  title: string;
  brief: string;
  description?: string;
  status: JobStatus;
  grossValue: number;
  workerPool: number;
  firmMargin: number;
  accountId: string;
  departmentId: DepartmentSlug;
  dueAt?: string;
  completedAt?: string;
  workerIds: string[];
  dealId?: string;
}

export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface MockBid {
  id: string;
  jobId: string;
  memberId: string;
  proposedSplit: number;
  pitchText: string;
  status: BidStatus;
  createdAt: string;
}

export type AccountStatus = "PROSPECT" | "ACTIVE" | "DORMANT";

export interface MockAccount {
  id: string;
  name: string;
  kind: AccountKind;
  status: AccountStatus;
  website?: string;
  notes: string;
  contacts: { name: string; email: string; title?: string; isPrimary?: boolean }[];
}

export type DealStage = "INBOUND" | "DISCOVERY" | "PROPOSAL" | "VERBAL" | "WON" | "LOST";
export type DealSource = "WEBSITE" | "REFERRAL" | "OUTBOUND" | "EVENT";
export type ActivityKind = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STAGE_CHANGE";

export interface MockDeal {
  id: string;
  title: string;
  accountId: string;
  ownerId: string;
  stage: DealStage;
  source: DealSource;
  value?: number;
  expectedCloseAt?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  createdAt: string;
  lastActivityAt: string;
  activities: { kind: ActivityKind; authorId: string; body: string; at: string }[];
}

export type BookingStatus = "UNCLAIMED" | "CLAIMED";

export interface MockBookingCard {
  id: string;
  externalRef: string;
  name: string;
  email: string;
  company: string;
  companySize: string;
  automationGoal: string;
  slotStart: string;
  slotEnd: string;
  status: BookingStatus;
  claimedById?: string;
  claimedAt?: string;
  dealId?: string;
  submittedAt: string;
}

export type ChannelKind = "DEPARTMENT" | "JOB" | "FIRM" | "ACCOUNT";

export interface MockChannel {
  id: string;
  kind: ChannelKind;
  name: string;
  departmentId?: DepartmentSlug;
  jobId?: string;
  accountId?: string;
}

export interface MockMessage {
  id: string;
  channelId: string;
  senderId: string;
  body: string;
  at: string;
  isShadowDraft?: boolean;
  approvedById?: string;
  bookingCardId?: string;
}

export interface MockForumPost {
  id: string;
  authorId: string;
  departmentId?: DepartmentSlug;
  title?: string;
  body: string;
  at: string;
  replies: { id: string; authorId: string; body: string; at: string }[];
}

export type VaultFileType = "pdf" | "doc" | "sheet" | "image" | "figma" | "link";

export interface MockVaultAsset {
  id: string;
  title: string;
  fileType: VaultFileType;
  fileUrl: string;
  sizeKb?: number;
  isSharedSocial: boolean;
  uploadedById: string;
  jobId?: string;
  createdAt: string;
}

export interface MockCourse {
  id: string;
  title: string;
  description: string;
  departmentId: DepartmentSlug;
  isPrimer: boolean;
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; durationMin?: number; body?: string }[];
  }[];
}
