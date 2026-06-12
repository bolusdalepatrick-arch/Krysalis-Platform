import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { firstChannelId } from "@/lib/queries/channels";

/** /dashboard/channels redirects to the viewer's first channel (PRD section 6). */
export default async function ChannelsIndexPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const first = await firstChannelId(viewer);
  redirect(first ? `/dashboard/channels/${first}` : "/dashboard");
}
