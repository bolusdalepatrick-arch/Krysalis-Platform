import Link from "next/link";
import { redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import ArchiveCardButton from "@/components/crm/ArchiveCardButton";
import BookingCardPanel from "@/components/crm/BookingCardPanel";
import ResendWebhookButton from "@/components/crm/ResendWebhookButton";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { bountiesData, type CardView } from "@/lib/queries/crm";

/** "Jun 16, 17:00–17:30" — slot in mono (PRD 7.12). */
function slotLabel(card: CardView): string {
  const start = new Date(card.slotStart);
  const end = new Date(card.slotEnd);
  const day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const t = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}, ${t(start)}–${t(end)}`;
}

/** Bounty board (PRD 7.12): unclaimed cards first, then recent claims.
 *  Admins archive expired unclaimed cards (the one ARCHIVED path) and
 *  resend failed claim notifications from here. */
export default async function BountiesPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const isAdmin = viewer.role === "ADMIN";

  const { unclaimed, claimed, failures } = await bountiesData();

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
              <div key={c.id} className="flex items-start gap-3">
                <BookingCardPanel card={c} />
                {isAdmin && c.expired ? (
                  <div className="pt-4">
                    <ArchiveCardButton cardId={c.id} />
                    <p className="mt-1 max-w-44 text-xs text-muted">
                      The slot has passed unclaimed.
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && failures.length > 0 ? (
        <section className="border-b border-line px-6 py-5">
          <Eyebrow as="h2">Outbound failures</Eyebrow>
          <p className="mt-2 text-sm text-secondary">
            These claims didn&apos;t reach n8n, so the meeting host hasn&apos;t been
            swapped. The claims themselves stand.
          </p>
          <div className="mt-3 space-y-3">
            {failures.map((c) => (
              <div
                key={c.id}
                className="flex max-w-2xl items-center justify-between gap-4 rounded-m border border-line bg-surface p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">{c.company}</p>
                  <p className="mt-0.5 text-xs text-danger">{c.lastWebhookError}</p>
                </div>
                <ResendWebhookButton cardId={c.id} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
              {claimed.map((c) => (
                <tr key={c.id} className="h-9 border-b border-line">
                  <td className="pr-4 font-medium text-primary">{c.company}</td>
                  <td className="pr-4 text-secondary">{c.name}</td>
                  <td className="pr-4">
                    <span className="figure text-xs text-secondary">{slotLabel(c)}</span>
                  </td>
                  <td className="pr-4">
                    {c.claimedById ? (
                      <Link
                        href={`/dashboard/people/${c.claimedById}`}
                        className="text-secondary hover:text-accent"
                      >
                        {c.claimedByName}
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
                    {c.dealId ? (
                      <Link
                        href={`/dashboard/crm/deals/${c.dealId}`}
                        className="text-secondary hover:text-accent"
                      >
                        {c.dealTitle}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
