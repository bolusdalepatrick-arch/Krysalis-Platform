import { DEPARTMENTS as SEED_DEPARTMENTS, USERS } from "../../prisma/seed-data";
import type { MockDepartment, MockPerson } from "./types";

/** People and departments, re-exported from the canonical seed narrative
 *  (prisma/seed-data.ts). The xp/tier/earnings figures on these rows are M0
 *  display approximations; the database holds the ledger-derived truth. */
export const DEPARTMENTS: MockDepartment[] = SEED_DEPARTMENTS;
export const PEOPLE: MockPerson[] = USERS;

export const TIER_NAMES: Record<number, string> = {
  1: "Larva",
  2: "Instar",
  3: "Chrysalis",
  4: "Eclosion",
  5: "Imago",
};

export function personById(id: string): MockPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}

export function employeesOf(departmentId: string): MockPerson[] {
  return PEOPLE.filter((p) => p.departmentId === departmentId && !p.isSystem);
}
