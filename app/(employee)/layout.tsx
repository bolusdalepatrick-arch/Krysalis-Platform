import { redirect } from "next/navigation";
import Rail, { type RailData } from "@/components/shell/Rail";
import TopBar from "@/components/shell/TopBar";
import RoleSwitcher from "@/components/RoleSwitcher";
import ToastProvider from "@/components/toast/ToastProvider";
import { getSessionUser } from "@/lib/auth";
import { employeeAreaRedirect } from "@/lib/access";
import { railChannels } from "@/lib/queries/channels";

/** Employee hub scope: Metapod theme, 248px rail, canopy grain (PRD 5.9).
 *  Identity resolves here, on the server — never client state (PRD section 6).
 *  The rail's channel groups read the database (so channels the marketplace
 *  provisions appear); visibility follows lib/channels.ts membership. */
export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Server-side leakage guard (PRD 7.8): a CLIENT is refused the hub and
  // redirected to the portal, a parked USER to login — every route under
  // this group, not just the ones with nav links.
  const elsewhere = employeeAreaRedirect(user.role);
  if (elsewhere) redirect(elsewhere);

  const groups = await railChannels(user);
  const rail: RailData = { ...groups };

  return (
    <div className="theme-employee min-h-dvh bg-base text-md text-primary">
      <ToastProvider>
        <Rail data={rail} />
        <div className="pl-[248px]">
          <TopBar
            user={{
              id: user.id,
              name: user.name,
              role: user.role,
              tier: user.currentTierLevel,
            }}
          />
          <main className="min-h-[calc(100dvh-3rem)]">{children}</main>
        </div>
        <div aria-hidden className="canopy-grain" />
        <div aria-hidden className="canopy-vignette" />
        <RoleSwitcher activeId={user.id} />
      </ToastProvider>
    </div>
  );
}
