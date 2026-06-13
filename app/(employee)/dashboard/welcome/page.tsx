import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import FinishSetupButton from "@/components/onboarding/FinishSetupButton";
import InlineEntry from "@/components/onboarding/InlineEntry";
import WelcomeSeenMarker from "@/components/onboarding/WelcomeSeenMarker";
import { getSessionUser } from "@/lib/auth";
import { formatDate, formatDayContext } from "@/lib/format";
import { firstWeekStatus } from "@/lib/queries/onboarding";
import { TIERS } from "@/lib/xp";

const TIER_LIST = TIERS.map((t) => t.name).join(", ");

function orientation(departmentName: string): string {
  const dept = departmentName.toLowerCase();
  return `
Client work arrives as postings on the marketplace. Every posting carries three figures side by side: the gross the client pays, the worker pool reserved for the people who build the thing, and the firm's margin. Pool plus margin always equals gross, and all three are visible to everyone on the floor — the margin is not hidden from you, by design. When you can see what a job is worth, you can decide what your part of it is worth.

You take work by bidding on it. A bid names the share of the worker pool you propose to take and a few lines on why the work should be yours — what you have built before, what you would do first. Whoever posted the job accepts bids until the pool is spoken for, so most jobs end up shared: one person carries the data model, another the interface, each at the split they named. The split you bid is the amount you are paid when the job completes, so bid what the work is worth and be ready to say why.

Progress here is counted, not granted. XP accrues from four things: lessons you complete in the academy, bids that are accepted, jobs that reach completion, and deals you win. The running total moves you through five tiers — ${TIER_LIST} — and the tier sits beside your name on your profile and the leaderboards. Tiers gate nothing; they are a public record of work done, which is also why nobody can hand you one.

Everything the firm produces lives in the vault: deliverables, kickoff summaries, staging screenshots, the masters behind every brand system. One habit keeps it usable — name files account first, then the thing. *Fernwell letterhead, final* sorts next to everything else Fernwell; *final-letterhead-v3* sorts next to nothing. Adopt the habit on your first upload and you never have to relearn it.

Questions go to your department channel — for you, that is ${dept}. You will also notice messages marked with a small cocoon glyph: those are drafts from the Shadow, the firm's draft agent, which reads job-channel activity and writes client progress updates. A person reviews, edits, and approves every draft before it goes anywhere; nothing the Shadow writes posts on its own. Treat its drafts the way the rest of the floor does — keep the facts, fix the emphasis, and approve only what you would have written yourself.
`;
}

/** First week (PRD 7.13): a field-guide page, not a wizard. The checklist is
 *  derived from real rows; "Finish setup" re-verifies and awards once. */
export default async function WelcomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const status = await firstWeekStatus(user);
  const now = new Date();

  return (
    <>
      <WelcomeSeenMarker />
      <PageHeader
        eyebrow="First week"
        title={
          status.completed ? "You're set up. Welcome to the floor." : "Three things before the floor opens."
        }
        meta={formatDayContext(now)}
      />
      <div className="max-w-[720px] px-6 py-6">
        <section className="overflow-hidden rounded-m border border-line bg-surface">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <Eyebrow as="h2">Checklist</Eyebrow>
            <span className="figure text-xs text-muted">
              {status.doneCount} of {status.total}
            </span>
          </div>

          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <StepMark done={status.steps.entry} />
            <div className="min-w-0 flex-1">
              <span className="block text-md font-medium text-primary">Confirm your entry</span>
              <span className="block text-sm text-secondary">
                Check that your name and title read the way they should.
              </span>
              <InlineEntry name={user.name} title={user.title} done={status.steps.entry} />
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <StepMark done={status.steps.primer} />
            <span className="min-w-0 flex-1">
              <span className="block text-md font-medium text-primary">Read your department primer</span>
              <span className="block text-sm text-secondary">
                {status.primerCourse
                  ? `${status.steps.primer ? "Primer started" : "Enroll and complete a lesson"} · ${status.primerCourse.title}`
                  : "Your department primer will appear here."}
              </span>
            </span>
            {status.primerCourse ? (
              <Link
                href={`/dashboard/academy/${status.primerCourse.id}`}
                className="shrink-0 text-sm text-accent underline-offset-2 hover:underline"
              >
                {status.steps.primer ? "Open the course" : "Start the primer"}
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <StepMark done={status.steps.checkIn} />
            <span className="min-w-0 flex-1">
              <span className="block text-md font-medium text-primary">Check in with your department</span>
              <span className="block text-sm text-secondary">
                Post one message in the {status.departmentName?.toLowerCase() ?? "department"} channel so
                the team knows where you&rsquo;re starting.
              </span>
            </span>
            {status.departmentChannelId ? (
              <Link
                href={`/dashboard/channels/${status.departmentChannelId}`}
                className="shrink-0 text-sm text-accent underline-offset-2 hover:underline"
              >
                Open the channel
              </Link>
            ) : null}
          </div>

          <div className="px-4 py-3">
            {status.completed ? (
              <p className="figure text-sm text-muted">
                Setup complete
                {user.onboardingCompletedAt ? ` · ${formatDate(user.onboardingCompletedAt)}` : ""}
              </p>
            ) : (
              <FinishSetupButton enabled={status.doneCount === status.total} />
            )}
          </div>
        </section>

        <div className="mt-8">
          <Eyebrow as="h2">Orientation</Eyebrow>
          <Markdown className="mt-3 max-w-[680px]">
            {orientation(status.departmentName ?? "your department")}
          </Markdown>
        </div>
      </div>
    </>
  );
}

function StepMark({ done }: { done: boolean }) {
  return done ? (
    <span
      aria-label="Done"
      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-ok text-ok"
    >
      <Check size={16} strokeWidth={1.5} aria-hidden />
    </span>
  ) : (
    <span aria-label="Not done yet" className="mt-0.5 size-6 shrink-0 rounded-full border border-line-strong" />
  );
}
