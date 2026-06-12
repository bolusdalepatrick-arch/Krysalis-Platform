"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PERSONA_COOKIE } from "@/lib/auth";
import {
  DEFAULT_CLIENT_PERSONA,
  DEFAULT_EMPLOYEE_PERSONA,
  findPersona,
  isEmployeeSide,
} from "@/lib/personas";

async function setPersonaCookie(personaId: string) {
  const store = await cookies();
  store.set(PERSONA_COOKIE, personaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

/** Login form: any credentials work (PRD 7.10). The side toggle decides the
 *  default persona; the pill swaps from there. */
export async function signIn(formData: FormData) {
  const side = formData.get("side") === "client" ? "client" : "employee";
  const personaId =
    side === "client" ? DEFAULT_CLIENT_PERSONA : DEFAULT_EMPLOYEE_PERSONA;
  await setPersonaCookie(personaId);
  redirect(side === "client" ? "/client-portal" : "/dashboard");
}

/** The role-switcher pill (PRD 7.10): swap the cookie, land on that
 *  persona's home surface. */
export async function switchPersona(personaId: string) {
  const persona = findPersona(personaId);
  if (!persona) return;
  await setPersonaCookie(persona.id);
  redirect(isEmployeeSide(persona.role) ? "/dashboard" : "/client-portal");
}

export async function signOut() {
  const store = await cookies();
  store.delete(PERSONA_COOKIE);
  redirect("/login");
}
