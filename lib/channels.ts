import type { ChannelKind, SystemRole } from "@prisma/client";

/** Derived channel membership (PRD 7.3, as amended post-M1): pure rules,
 *  shared by the rail, the channel page, and — from M4 — the posting and
 *  polling actions.
 *
 *  DEPARTMENT  department members (visible across the employee side)
 *  JOB         assigned workers + moderators + admins
 *  FIRM        every employee-side role
 *  ACCOUNT     the account's portal users + the owning employee (won-deal
 *              owner) + workers on the account's non-COMPLETED jobs + admins
 *  DM          explicit members only
 */

export interface ChannelViewer {
  id: string;
  role: SystemRole;
  departmentId: string | null;
}

export interface ChannelFacts {
  kind: ChannelKind;
  departmentId: string | null;
  /** JOB channels: assigned worker ids. */
  jobWorkerIds: string[];
  /** ACCOUNT channels: portal user ids on the account. */
  accountUserIds: string[];
  /** ACCOUNT channels: owners of the account's won deals. */
  accountOwnerIds: string[];
  /** ACCOUNT channels: workers on the account's non-COMPLETED jobs. */
  accountWorkerIds: string[];
  /** DM channels: explicit member ids. */
  memberIds: string[];
}

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

export function canViewChannel(viewer: ChannelViewer, channel: ChannelFacts): boolean {
  const isAdmin = viewer.role === "ADMIN";
  switch (channel.kind) {
    case "FIRM":
      return EMPLOYEE_SIDE.includes(viewer.role);
    case "DEPARTMENT":
      // Open to the whole firm to read; members post (canPostChannel).
      // The section 6 rail lists all department channels unqualified while
      // account threads are "the viewer can see" — reading flagged for a
      // ruling in the M4 report.
      return EMPLOYEE_SIDE.includes(viewer.role);
    case "JOB":
      return (
        isAdmin ||
        viewer.role === "MODERATOR" ||
        channel.jobWorkerIds.includes(viewer.id)
      );
    case "ACCOUNT":
      return (
        isAdmin ||
        channel.accountUserIds.includes(viewer.id) ||
        channel.accountOwnerIds.includes(viewer.id) ||
        channel.accountWorkerIds.includes(viewer.id)
      );
    case "DM":
      // Defense in depth: DMs connect employees (post-M3 ruling) — a
      // CLIENT or USER row in memberIds must never grant access.
      return EMPLOYEE_SIDE.includes(viewer.role) && channel.memberIds.includes(viewer.id);
  }
}

/** Posting is membership (PRD 7.3): department channels take their own
 *  members (and admins); everything else posts where it views. CLIENT
 *  users post only in their own ACCOUNT thread (section 4). */
export function canPostChannel(viewer: ChannelViewer, channel: ChannelFacts): boolean {
  if (channel.kind === "DEPARTMENT") {
    return (
      viewer.role === "ADMIN" ||
      (EMPLOYEE_SIDE.includes(viewer.role) && viewer.departmentId === channel.departmentId)
    );
  }
  if (viewer.role === "CLIENT") {
    return channel.kind === "ACCOUNT" && channel.accountUserIds.includes(viewer.id);
  }
  return canViewChannel(viewer, channel);
}

/** Who may see and decide a Shadow draft in a JOB channel: that job's
 *  workers, moderators, and admins (section 4 matrix). */
export function canDecideShadowDraft(viewer: ChannelViewer, channel: ChannelFacts): boolean {
  return (
    channel.kind === "JOB" &&
    (viewer.role === "ADMIN" ||
      viewer.role === "MODERATOR" ||
      channel.jobWorkerIds.includes(viewer.id))
  );
}

/** Deterministic DM channel id for an employee pair — the primary key is
 *  the uniqueness guard (post-M2 conditional-write rule): a concurrent
 *  second startDm hits the id conflict instead of creating a duplicate. */
export function dmChannelId(a: string, b: string): string {
  return `dm--${[a, b].sort().join("--")}`;
}
