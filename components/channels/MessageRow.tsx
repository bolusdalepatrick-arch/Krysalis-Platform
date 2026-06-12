import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import BookingCardPanel from "@/components/crm/BookingCardPanel";
import { formatChatTime } from "@/lib/format";
import type { MessageView } from "@/lib/queries/channels";

/** One chat message (PRD 7.3): avatar, sender and time, body. Gate messages
 *  carrying a booking card render the card inline (PRD 7.12). */
export default function MessageRow({ message }: { message: MessageView }) {
  return (
    <div className="flex gap-3">
      <AvatarBadge id={message.senderId} name={message.senderName} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {!message.senderIsSystem ? (
            <Link
              href={`/dashboard/people/${message.senderId}`}
              className="text-md font-medium text-primary hover:text-accent"
            >
              {message.senderName}
            </Link>
          ) : (
            <span className="text-md font-medium text-primary">{message.senderName}</span>
          )}
          <span className="figure text-2xs text-muted">{formatChatTime(message.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-md">{message.body}</p>
        {message.bookingCard ? (
          <div className="mt-2">
            <BookingCardPanel card={message.bookingCard} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
