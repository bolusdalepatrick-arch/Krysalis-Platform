import Link from "next/link";
import { notFound } from "next/navigation";
import type { AccountStatus } from "@prisma/client";
import { Check } from "lucide-react";
import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import AccountDealsTable from "@/components/crm/AccountDealsTable";
import AccountJobsTable from "@/components/crm/AccountJobsTable";
import { accountDetail } from "@/lib/queries/crm";

const STATUS_TONE: Record<AccountStatus, StatusTone> = {
  PROSPECT: "neutral",
  ACTIVE: "ok",
  DORMANT: "warn",
};

/** Account detail (PRD 7.11): facts, contacts, deals, engagements, portal users. */
export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const account = await accountDetail(accountId);
  if (!account) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title={account.name}
        meta={account.notes ?? undefined}
        actions={
          <>
            <StatusBadge tone="neutral">{account.kind}</StatusBadge>
            <StatusBadge tone={STATUS_TONE[account.status]}>{account.status}</StatusBadge>
          </>
        }
      />

      <section className="flex gap-12 border-b border-line px-6 py-5">
        <div>
          <Eyebrow as="h2">Website</Eyebrow>
          <p className="figure mt-1 text-sm text-primary">{account.website ?? "—"}</p>
        </div>
        <div>
          <Eyebrow as="h2">Kind</Eyebrow>
          <p className="figure mt-1 text-sm uppercase text-secondary">{account.kind}</p>
        </div>
        <div>
          <Eyebrow as="h2">Status</Eyebrow>
          <p className="figure mt-1 text-sm uppercase text-secondary">{account.status}</p>
        </div>
      </section>

      <section className="border-b border-line px-6 py-5">
        <Eyebrow as="h2">Contacts</Eyebrow>
        {account.contacts.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">
            No contacts on file. Claimed bookings and manual deals add them.
          </p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="eyebrow py-2 pr-4 text-left font-normal">Name</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Title</th>
                <th className="eyebrow py-2 pr-4 text-left font-normal">Email</th>
                <th className="eyebrow py-2 text-left font-normal">Primary</th>
              </tr>
            </thead>
            <tbody>
              {account.contacts.map((c) => (
                <tr key={c.id} className="h-9 border-b border-line">
                  <td className="pr-4 font-medium text-primary">{c.name}</td>
                  <td className="pr-4 text-secondary">{c.title ?? "—"}</td>
                  <td className="pr-4">
                    <span className="figure text-secondary">{c.email}</span>
                  </td>
                  <td>
                    {c.isPrimary ? (
                      <Check size={16} strokeWidth={1.5} aria-label="Primary contact" />
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

      <section className="border-b border-line px-6 py-5">
        <Eyebrow as="h2">Deals</Eyebrow>
        {account.deals.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">
            No deals for this account. Claimed bookings and manual deals open here.
          </p>
        ) : (
          <AccountDealsTable deals={account.deals} />
        )}
      </section>

      {account.jobs.length > 0 ? (
        <section className="border-b border-line px-6 py-5">
          <Eyebrow as="h2">Engagements</Eyebrow>
          <AccountJobsTable jobs={account.jobs} />
        </section>
      ) : null}

      {account.status === "ACTIVE" ? (
        <section className="px-6 py-5">
          <Eyebrow as="h2">Portal access</Eyebrow>
          {account.portalUsers.length === 0 ? (
            <p className="mt-2 text-sm text-secondary">
              No portal users attached. Converting a won deal provisions one from
              the primary contact.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-line">
              {account.portalUsers.map((p) => (
                <div key={p.id} className="flex h-11 items-center gap-3">
                  <AvatarBadge id={p.id} name={p.name} size={24} />
                  <Link
                    href={`/dashboard/people/${p.id}`}
                    className="font-medium text-primary hover:text-accent"
                  >
                    {p.name}
                  </Link>
                  <span className="figure text-xs text-muted">{p.email}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
