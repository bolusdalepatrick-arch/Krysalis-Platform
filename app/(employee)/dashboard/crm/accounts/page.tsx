import Link from "next/link";
import type { AccountStatus } from "@prisma/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { accountRows } from "@/lib/queries/crm";

const STATUS_TONE: Record<AccountStatus, StatusTone> = {
  PROSPECT: "neutral",
  ACTIVE: "ok",
  DORMANT: "warn",
};

/** Accounts (PRD 7.11): every company the firm touches, with derived counts. */
export default async function AccountsPage() {
  const accounts = await accountRows();
  return (
    <div>
      <PageHeader eyebrow="CRM" title="Accounts" />
      <div className="px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <th className="eyebrow py-2 pr-4 text-left font-normal">Account</th>
              <th className="eyebrow py-2 pr-4 text-left font-normal">Kind</th>
              <th className="eyebrow py-2 pr-4 text-left font-normal">Status</th>
              <th className="eyebrow py-2 pr-4 text-left font-normal">Website</th>
              <th className="eyebrow py-2 pr-4 text-right font-normal">Deals</th>
              <th className="eyebrow py-2 pr-4 text-right font-normal">Jobs</th>
              <th className="eyebrow py-2 text-right font-normal">Contacts</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="h-9 border-b border-line">
                <td className="pr-4">
                  <Link
                    href={`/dashboard/crm/accounts/${a.id}`}
                    className="font-medium text-primary hover:text-accent"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="pr-4">
                  <span className="figure text-2xs uppercase text-secondary">{a.kind}</span>
                </td>
                <td className="pr-4">
                  <StatusBadge tone={STATUS_TONE[a.status]}>{a.status}</StatusBadge>
                </td>
                <td className="pr-4">
                  {a.website ? (
                    <span className="figure text-secondary">{a.website}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="pr-4 text-right">
                  <span className="figure">{a.dealCount}</span>
                </td>
                <td className="pr-4 text-right">
                  <span className="figure">{a.jobCount}</span>
                </td>
                <td className="text-right">
                  <span className="figure">{a.contactCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
