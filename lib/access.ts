import type { SystemRole } from "@/lib/personas";

/** Server-side access guards (PRD 7.8, the pre-M7 isolation ruling). Pure
 *  functions so the boundary is pinned by tests, not by hidden UI links.
 *  The route-group layouts call the redirect helpers; the portal reads call
 *  canViewAccount. */

/** Where a viewer of the employee hub must be sent instead, or null to let
 *  them through. A CLIENT is refused and redirected to the portal — the
 *  redirect is the enforcement, not the absence of a nav link; a parked
 *  USER is sent to login. */
export function employeeAreaRedirect(role: SystemRole): "/login" | "/client-portal" | null {
  if (role === "CLIENT") return "/client-portal";
  if (role === "USER") return "/login";
  return null;
}

/** Where a viewer of the client portal must be sent instead, or null to let
 *  them through. Clients see their portal; ADMIN may preview (PRD section 4);
 *  everyone else belongs in the hub. */
export function portalAreaRedirect(role: SystemRole): "/dashboard" | null {
  if (role === "CLIENT" || role === "ADMIN") return null;
  // EMPLOYEE/MODERATOR belong in the hub; a parked USER has no portal, and
  // the hub layout bounces it on to login.
  return "/dashboard";
}

export interface AccountViewer {
  role: SystemRole;
  /** The CLIENT's own account; null for everyone else. */
  accountId: string | null;
}

/** May this viewer see a given account's portal-scoped data? ADMIN previews
 *  any account; a CLIENT sees only their own (the session accountId), so an
 *  id swapped in a URL never widens the scope. No other role reaches portal
 *  data. */
export function canViewAccount(viewer: AccountViewer, accountId: string): boolean {
  if (viewer.role === "ADMIN") return true;
  if (viewer.role === "CLIENT") return viewer.accountId === accountId;
  return false;
}
