import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChannelThread from "@/components/channels/ChannelThread";
import DraftUpdateButton from "@/components/channels/DraftUpdateButton";
import { channelInfo } from "@/components/channels/channelInfo";
import { getSessionUser } from "@/lib/auth";
import { channelPage } from "@/lib/queries/channels";

/** A channel (PRD 7.3): header with the audience, the live thread with
 *  optimistic send and the 5-second poll, and — in JOB channels, for the
 *  people who can decide drafts — the "Draft update" affordance. */
export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const channel = await channelPage(channelId, viewer);
  if (!channel) notFound();

  const info = channelInfo(channel);
  const showDraftButton =
    channel.kind === "JOB" &&
    channel.canDecideDrafts &&
    channel.jobId !== null &&
    channel.jobStatus !== "COMPLETED";

  return (
    <div>
      <PageHeader
        eyebrow={info.kindLabel}
        title={info.title}
        meta={
          channel.jobStatus === "COMPLETED"
            ? `${info.meta} Archived — the job is complete.`
            : info.meta
        }
        actions={showDraftButton ? <DraftUpdateButton jobId={channel.jobId!} /> : undefined}
      />
      <div className="mx-auto max-w-3xl px-6 py-6">
        <ChannelThread
          channelId={channel.id}
          initialMessages={channel.messages}
          canPost={channel.canPost}
          canDecideDrafts={channel.canDecideDrafts}
          placeholder={info.composerPlaceholder}
          audience={info.audience}
          posters={info.posters}
          viewer={{
            id: viewer.id,
            name: viewer.name,
            tier: viewer.role !== "CLIENT" && viewer.role !== "USER" ? viewer.currentTierLevel : null,
          }}
        />
      </div>
    </div>
  );
}
