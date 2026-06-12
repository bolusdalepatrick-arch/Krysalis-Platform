import type { ChannelKind } from "@prisma/client";

/** Header and audience copy for a channel, derived from its kind (PRD 7.3,
 *  membership as amended post-M1). The audience phrase feeds both the
 *  header meta and the empty state. */
export interface ChannelInfo {
  kindLabel: string;
  title: string;
  meta: string;
  audience: string;
  /** Who may post — differs from the audience only for department channels. */
  posters: string;
  composerPlaceholder: string;
}

export function channelInfo(channel: {
  kind: ChannelKind;
  name: string;
  departmentName: string | null;
  accountName: string | null;
  dmPartnerName?: string | null;
}): ChannelInfo {
  switch (channel.kind) {
    case "DEPARTMENT": {
      const deptName = channel.departmentName ?? channel.name;
      return {
        kindLabel: "Department channel",
        title: `#${channel.name}`,
        meta: `${deptName}'s home channel — the whole firm can read along; ${deptName} and admins post.`,
        audience: "the whole firm",
        posters: `${deptName} and admins`,
        composerPlaceholder: `Message #${channel.name}`,
      };
    }
    case "JOB":
      return {
        kindLabel: "Job channel",
        title: `#${channel.name}`,
        meta: "Visible to the assigned workers, moderators, and admins.",
        audience: "the assigned workers, moderators, and admins",
        posters: "the assigned workers, moderators, and admins",
        composerPlaceholder: `Message #${channel.name}`,
      };
    case "FIRM":
      return {
        kindLabel: "Firm",
        title: `#${channel.name}`,
        meta: "Visible to the whole firm. Bookings from the website land here.",
        audience: "the whole firm",
        posters: "the whole firm",
        composerPlaceholder: `Message #${channel.name}`,
      };
    case "DM": {
      const partner = channel.dmPartnerName ?? "the two of you";
      return {
        kindLabel: "Direct messages",
        title: channel.dmPartnerName ?? channel.name,
        meta: "Visible to the two of you.",
        audience: "the two of you",
        posters: "the two of you",
        composerPlaceholder: `Message ${partner}`,
      };
    }
    case "ACCOUNT": {
      const accountName = channel.accountName ?? channel.name;
      return {
        kindLabel: "Client thread",
        title: accountName,
        meta: `Shared with ${accountName} — visible to their portal users, the account owner, the team on their active work, and admins.`,
        audience: `${accountName}'s portal users, the account owner, the team on their active work, and admins`,
        posters: `${accountName}'s portal users, the account owner, the team on their active work, and admins`,
        composerPlaceholder: `Message ${accountName}`,
      };
    }
  }
}
