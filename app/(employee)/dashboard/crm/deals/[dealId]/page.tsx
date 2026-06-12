import Link from "next/link";
import { notFound } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import ActivityLog from "@/components/crm/ActivityLog";
import StageRail from "@/components/crm/StageRail";
import { formatDate, formatMoney } from "@/lib/format";
import { BOOKING_CARDS, JOBS, accountById, dealById, personById } from "@/lib/mock";

/** Deal detail (PRD 7.11): stage rail, activity log, facts, contact card. */
export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = dealById(dealId);
  if (!deal) notFound();

  const account = accountById(deal.accountId);
  const owner = personById(deal.ownerId);
  const card = BOOKING_CARDS.find((c) => c.dealId === deal.id);
  const job = JOBS.find((j) => j.dealId === deal.id);
  const contact =
    account?.contacts.find((c) => c.isPrimary) ?? account?.contacts[0];

  return (
    <div>
      <PageHeader
        eyebrow={
          account ? (
            <Link
              href={`/dashboard/crm/accounts/${account.id}`}
              className="hover:text-accent"
            >
              {account.name}
            </Link>
          ) : (
            "Account"
          )
        }
        title={deal.title}
        meta={
          <>
            Owner ·{" "}
            {owner ? (
              <Link
                href={`/dashboard/people/${owner.id}`}
                className="text-secondary hover:text-accent"
              >
                {owner.name}
              </Link>
            ) : (
              "—"
            )}
          </>
        }
      />

      <div className="border-b border-line px-6 py-4">
        <StageRail stage={deal.stage} />
      </div>

      <div className="flex items-start gap-6 px-6 py-5">
        <div className="min-w-0 flex-1">
          <Eyebrow as="h2">Activity</Eyebrow>
          <div className="mt-2">
            <ActivityLog activities={deal.activities} />
          </div>
        </div>

        <aside className="w-72 shrink-0 space-y-4 rounded-m border border-line bg-surface p-4">
          <div>
            <Eyebrow as="h2">Value</Eyebrow>
            {deal.value != null ? (
              <p className="figure mt-1 text-sm text-primary">
                {formatMoney(deal.value)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">—</p>
            )}
          </div>
          <div>
            <Eyebrow as="h2">Source</Eyebrow>
            <p className="figure mt-1 text-sm uppercase text-secondary">
              {deal.source}
            </p>
          </div>
          <div>
            <Eyebrow as="h2">Expected close</Eyebrow>
            <p className="figure mt-1 text-sm text-secondary">
              {deal.expectedCloseAt ? formatDate(deal.expectedCloseAt) : "—"}
            </p>
          </div>
          {deal.wonAt ? (
            <div>
              <Eyebrow as="h2">Won</Eyebrow>
              <p className="figure mt-1 text-sm text-ok">{formatDate(deal.wonAt)}</p>
            </div>
          ) : null}
          {deal.lostAt ? (
            <div>
              <Eyebrow as="h2">Lost</Eyebrow>
              <p className="figure mt-1 text-sm text-danger">
                {formatDate(deal.lostAt)}
              </p>
            </div>
          ) : null}
          {deal.lostReason ? (
            <div>
              <Eyebrow as="h2">Lost reason</Eyebrow>
              <p className="mt-1 text-sm text-secondary">{deal.lostReason}</p>
            </div>
          ) : null}
          {card ? (
            <div>
              <Eyebrow as="h2">Booking</Eyebrow>
              <Link
                href="/dashboard/crm/bounties"
                className="figure mt-1 inline-block text-xs text-accent hover:text-accent-hover"
              >
                Booking {card.externalRef}
              </Link>
            </div>
          ) : null}
          {job ? (
            <div>
              <Eyebrow as="h2">Engagement</Eyebrow>
              <Link
                href={`/dashboard/marketplace/${job.id}`}
                className="mt-1 inline-block text-sm text-accent hover:text-accent-hover"
              >
                {job.title}
              </Link>
            </div>
          ) : null}
          {contact ? (
            <div className="border-t border-line pt-3">
              <Eyebrow as="h2">Contact</Eyebrow>
              <p className="mt-1 text-sm font-medium text-primary">{contact.name}</p>
              {contact.title ? (
                <p className="text-xs text-secondary">{contact.title}</p>
              ) : null}
              <p className="figure mt-0.5 text-xs text-muted">{contact.email}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
