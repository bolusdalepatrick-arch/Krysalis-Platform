import { redirect } from "next/navigation";
import { getSessionPersona } from "@/lib/auth";
import { isEmployeeSide } from "@/lib/personas";

export default async function Home() {
  const persona = await getSessionPersona();
  if (!persona) redirect("/login");
  redirect(isEmployeeSide(persona.role) ? "/dashboard" : "/client-portal");
}
