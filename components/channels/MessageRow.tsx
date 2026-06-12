import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import BookingCardPanel from "@/components/crm/BookingCardPanel";
import { formatChatTime } from "@/lib/format";
import { BOOKING_CARDS, personById } from "@/lib/mock";
import type { MockMessage } from "@/lib/mock";

/** One chat message (PRD 7.3): avatar, sender and time, body. Gate messages
 *  carrying a booking card render the card inline (PRD 7.12). */
export default function MessageRow({ message }: { message: MockMessage }) {
  const sender = personById(message.senderId);
  const name = sender?.name ?? message.senderId;
  const card = message.bookingCardId
    ? BOOKING_CARDS.find((c) => c.id === message.bookingCardId)
    : undefined;

  return (
    <div className="flex gap-3">
      <AvatarBadge id={message.senderId} name={name} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {sender && !sender.isSystem ? (
            <Link
              href={`/dashboard/people/${sender.id}`}
              className="text-md font-medium text-primary hover:text-accent"
            >
              {name}
            </Link>
          ) : (
            <span className="text-md font-medium text-primary">{name}</span>
          )}
          <span className="figure text-2xs text-muted">{formatChatTime(message.at)}</span>
        </div>
        <p className="mt-0.5 text-md">{message.body}</p>
        {card ? (
          <div className="mt-2">
            <BookingCardPanel card={card} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
