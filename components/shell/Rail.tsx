"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Briefcase,
  CalendarDays,
  Funnel,
  GraduationCap,
  Hash,
  MessagesSquare,
  Trophy,
  Waypoints,
} from "lucide-react";
import clsx from "clsx";

export interface RailChannelItem {
  href: string;
  label: string;
  /** Completed jobs' channels read archived (PRD 7.3): muted label. */
  archived?: boolean;
}

export interface RailData {
  /** Shown while the viewer's onboarding is incomplete (PRD 7.13). */
  firstWeek?: { done: number; total: number };
  firm: RailChannelItem[];
  departments: RailChannelItem[];
  jobs: RailChannelItem[];
  clients: RailChannelItem[];
  direct: RailChannelItem[];
}

const TOP_NAV = [
  { href: "/dashboard", label: "Today", icon: CalendarDays },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Briefcase },
  { href: "/dashboard/crm", label: "CRM", icon: Funnel },
  { href: "/dashboard/academy", label: "Academy", icon: GraduationCap },
];

const BOTTOM_NAV = [
  { href: "/dashboard/forum", label: "Forum", icon: MessagesSquare },
  { href: "/dashboard/vault", label: "Vault", icon: Archive },
  { href: "/dashboard/graph", label: "Graph", icon: Waypoints },
  { href: "/dashboard/leaderboards", label: "Leaderboards", icon: Trophy },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-9 items-center gap-2.5 rounded-s px-2.5 text-sm",
        active
          ? "bg-accent-soft font-medium text-accent"
          : "text-secondary hover:bg-surface hover:text-primary",
      )}
    >
      {Icon ? <Icon size={18} strokeWidth={1.5} aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ChannelGroup({
  title,
  items,
  pathname,
  hash,
}: {
  title: string;
  items: RailChannelItem[];
  pathname: string;
  hash?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="eyebrow px-2.5 pb-1">{title}</div>
      {items.map((c) => {
        const active = pathname === c.href;
        return (
          <Link
            key={c.href}
            href={c.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-8 items-center gap-2 rounded-s px-2.5 text-sm",
              active
                ? "bg-accent-soft font-medium text-accent"
                : "text-secondary hover:bg-surface hover:text-primary",
            )}
          >
            {hash ? <Hash size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-muted" /> : null}
            <span className={clsx("truncate", c.archived && "text-muted")}>{c.label}</span>
            {c.archived ? <span className="figure ml-auto shrink-0 text-2xs text-muted">archived</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

/** The employee-hub left rail (PRD section 6). 248px, full height, hairline
 *  edge; channel groups under specimen-label eyebrows. */
export default function Rail({ data }: { data: RailData }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-surface"
    >
      <div className="flex h-12 items-center border-b border-line px-4">
        <Link href="/dashboard" className="text-sm font-bold tracking-[-0.01em] text-primary">
          Krysalis
          <span className="figure ml-1.5 text-2xs font-normal text-muted">OS</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {data.firstWeek && (
          <NavLink
            href="/dashboard/welcome"
            label={`First week · ${data.firstWeek.done} of ${data.firstWeek.total}`}
            active={isActive("/dashboard/welcome")}
          />
        )}
        {TOP_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <ChannelGroup title="Firm" items={data.firm} pathname={pathname} hash />
        <ChannelGroup title="Channels" items={data.departments} pathname={pathname} hash />
        <ChannelGroup title="Active jobs" items={data.jobs} pathname={pathname} hash />
        <ChannelGroup title="Clients" items={data.clients} pathname={pathname} />
        <ChannelGroup title="Direct" items={data.direct} pathname={pathname} />

        <div className="mt-4 border-t border-line pt-3">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}
