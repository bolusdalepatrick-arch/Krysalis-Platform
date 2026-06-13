import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import GuideEditorSection from "@/components/settings/GuideEditorSection";
import InfoBarSection from "@/components/settings/InfoBarSection";
import PeopleMatrix from "@/components/settings/PeopleMatrix";
import ProfileSection from "@/components/settings/ProfileSection";
import { getSessionUser } from "@/lib/auth";
import { guideMarkdown, infoBarRows, userMatrix } from "@/lib/queries/settings";

/** Settings (PRD 7.9): tiered by role, resolved from the database. The page
 *  sits outside the route groups, so the theme scope follows the role here
 *  (PRD section 6). Each tier's actions re-check the role server-side. */
export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Settings sits outside the route groups, so it self-guards: a parked
  // USER has no surface here, the same as every other route (PRD 7.10).
  if (user.role === "USER") redirect("/login");

  const isClient = user.role === "CLIENT";
  const editsPortal = user.role === "MODERATOR" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";
  const backHref = isClient ? "/client-portal" : "/dashboard";

  const [guide, infoBar, matrix] = await Promise.all([
    editsPortal ? guideMarkdown() : Promise.resolve(""),
    editsPortal ? infoBarRows() : Promise.resolve([]),
    isAdmin ? userMatrix() : Promise.resolve({ people: [], departments: [] }),
  ]);

  return (
    <div
      className={clsx(
        isClient ? "theme-client text-base" : "theme-employee text-md",
        "min-h-dvh bg-base text-primary",
      )}
    >
      <div className="mx-auto w-full max-w-3xl px-6 pb-24">
        <header className="border-b border-line py-5">
          <div className="flex items-center justify-between">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary"
            >
              <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
              Back
            </Link>
            <span className="figure text-2xs text-muted">
              {user.name} · {user.role}
            </span>
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-[-0.01em]">Settings</h1>
        </header>
        <main className="divide-y divide-line">
          <ProfileSection name={user.name} title={user.title} email={user.email} role={user.role} />
          {editsPortal ? <GuideEditorSection published={guide} /> : null}
          {editsPortal ? <InfoBarSection rows={infoBar} /> : null}
          {isAdmin ? (
            <PeopleMatrix people={matrix.people} departments={matrix.departments} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
