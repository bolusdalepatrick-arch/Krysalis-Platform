import Link from "next/link";
import { Settings } from "lucide-react";
import AvatarBadge from "@/components/AvatarBadge";
import { signOut } from "@/app/actions/auth";
import type { Persona } from "@/lib/personas";

/** Top context bar for the employee hub: identity on the right, settings,
 *  sign out. Hairline under, no shadow (PRD 5.4). */
export default function TopBar({ persona }: { persona: Persona }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-end gap-3 border-b border-line bg-base/95 px-4">
      <Link
        href="/settings"
        className="flex h-8 items-center gap-1.5 rounded-s px-2 text-sm text-secondary hover:bg-surface hover:text-primary"
      >
        <Settings size={16} strokeWidth={1.5} aria-hidden />
        Settings
      </Link>
      <span aria-hidden className="h-4 w-px bg-line" />
      <Link
        href={`/dashboard/people/${persona.id}`}
        className="flex items-center gap-2 rounded-s px-1.5 py-1 hover:bg-surface"
      >
        <AvatarBadge id={persona.id} name={persona.name} size={24} />
        <span className="text-sm text-primary">{persona.name}</span>
        <span className="figure text-2xs uppercase tracking-[0.08em] text-muted">
          {persona.role}
        </span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="h-8 rounded-s px-2 text-sm text-secondary hover:bg-surface hover:text-primary"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
