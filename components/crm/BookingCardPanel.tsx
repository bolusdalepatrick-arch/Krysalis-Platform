import { formatDate } from "@/lib/format";

/** What a booking card needs to render, independent of source (database row
 *  or M0 mock). Dates are ISO strings. */
export interface BookingCardView {
  company: string;
  name: string;
  companySize: string;
  automationGoal: string;
  slotStart: string;
  slotEnd: string;
  status: "UNCLAIMED" | "CLAIMED" | "ARCHIVED";
  claimedByName?: string | null;
  claimedAt?: string | null;
  submittedAt: string;
}

function slotLabel(card: BookingCardView): string {
  const start = new Date(card.slotStart);
  const end = new Date(card.slotEnd);
  const day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const t = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}, ${t(start)}–${t(end)}`;
}

/**
 * A booking card (PRD 7.12): 2px accent left rule, NEW BUSINESS eyebrow,
 * company at 1rem/700, two-line goal, slot in mono, one Claim button.
 * Renders inline in #new-business and on the bounties page. No chrysalis
 * glyph here — that mark is the Shadow's.
 */
export default function BookingCardPanel({ card }: { card: BookingCardView }) {
  return (
    <div className="max-w-xl rounded-m border border-line border-l-2 border-l-accent bg-surface p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">New business</p>
        <p className="figure text-xs text-muted">{slotLabel(card)}</p>
      </div>
      <p className="mt-1.5 text-base font-bold text-primary">{card.company}</p>
      <p className="mt-1 line-clamp-2 text-sm text-secondary">{card.automationGoal}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="figure text-xs text-muted">
          {card.name} · {card.companySize} people · {formatDate(card.submittedAt)}
        </p>
        {card.status === "UNCLAIMED" ? (
          <button
            type="button"
            disabled
            className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
          >
            Claim
          </button>
        ) : (
          <p className="figure text-xs text-muted">
            Claimed by {card.claimedByName ?? "a colleague"}
            {card.claimedAt ? ` · ${formatDate(card.claimedAt)}` : null}
          </p>
        )}
      </div>
    </div>
  );
}
