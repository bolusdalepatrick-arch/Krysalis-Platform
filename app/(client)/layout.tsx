import { redirect } from "next/navigation";
import RoleSwitcher from "@/components/RoleSwitcher";
import { signOut } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { portalAreaRedirect } from "@/lib/access";

/** Client portal scope: Butterfree theme, 760px reading measure, masthead
 *  with the wing hairline (PRD 5.9). ADMIN may preview (PRD section 4);
 *  everyone else is sent to the hub — resolved server-side from the DB role. */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const elsewhere = portalAreaRedirect(user.role);
  if (elsewhere) redirect(elsewhere);

  return (
    <div className="theme-client min-h-dvh bg-base text-base text-primary">
      <div className="mx-auto w-full max-w-[760px] px-6">
        <header className="flex items-baseline justify-between pb-4 pt-10">
          <div>
            <p className="text-lg font-bold tracking-[-0.01em]">Krysalis</p>
            <p className="eyebrow mt-1">Client portal</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-secondary">{user.name}</span>
            <form action={signOut}>
              <button type="submit" className="text-sm text-muted underline-offset-2 hover:text-primary hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div aria-hidden className="wing-hairline" />
        <main className="pb-24 pt-8">{children}</main>
      </div>
      <RoleSwitcher activeId={user.id} />
    </div>
  );
}
