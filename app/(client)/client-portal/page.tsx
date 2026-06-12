import { notFound, redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import BusinessPortal from "@/components/portal/BusinessPortal";
import IndividualPortal from "@/components/portal/IndividualPortal";
import InfoBar from "@/components/portal/InfoBar";
import SharedAssets from "@/components/portal/SharedAssets";
import { getSessionPersona } from "@/lib/auth";
import {
  ACCOUNTS,
  CHANNELS,
  INFO_BAR_MESSAGES,
  JOBS,
  MESSAGES,
  PORTAL_GUIDE_MD,
  personById,
} from "@/lib/mock";

/** Admins preview the portal as Tidegate — Ruth's view (PRD section 4). */
const ADMIN_PREVIEW_ACCOUNT_ID = "a-tidegate";

/**
 * The client portal (PRD 7.8): one theme, two compositions, switched by
 * account kind on the server. Everything is scoped to the session user's
 * account; no internal vocabulary renders here.
 */
export default async function ClientPortalPage() {
  const persona = await getSessionPersona();
  if (!persona) redirect("/login");

  const accountId =
    persona.role === "CLIENT" ? personById(persona.id)?.accountId : ADMIN_PREVIEW_ACCOUNT_ID;
  const account = ACCOUNTS.find((a) => a.id === accountId);
  if (!account) notFound();

  const jobs = JOBS.filter((job) => job.accountId === account.id);
  const channel = CHANNELS.find((c) => c.kind === "ACCOUNT" && c.accountId === account.id);
  const messages = MESSAGES.filter(
    (message) => message.channelId === channel?.id && !message.isShadowDraft,
  ).sort((a, b) => a.at.localeCompare(b.at));

  const infoMessages = INFO_BAR_MESSAGES.filter((m) => m.isActive)
    .sort((a, b) => a.order - b.order)
    .map(({ id, text, href }) => ({ id, text, href }));

  return (
    <div className="space-y-10">
      <InfoBar messages={infoMessages} />

      {account.kind === "BUSINESS" ? (
        <BusinessPortal account={account} jobs={jobs} messages={messages} />
      ) : (
        <IndividualPortal jobs={jobs} messages={messages} />
      )}

      <section id="guide">
        <Eyebrow as="h2">Guide</Eyebrow>
        <Markdown className="mt-2">{PORTAL_GUIDE_MD}</Markdown>
      </section>

      <SharedAssets jobs={jobs} />
    </div>
  );
}
