import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import GuideEditorSection from "@/components/settings/GuideEditorSection";
import InfoBarSection from "@/components/settings/InfoBarSection";
import PeopleMatrix from "@/components/settings/PeopleMatrix";
import ProfileSection from "@/components/settings/ProfileSection";
import { getSessionPersona } from "@/lib/auth";
import { personById } from "@/lib/mock";

/** Settings (PRD 7.9): tiered by role. The page sits outside the route
 *  groups, so the theme scope follows the persona here (PRD section 6). */
export default async function SettingsPage() {
  const persona = await getSessionPersona();
  if (!persona) redirect("/login");

  const isClient = persona.role === "CLIENT";
  const editsPortal = persona.role === "MODERATOR" || persona.role === "ADMIN";
  const backHref = isClient ? "/client-portal" : "/dashboard";

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
              {persona.name} · {persona.role}
            </span>
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-[-0.01em]">Settings</h1>
        </header>
        <main className="divide-y divide-line">
          <ProfileSection persona={persona} email={personById(persona.id)?.email} />
          {editsPortal && <GuideEditorSection />}
          {editsPortal && <InfoBarSection />}
          {persona.role === "ADMIN" && <PeopleMatrix />}
        </main>
      </div>
    </div>
  );
}
