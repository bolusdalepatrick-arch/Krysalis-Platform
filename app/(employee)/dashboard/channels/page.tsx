import { redirect } from "next/navigation";

/** /dashboard/channels has no view of its own — land in #engineering. */
export default function ChannelsIndexPage() {
  redirect("/dashboard/channels/ch-engineering");
}
