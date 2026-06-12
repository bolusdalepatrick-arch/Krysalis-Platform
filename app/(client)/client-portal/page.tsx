import { notFound, redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import AccountThread from "@/components/portal/AccountThread";
import BusinessPortal from "@/components/portal/BusinessPortal";
import IndividualPortal from "@/components/portal/IndividualPortal";
import InfoBar from "@/components/portal/InfoBar";
import SharedAssets from "@/components/portal/SharedAssets";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { channelPage } from "@/lib/queries/channels";
import { ACCOUNTS, INFO_BAR_MESSAGES, JOBS, PORTAL_GUIDE_MD } from "@/lib/mock";

/** Admins preview the portal as Tidegate — Ruth's view (PRD section 4). */
const ADMIN_PREVIEW_ACCOUNT_ID = "a-tidegate";

/**
 * The client portal (PRD 7.8): one theme, two compositions, switched by
 * account kind on the server. The message thread is live (M4) — the only
 * channel a CLIENT can see or post in; the rest of the composition reads
 * the M0 narrative until M7.
 */
export default async function ClientPortalPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const accountId =
    viewer.role === "CLIENT" ? viewer.accountId : ADMIN_PREVIEW_ACCOUNT_ID;
  const account = ACCOUNTS.find((a) => a.id === accountId);
  if (!account) notFound();

  const jobs = JOBS.filter((job) => job.accountId === account.id);

  const dbChannel = await prisma.channel.findFirst({ where: { accountId: account.id } });
  const channel = dbChannel ? await channelPage(dbChannel.id, viewer) : null;
  const thread = channel ? (
    <AccountThread
      channelId={channel.id}
      initialMessages={channel.messages}
      canPost={channel.canPost}
      viewer={{ id: viewer.id, name: viewer.name }}
      withReviewCall={account.kind === "BUSINESS"}
    />
  ) : (
    <section>
      <Eyebrow as="h2">Messages</Eyebrow>
      <p className="mt-3 text-base text-secondary">
        Your thread opens with your first engagement. Until then, your contact
        is reachable by email.
      </p>
    </section>
  );

  const infoMessages = INFO_BAR_MESSAGES.filter((m) => m.isActive)
    .sort((a, b) => a.order - b.order)
    .map(({ id, text, href }) => ({ id, text, href }));

  return (
    <div className="space-y-10">
      <InfoBar messages={infoMessages} />

      {account.kind === "BUSINESS" ? (
        <BusinessPortal account={account} jobs={jobs} thread={thread} />
      ) : (
        <IndividualPortal jobs={jobs} thread={thread} />
      )}

      <section id="guide">
        <Eyebrow as="h2">Guide</Eyebrow>
        <Markdown className="mt-2">{PORTAL_GUIDE_MD}</Markdown>
      </section>

      <SharedAssets jobs={jobs} />
    </div>
  );
}
