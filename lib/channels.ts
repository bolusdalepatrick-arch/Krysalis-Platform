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
      return channel.memberIds.includes(viewer.id);
  }
}
