/**
 * The five demo personas behind the role-switcher pill (PRD 7.10).
 *
 * Ids are the stable seed ids from prisma/seed-data.ts — the cookie stores
 * one of these, and once the data layer lands (M1) lib/auth.ts resolves it
 * against the User table. Until then this constant is the resolver.
 */

export type SystemRole = "USER" | "MODERATOR" | "EMPLOYEE" | "CLIENT" | "ADMIN";
export type AccountKind = "INDIVIDUAL" | "BUSINESS";

export interface Persona {
  id: string;
  name: string;
  title: string;
  role: SystemRole;
  /** CLIENT personas only — drives the portal composition (PRD 7.8). */
  accountKind?: AccountKind;
  accountName?: string;
  /** Short line shown in the switcher under the name. */
  caption: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "u-mara",
    name: "Mara Voss",
    title: "Managing Director",
    role: "ADMIN",
    caption: "Admin · full access",
  },
  {
    id: "u-daniel",
    name: "Daniel Okafor",
    title: "Engineering Lead",
    role: "MODERATOR",
    caption: "Moderator · portal editors",
  },
  {
    id: "u-priya",
    name: "Priya Raman",
    title: "Staff Engineer",
    role: "EMPLOYEE",
    caption: "Employee · Engineering",
  },
  {
    id: "u-ruth",
    name: "Ruth Calder",
    title: "Claims Operations Director",
    role: "CLIENT",
    accountKind: "BUSINESS",
    accountName: "Tidegate Insurance",
    caption: "Client · Tidegate Insurance",
  },
  {
    id: "u-mateo",
    name: "Mateo Vargas",
    title: "Independent Financial Planner",
    role: "CLIENT",
    accountKind: "INDIVIDUAL",
    accountName: "Mateo Vargas",
    caption: "Client · individual",
  },
];

export const DEFAULT_EMPLOYEE_PERSONA = "u-mara";
export const DEFAULT_CLIENT_PERSONA = "u-ruth";

export function findPersona(id: string | undefined): Persona | null {
  if (!id) return null;
  return PERSONAS.find((p) => p.id === id) ?? null;
}

export function isEmployeeSide(role: SystemRole): boolean {
  return role === "EMPLOYEE" || role === "MODERATOR" || role === "ADMIN";
}
