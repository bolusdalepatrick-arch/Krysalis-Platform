import Eyebrow from "@/components/Eyebrow";
import ChannelThread from "@/components/channels/ChannelThread";
import type { MessageView } from "@/lib/queries/channels";

/**
 * The account thread inside the portal (PRD 7.3, 7.8): the same live
 * thread as the hub — day groups, optimistic send, the 5-second poll —
 * restyled by the Butterfree scope. Sender names stay plain text (no hub
 * links), and the business composition carries the review-call prefill:
 * a message a person answers, not a calendar integration.
 */
export default function AccountThread({
  channelId,
  initialMessages,
  canPost,
  viewer,
  withReviewCall,
}: {
  channelId: string;
  initialMessages: MessageView[];
  canPost: boolean;
  viewer: { id: string; name: string };
  withReviewCall: boolean;
}) {
  return (
    <section>
      <Eyebrow as="h2">Messages</Eyebrow>
      <div className="mt-3">
        <ChannelThread
          channelId={channelId}
          initialMessages={initialMessages}
          canPost={canPost}
          canDecideDrafts={false}
          placeholder="Message the team"
          audience="you and your team at Krysalis"
          posters="you and your team at Krysalis"
          viewer={{ id: viewer.id, name: viewer.name, tier: null }}
          linkSenders={false}
          showTiers={false}
          prefill={
            withReviewCall
              ? { label: "Request a review call", text: "We'd like to schedule a review call." }
              : undefined
          }
        />
      </div>
    </section>
  );
}
