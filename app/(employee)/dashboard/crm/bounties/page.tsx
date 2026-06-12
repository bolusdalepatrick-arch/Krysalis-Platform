import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import BookingCardPanel from "@/components/crm/BookingCardPanel";
import { formatDate } from "@/lib/format";
import { BOOKING_CARDS, dealById, personById } from "@/lib/mock";
import type { MockBookingCard } from "@/lib/mock";

/** "Jun 16, 17:00–17:30" — slot in mono (PRD 7.12). */
function slotLabel(card: MockBookingCard): string {
  const start = new Date(card.slotStart);
  const end = new Date(card.slotEnd);
  const day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const t = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}, ${t(start)}–${t(end)}`;
}

/** Bounty board (PRD 7.12): unclaimed cards first, then recent claims. */
export default function BountiesPage() {
  const unclaimed = BOOKING_CARDS.filter((c) => c.status === "UNCLAIMED").sort(
    (a, b) => b.submittedAt.localeCompare(a.submittedAt),
  );
  const claimed = BOOKING_CARDS.filter((c) => c.status === "CLAIMED").sort((a, b) =>
    (b.claimedAt ?? "").localeCompare(a.claimedAt ?? ""),
  );

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Bounty board"
        meta="Bookings from the website land here; the first claim owns the call."
      />

      <section className="border-b border-line px-6 py-5">
        <div className="flex items-baseline gap-2">
          <Eyebrow as="h2">Unclaimed</Eyebrow>
          <span className="figure text-2xs text-muted">{unclaimed.length}</span>
        </div>
        {unclaimed.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">
            No unclaimed bookings. New cards appear here the moment a visitor
            books a call on the website.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {unclaimed.map((c) => (
              <BookingCardPanel key={c.id} card={c} />
            ))}
          </div>
        )}
      </section>

      <section className="px-6 py-5">
        <Eyebrow as="h2">Claim history</Eyebrow>
        {claimed.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">
            No claims yet. Claimed bookings and the deals they open appear here.
          </p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="eyebrow py-2 pr-4 text-left font-normal">Company</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Visitor</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Slot</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Claimed by</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Claimed at</th>
                <th className="eyebrow py-2 text-left font-normal">Deal</th>
              </tr>
            </thead>
            <tbody>
              {claimed.map((c) => {
                const claimer = c.claimedById ? personById(c.claimedById) : undefined;
                const deal = c.dealId ? dealById(c.dealId) : undefined;
                return (
                  <tr key={c.id} className="h-9 border-b border-line">
                    <td className="pr-4 font-medium text-primary">{c.company}</td>
                    <td className="pr-4 text-secondary">{c.name}</td>
                    <td className="pr-4">
                      <span className="figure text-xs text-secondary">
                        {slotLabel(c)}
                      </span>
                    </td>
                    <td className="pr-4">
                      {claimer ? (
                        <Link
                          href={`/dashboard/people/${claimer.id}`}
                          className="text-secondary hover:text-accent"
                        >
                          {claimer.name}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="pr-4">
                      <span className="figure text-secondary">
                        {c.claimedAt ? formatDate(c.claimedAt) : "—"}
                      </span>
                    </td>
                    <td>
                      {deal ? (
                        <Link
                          href={`/dashboard/crm/deals/${deal.id}`}
                          className="text-secondary hover:text-accent"
                        >
                          {deal.title}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
