import { DEPARTMENTS, accountById } from "@/lib/mock";
import type { MockChannel } from "@/lib/mock";

/** Header and audience copy for a channel, derived from its kind (PRD 7.3).
 *  The audience phrase feeds both the header meta and the empty state. */
export interface ChannelInfo {
  kindLabel: string;
  title: string;
  meta: string;
  audience: string;
  composerPlaceholder: string;
}

export function channelInfo(channel: MockChannel): ChannelInfo {
  switch (channel.kind) {
    case "DEPARTMENT": {
      const dept = DEPARTMENTS.find((d) => d.id === channel.departmentId);
      const deptName = dept?.name ?? channel.name;
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
        meta: "Visible to the assigned workers and admins.",
        audience: "the assigned workers and admins",
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
    case "ACCOUNT": {
      const accountName = accountById(channel.accountId ?? "")?.name ?? channel.name;
      return {
        kindLabel: "Client thread",
        title: accountName,
        meta: `Shared with ${accountName} — visible to their portal users, the account owner, and admins.`,
        audience: `${accountName}'s portal users, the account owner, and admins`,
        composerPlaceholder: `Message ${accountName}`,
      };
    }
  }
}
