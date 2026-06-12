import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { findPersona, type Persona, type SystemRole } from "@/lib/personas";

/**
 * Mock authentication, insecure by design (PRD 7.10): the persona cookie is
 * the whole session. Auth.js replaces this seam in V3.
 */
export const PERSONA_COOKIE = "krysalis_persona";

export async function getSessionPersona(): Promise<Persona | null> {
  const store = await cookies();
  return findPersona(store.get(PERSONA_COOKIE)?.value);
}

/** The database-backed session (M1+). The cookie holds a seeded user id;
 *  feature milestones read this instead of the static persona list. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(PERSONA_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Role gate for Server Actions (PRD section 4): resolves the session
 *  against the User table so role changes in the database are honored —
 *  the static persona list is only the switcher's display catalog.
 *  Throws to the nearest error boundary; actions should catch and return
 *  an ActionResult. */
export async function requireRole(...roles: SystemRole[]): Promise<User> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    throw new Error("You don't have access to this area.");
  }
  return user;
}
