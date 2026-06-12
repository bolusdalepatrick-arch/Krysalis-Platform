import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Composer from "@/components/channels/Composer";
import MessageRow from "@/components/channels/MessageRow";
import ShadowDraftPanel from "@/components/channels/ShadowDraftPanel";
import { channelInfo } from "@/components/channels/channelInfo";
import { getSessionUser } from "@/lib/auth";
import { channelPage, type MessageView } from "@/lib/queries/channels";

/** "Jun 11" — the day-divider label between hairlines (PRD 7.3). */
function dayLabel(at: string): string {
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDay(messages: MessageView[]): { day: string; items: MessageView[] }[] {
  const groups: { day: string; items: MessageView[] }[] = [];
  for (const m of messages) {
    const day = dayLabel(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }
  return groups;
}

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
  const groups = groupByDay(channel.messages);

  return (
    <div>
      <PageHeader eyebrow={info.kindLabel} title={info.title} meta={info.meta} />
      <div className="mx-auto max-w-3xl px-6 py-6">
        {groups.length === 0 ? (
          <p className="py-8 text-sm text-secondary">
            No messages yet. Anything posted here is visible to {info.audience}.
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.day}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-px flex-1 bg-line" />
                  <span className="eyebrow">{group.day}</span>
                  <span aria-hidden className="h-px flex-1 bg-line" />
                </div>
                <div className="mt-4 space-y-4">
                  {group.items.map((m) =>
                    m.isShadowDraft ? (
                      <ShadowDraftPanel key={m.id} message={m} />
                    ) : (
                      <MessageRow key={m.id} message={m} />
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
        <div className="mt-6">
          <Composer placeholder={info.composerPlaceholder} />
        </div>
      </div>
    </div>
  );
}
