import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Eyebrow from "@/components/Eyebrow";
import PageHeader from "@/components/PageHeader";
import ActivityLog from "@/components/crm/ActivityLog";
import ConvertPanel from "@/components/crm/ConvertPanel";
import DealFactsEditor from "@/components/crm/DealFactsEditor";
import StageControls from "@/components/crm/StageControls";
import StageRail from "@/components/crm/StageRail";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { dealDetail } from "@/lib/queries/crm";

/** Deal detail (PRD 7.11): stage rail, activity log, facts, contact card,
 *  stage controls for the owner, and the admin conversion panel on WON. */
export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const { dealId } = await params;
  const deal = await dealDetail(dealId);
  if (!deal) notFound();

  const isAdmin = viewer.role === "ADMIN";
  const canEdit = deal.ownerId === viewer.id || isAdmin;
  const open = deal.stage !== "WON" && deal.stage !== "LOST";

  const [employees, departments] = await Promise.all([
    isAdmin && open
      ? prisma.user.findMany({
          where: { role: { in: ["EMPLOYEE", "MODERATOR", "ADMIN"] }, isSystem: false },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isAdmin && deal.stage === "WON"
      ? prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href={`/dashboard/crm/accounts/${deal.accountId}`} className="hover:text-accent">
            {deal.accountName}
          </Link>
        }
        title={deal.title}
        meta={
          <>
            Owner ·{" "}
            <Link
              href={`/dashboard/people/${deal.ownerId}`}
              className="text-secondary hover:text-accent"
            >
              {deal.ownerName}
            </Link>
          </>
        }
      />

      <div className="space-y-4 border-b border-line px-6 py-4">
        <StageRail stage={deal.stage} />
        {canEdit && open ? (
          <StageControls dealId={deal.id} stage={deal.stage} hasValue={deal.value !== null} />
        ) : null}
        {isAdmin && deal.stage === "WON" ? (
          <ConvertPanel
            dealId={deal.id}
            dealTitle={deal.title}
            value={deal.value ?? "0"}
            accountName={deal.accountName}
            accountKind={deal.accountKind}
            accountHasThread={deal.accountHasThread}
            accountHasPortalUser={deal.accountHasPortalUser}
            contact={deal.contact ? { name: deal.contact.name, email: deal.contact.email } : null}
            jobId={deal.job?.id ?? null}
            departments={departments}
          />
        ) : null}
      </div>

      <div className="flex items-start gap-6 px-6 py-5">
        <div className="min-w-0 flex-1">
          <Eyebrow as="h2">Activity</Eyebrow>
          <div className="mt-2">
            <ActivityLog dealId={deal.id} activities={deal.activities} />
          </div>
        </div>

        <aside className="w-72 shrink-0 space-y-4 rounded-m border border-line bg-surface p-4">
          <div>
            <Eyebrow as="h2">Value</Eyebrow>
            {deal.value !== null ? (
              <p className="figure mt-1 text-sm text-primary">{formatMoney(deal.value)}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">—</p>
            )}
          </div>
          <div>
            <Eyebrow as="h2">Source</Eyebrow>
            <p className="figure mt-1 text-sm uppercase text-secondary">{deal.source}</p>
          </div>
          <div>
            <Eyebrow as="h2">Expected close</Eyebrow>
            <p className="figure mt-1 text-sm text-secondary">
              {deal.expectedCloseAt ? formatDate(deal.expectedCloseAt) : "—"}
            </p>
          </div>
          {canEdit && open ? (
            <DealFactsEditor
              dealId={deal.id}
              value={deal.value}
              expectedCloseAt={deal.expectedCloseAt}
              ownerId={deal.ownerId}
              employees={employees}
            />
          ) : null}
          {deal.wonAt ? (
            <div>
              <Eyebrow as="h2">Won</Eyebrow>
              <p className="figure mt-1 text-sm text-ok">{formatDate(deal.wonAt)}</p>
            </div>
          ) : null}
          {deal.lostAt ? (
            <div>
              <Eyebrow as="h2">Lost</Eyebrow>
              <p className="figure mt-1 text-sm text-danger">{formatDate(deal.lostAt)}</p>
            </div>
          ) : null}
          {deal.lostReason ? (
            <div>
              <Eyebrow as="h2">Lost reason</Eyebrow>
              <p className="mt-1 text-sm text-secondary">{deal.lostReason}</p>
            </div>
          ) : null}
          {deal.card ? (
            <div>
              <Eyebrow as="h2">Booking</Eyebrow>
              <Link
                href="/dashboard/crm/bounties"
                className="figure mt-1 inline-block text-xs text-accent hover:text-accent-hover"
              >
                Booking {deal.card.externalRef}
              </Link>
            </div>
          ) : null}
          {deal.job ? (
            <div>
              <Eyebrow as="h2">Engagement</Eyebrow>
              <Link
                href={`/dashboard/marketplace/${deal.job.id}`}
                className="mt-1 inline-block text-sm text-accent hover:text-accent-hover"
              >
                {deal.job.title}
              </Link>
            </div>
          ) : null}
          {deal.contact ? (
            <div className="border-t border-line pt-3">
              <Eyebrow as="h2">Contact</Eyebrow>
              <p className="mt-1 text-sm font-medium text-primary">{deal.contact.name}</p>
              {deal.contact.title ? (
                <p className="text-xs text-secondary">{deal.contact.title}</p>
              ) : null}
              <p className="figure mt-0.5 text-xs text-muted">{deal.contact.email}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
