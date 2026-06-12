import { redirect } from "next/navigation";
import Rail, { type RailData } from "@/components/shell/Rail";
import TopBar from "@/components/shell/TopBar";
import RoleSwitcher from "@/components/RoleSwitcher";
import { getSessionPersona } from "@/lib/auth";
import { isEmployeeSide } from "@/lib/personas";
import { ACCOUNTS, CHANNELS } from "@/lib/mock";

/** Employee hub scope: Metapod theme, 248px rail, canopy grain (PRD 5.9).
 *  Identity resolves here, on the server — never client state (PRD section 6). */
export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const persona = await getSessionPersona();
  if (!persona) redirect("/login");
  if (!isEmployeeSide(persona.role)) redirect("/client-portal");

  const canSeeClients = persona.role === "ADMIN" || persona.role === "MODERATOR";
  const rail: RailData = {
    firm: CHANNELS.filter((c) => c.kind === "FIRM").map((c) => ({
      href: `/dashboard/channels/${c.id}`,
      label: c.name,
    })),
    departments: CHANNELS.filter((c) => c.kind === "DEPARTMENT").map((c) => ({
      href: `/dashboard/channels/${c.id}`,
      label: c.name,
    })),
    jobs: CHANNELS.filter((c) => c.kind === "JOB").map((c) => ({
      href: `/dashboard/channels/${c.id}`,
      label: c.name,
    })),
    clients: canSeeClients
      ? CHANNELS.filter((c) => c.kind === "ACCOUNT").map((c) => ({
          href: `/dashboard/channels/${c.id}`,
          label: ACCOUNTS.find((a) => a.id === c.accountId)?.name ?? c.name,
        }))
      : [],
  };

  return (
    <div className="theme-employee min-h-dvh bg-base text-md text-primary">
      <Rail data={rail} />
      <div className="pl-[248px]">
        <TopBar persona={persona} />
        <main className="min-h-[calc(100dvh-3rem)]">{children}</main>
      </div>
      <div aria-hidden className="canopy-grain" />
      <div aria-hidden className="canopy-vignette" />
      <RoleSwitcher activeId={persona.id} />
    </div>
  );
}
