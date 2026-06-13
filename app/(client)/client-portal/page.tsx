import { notFound, redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import AccountThread from "@/components/portal/AccountThread";
import BusinessPortal from "@/components/portal/BusinessPortal";
import IndividualPortal from "@/components/portal/IndividualPortal";
import InfoBar from "@/components/portal/InfoBar";
import SharedAssets from "@/components/portal/SharedAssets";
import { getSessionUser } from "@/lib/auth";
import { canViewAccount } from "@/lib/access";
import { channelPage } from "@/lib/queries/channels";
import { portalData } from "@/lib/queries/portal";

/** Admins preview the portal as Tidegate — Ruth's view (PRD section 4). */
const ADMIN_PREVIEW_ACCOUNT_ID = "a-tidegate";

/**
 * The client portal (PRD 7.8): one theme, two compositions, switched by
 * account kind on the server. Everything is the account-scoped, client-safe
 * projection — the account is resolved from the session, never a URL id, and
 * the leakage guarantees in 7.8 hold server-side.
 */
export default async function ClientPortalPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const isClient = viewer.role === "CLIENT";
  const accountId = isClient ? viewer.accountId : ADMIN_PREVIEW_ACCOUNT_ID;
  if (!accountId) notFound();
  if (!canViewAccount({ role: viewer.role, accountId: viewer.accountId }, accountId)) {
    notFound();
  }

  const data = await portalData(accountId, viewer.id);
  if (!data) notFound();

  const channel = data.threadChannelId
    ? await channelPage(data.threadChannelId, viewer)
    : null;
  const thread = channel ? (
    <AccountThread
      channelId={channel.id}
      initialMessages={channel.messages}
      canPost={channel.canPost}
      viewer={{ id: viewer.id, name: viewer.name }}
      withReviewCall={data.account.kind === "BUSINESS"}
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

  return (
    <div className="space-y-10">
      <InfoBar messages={data.infoBar} />

      {data.account.kind === "BUSINESS" ? (
        <BusinessPortal
          accountName={data.account.name}
          jobs={data.jobs}
          contact={data.contact}
          thread={thread}
          showStartHere={isClient && data.viewer.portalStartDismissedAt === null}
        />
      ) : (
        <IndividualPortal
          jobs={data.jobs}
          assets={data.assets}
          thread={thread}
          setup={
            isClient
              ? {
                  name: data.viewer.name,
                  detailsConfirmedAt: data.viewer.detailsConfirmedAt,
                  portalStartDismissedAt: data.viewer.portalStartDismissedAt,
                  briefReviewedAt: data.viewer.briefReviewedAt,
                  mostRecentJobId: data.mostRecentJobId,
                }
              : null
          }
        />
      )}

      <section id="guide">
        <Eyebrow as="h2">Guide</Eyebrow>
        <Markdown className="mt-2">{data.guideMarkdown}</Markdown>
      </section>

      {data.account.kind === "BUSINESS" ? <SharedAssets assets={data.assets} /> : null}
    </div>
  );
}
