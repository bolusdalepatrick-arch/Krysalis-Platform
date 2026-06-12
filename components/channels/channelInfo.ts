import type { ChannelKind } from "@prisma/client";

/** Header and audience copy for a channel, derived from its kind (PRD 7.3,
 *  membership as amended post-M1). The audience phrase feeds both the
 *  header meta and the empty state. */
export interface ChannelInfo {
  kindLabel: string;
  title: string;
  meta: string;
  audience: string;
  composerPlaceholder: string;
}

export function channelInfo(channel: {
  kind: ChannelKind;
  name: string;
  departmentName: string | null;
  accountName: string | null;
}): ChannelInfo {
  switch (channel.kind) {
    case "DEPARTMENT": {
      const deptName = channel.departmentName ?? channel.name;
      return {
        kindLabel: "Department channel",
        title: `#${channel.name}`,
        meta: `Visible to everyone in ${deptName}.`,
        audience: `everyone in ${deptName}`,
        composerPlaceholder: `Message #${channel.name}`,
      };
    }
    case "JOB":
      return {
        kindLabel: "Job channel",
        title: `#${channel.name}`,
        meta: "Visible to the assigned workers, moderators, and admins.",
        audience: "the assigned workers, moderators, and admins",
        composerPlaceholder: `Message #${channel.name}`,
      };
    case "FIRM":
      return {
        kindLabel: "Firm",
        title: `#${channel.name}`,
        meta: "Visible to the whole firm. Bookings from the website land here.",
        audience: "the whole firm",
        composerPlaceholder: `Message #${channel.name}`,
      };
    case "DM":
      return {
        kindLabel: "Direct messages",
        title: channel.name,
        meta: "Visible to its members.",
        audience: "its members",
        composerPlaceholder: `Message ${channel.name}`,
      };
    case "ACCOUNT": {
      const accountName = channel.accountName ?? channel.name;
      return {
        kindLabel: "Client thread",
        title: accountName,
        meta: `Shared with ${accountName} — visible to their portal users, the account owner, the team on their active work, and admins.`,
        audience: `${accountName}'s portal users, the account owner, the team on their active work, and admins`,
        composerPlaceholder: `Message ${accountName}`,
      };
    }
  }
}
