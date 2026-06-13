import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import AvatarBadge from "@/components/AvatarBadge";
import ChrysalisGlyph from "@/components/ChrysalisGlyph";
import TierBadge from "@/components/TierBadge";
import BookingCardPanel from "@/components/crm/BookingCardPanel";
import { getSessionUser } from "@/lib/auth";
import { formatChatTime, formatDate, formatDayContext, formatMoney } from "@/lib/format";
import { cookies } from "next/headers";
import { openWork } from "@/lib/queries/marketplace";
import { pendingDrafts, recentActivity } from "@/lib/queries/channels";
import { pipelineCounts, unclaimedBounties } from "@/lib/queries/crm";
import { WELCOME_LANDED_COOKIE } from "@/lib/onboarding";
import type { DealStage } from "@prisma/client";

const STAGES: { stage: DealStage; label: string }[] = [
  { stage: "INBOUND", label: "Inbound" },
  { stage: "DISCOVERY", label: "Discovery" },
  { stage: "PROPOSAL", label: "Proposal" },
  { stage: "VERBAL", label: "Verbal" },
  { stage: "WON", label: "Won" },
  { stage: "LOST", label: "Lost" },
];

function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** The Today view (PRD section 6): one composed page of dense blocks, each
 *  linking into its deep route, scoped to the viewer — open work in their
 *  department, their pipeline, drafts they can approve. Every block reads
 *  the database (the pipeline and bounty blocks landed on data in M5). */
export default async function TodayPage() {
  const now = new Date();
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  // Once-per-session landing for a new hire (PRD 7.13): the first dashboard
  // visit of a session lands on /dashboard/welcome; the session cookie stops
  // the repeat, and every other route stays reachable.
  if (viewer.onboardingCompletedAt === null) {
    const landed = (await cookies()).get(WELCOME_LANDED_COOKIE)?.value === "1";
    if (!landed) redirect("/dashboard/welcome");
  }

  const isAdmin = viewer.role === "ADMIN";
  const [openJobs, drafts, recent, stageCounts, bounties] = await Promise.all([
    openWork(viewer.departmentId),
    pendingDrafts(viewer),
    recentActivity(viewer, 8),
    pipelineCounts(viewer),
    unclaimedBounties(now),
  ]);

  return (
    <>
      <PageHeader eyebrow="Krysalis OS" title="Today" meta={formatDayContext(now)} />
      <div className="grid grid-cols-2 gap-4 p-6">
        <section className="overflow-hidden rounded-m border border-line bg-surface">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <Eyebrow as="h2">Open work</Eyebrow>
            <span className="figure text-xs text-muted">{openJobs.length}</span>
          </div>
          {openJobs.length === 0 ? (
            <p className="border-b border-line px-4 py-3 text-sm text-secondary">
              No open postings in your department. New client work appears here
              as contracts are signed.
            </p>
          ) : null}
          <ul>
            {openJobs.map((job) => (
              <li key={job.id} className="border-b border-line">
                <Link
                  href={`/dashboard/marketplace/${job.id}`}
                  className="block px-4 py-2.5 hover:bg-raised"
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="truncate text-sm font-medium text-primary">{job.title}</span>
                    <span className="figure shrink-0 text-sm text-primary">
                      {formatMoney(job.grossValue)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-baseline justify-between gap-4 text-xs text-muted">
                    <span className="truncate">
                      {job.accountName} · {job.departmentName}
                    </span>
                    <span className="figure shrink-0">
                      {job.dueAt ? `due ${formatDate(job.dueAt)}` : "—"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2.5">
            <Link
              href="/dashboard/marketplace"
              className="text-sm text-accent underline-offset-2 hover:underline"
            >
              Marketplace
            </Link>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-m border border-line bg-surface">
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <Eyebrow as="h2">Pending drafts</Eyebrow>
              <span className="figure text-xs text-muted">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <p className="px-4 py-3 text-sm text-secondary">
                No drafts waiting. Shadow progress drafts land here for approval before they post.
              </p>
            ) : (
              <ul>
                {drafts.map((draft) => (
                  <li key={draft.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/dashboard/channels/${draft.channelId}`}
                      className="block px-4 py-2.5 hover:bg-raised"
                    >
                      <span className="flex items-center gap-2 text-secondary">
                        <ChrysalisGlyph />
                        <span className="figure text-xs text-muted">{draft.channelName}</span>
                      </span>
                      <span className="mt-1 block text-sm text-secondary">
                        {excerpt(draft.body, 90)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-m border border-line bg-surface">
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <Eyebrow as="h2">Pipeline</Eyebrow>
              <span className="figure text-xs text-muted">
                {isAdmin ? "all owners" : "your deals"}
              </span>
            </div>
            <Link href="/dashboard/crm" className="grid grid-cols-6 divide-x divide-line hover:bg-raised">
              {STAGES.map(({ stage, label }) => (
                <span key={stage} className="px-3 py-3">
                  <Eyebrow as="span" className="block truncate">
                    {label}
                  </Eyebrow>
                  <span className="figure mt-1 block text-lg text-primary">
                    {stageCounts[stage]}
                  </span>
                </span>
              ))}
            </Link>
          </section>
        </div>

        <section className="overflow-hidden rounded-m border border-line bg-surface">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <Eyebrow as="h2">Unclaimed bounties</Eyebrow>
            <span className="figure text-xs text-muted">{bounties.count}</span>
          </div>
          {bounties.newest ? (
            <div className="border-b border-line p-4">
              <BookingCardPanel card={bounties.newest} />
            </div>
          ) : (
            <p className="border-b border-line px-4 py-3 text-sm text-secondary">
              No unclaimed cards. Discovery calls booked on the website land here until someone claims them.
            </p>
          )}
          <div className="px-4 py-2.5">
            <Link
              href="/dashboard/crm/bounties"
              className="text-sm text-accent underline-offset-2 hover:underline"
            >
              Bounty board
            </Link>
          </div>
        </section>

        <section className="col-span-2 overflow-hidden rounded-m border border-line bg-surface">
          <div className="border-b border-line px-4 py-3">
            <Eyebrow as="h2">Recent activity</Eyebrow>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-3 text-sm text-secondary">
              Nothing yet today. Channel and thread activity across the firm
              shows up here as it happens.
            </p>
          ) : null}
          <ul>
            {recent.map((message) => (
              <li key={message.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/dashboard/channels/${message.channelId}`}
                  className="flex h-11 items-center gap-3 px-4 hover:bg-raised"
                >
                  <AvatarBadge id={message.senderId} name={message.senderName} size={20} />
                  <span className="shrink-0 text-sm font-medium text-primary">
                    {message.senderName}
                  </span>
                  {message.senderTier !== null ? <TierBadge level={message.senderTier} /> : null}
                  <span className="figure shrink-0 text-xs text-muted">{message.channelName}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-secondary">
                    {excerpt(message.body, 80)}
                  </span>
                  <span className="figure shrink-0 text-xs text-muted">
                    {formatChatTime(message.createdAt, now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
