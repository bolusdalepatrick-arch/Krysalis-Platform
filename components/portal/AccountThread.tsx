import Eyebrow from "@/components/Eyebrow";
import AvatarBadge from "@/components/AvatarBadge";
import { formatChatTime, formatDate } from "@/lib/format";
import { personById } from "@/lib/mock";
import type { MockMessage } from "@/lib/mock";

function groupByDay(messages: MockMessage[]): { day: string; items: MockMessage[] }[] {
  const groups: { day: string; items: MockMessage[] }[] = [];
  for (const message of messages) {
    const day = formatDate(message.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(message);
    else groups.push({ day, items: [message] });
  }
  return groups;
}

/**
 * The account thread (PRD 7.3, 7.8): day-grouped messages and the composer.
 * Sending needs the database (M2+); the composer renders disabled with its
 * real labels. Sender names are plain text — clients get no hub links.
 */
export default function AccountThread({ messages }: { messages: MockMessage[] }) {
  const days = groupByDay(messages);

  return (
    <section>
      <Eyebrow as="h2">Messages</Eyebrow>
      {days.length === 0 ? (
        <p className="mt-3 text-base text-secondary">
          No messages yet. Notes posted here go straight to the people doing your work.
        </p>
      ) : (
        <div className="mt-3 space-y-6">
          {days.map((group) => (
            <div key={group.day}>
              <p className="eyebrow border-b border-line pb-2">{group.day}</p>
              <ul>
                {group.items.map((message) => {
                  const sender = personById(message.senderId);
                  return (
                    <li key={message.id} className="flex gap-3 py-3.5">
                      <AvatarBadge id={message.senderId} name={sender?.name ?? "Krysalis"} />
                      <div className="min-w-0">
                        <p>
                          <span className="font-medium text-primary">{sender?.name ?? "Krysalis"}</span>{" "}
                          <span className="figure text-xs text-muted">{formatChatTime(message.at)}</span>
                        </p>
                        <p className="mt-0.5 text-base text-secondary">{message.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-3 rounded-m border border-line bg-raised p-3">
        <input
          type="text"
          disabled
          placeholder="Message the team"
          aria-label="Message the team"
          className="h-9 min-w-0 flex-1 rounded-s border border-line bg-inset px-3 text-base text-primary placeholder:text-muted disabled:opacity-60"
        />
        <button
          type="button"
          disabled
          className="h-9 shrink-0 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          Send
        </button>
      </div>
      <div className="mt-2">
        <button
          type="button"
          disabled
          className="text-sm text-muted underline underline-offset-2 disabled:opacity-60"
        >
          Request a review call
        </button>
      </div>
    </section>
  );
}
