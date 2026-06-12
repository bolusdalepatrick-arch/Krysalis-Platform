import Link from "next/link";
import { Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import { formatDayContext } from "@/lib/format";
import { TIER_NAMES, courseById } from "@/lib/mock";

interface Step {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  done: boolean;
}

const TIER_LIST = [1, 2, 3, 4, 5].map((t) => TIER_NAMES[t]).join(", ");

const ORIENTATION = `
Client work arrives as postings on the marketplace. Every posting carries three figures side by side: the gross the client pays, the worker pool reserved for the people who build the thing, and the firm's margin. Pool plus margin always equals gross, and all three are visible to everyone on the floor — the margin is not hidden from you, by design. When you can see what a job is worth, you can decide what your part of it is worth.

You take work by bidding on it. A bid names the share of the worker pool you propose to take and a few lines on why the work should be yours — what you have built before, what you would do first. Whoever posted the job accepts bids until the pool is spoken for, so most jobs end up shared: one person carries the data model, another the interface, each at the split they named. The split you bid is the amount you are paid when the job completes, so bid what the work is worth and be ready to say why.

Progress here is counted, not granted. XP accrues from four things: lessons you complete in the academy, bids that are accepted, jobs that reach completion, and deals you win. The running total moves you through five tiers — ${TIER_LIST} — and the tier sits beside your name on your profile and the leaderboards. Tiers gate nothing; they are a public record of work done, which is also why nobody can hand you one.

Everything the firm produces lives in the vault: deliverables, kickoff summaries, staging screenshots, the masters behind every brand system. One habit keeps it usable — name files account first, then the thing. *Fernwell letterhead, final* sorts next to everything else Fernwell; *final-letterhead-v3* sorts next to nothing. Adopt the habit on your first upload and you never have to relearn it.

Questions go to your department channel — for you, that is design. You will also notice messages marked with a small cocoon glyph: those are drafts from the Shadow, the firm's draft agent, which reads job-channel activity and writes client progress updates. A person reviews, edits, and approves every draft before it goes anywhere; nothing the Shadow writes posts on its own. Treat its drafts the way the rest of the floor does — keep the facts, fix the emphasis, and approve only what you would have written yourself.
`;

/** First week (PRD 7.13): a field-guide page, not a wizard. Demo state is
 *  Noor Haddad mid-progress — primer started, the other two checks open. */
export default function WelcomePage() {
  const now = new Date();
  const primer = courseById("c-brand-fieldwork");

  const steps: Step[] = [
    {
      title: "Confirm your entry",
      description: "Check that your name and title on your profile read the way they should.",
      href: "/settings",
      linkLabel: "Open settings",
      done: false,
    },
    {
      title: "Read your department primer",
      description: `1 lesson complete · ${primer?.title ?? "—"}`,
      href: "/dashboard/academy/c-brand-fieldwork",
      linkLabel: "Continue the course",
      done: true,
    },
    {
      title: "Check in with your department",
      description: "Post one message in the design channel so the team knows where you are starting.",
      href: "/dashboard/channels/ch-design",
      linkLabel: "Open the design channel",
      done: false,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <>
      <PageHeader
        eyebrow="First week"
        title="Three things before the floor opens."
        meta={formatDayContext(now)}
      />
      <div className="max-w-[720px] px-6 py-6">
        <section className="overflow-hidden rounded-m border border-line bg-surface">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <Eyebrow as="h2">Checklist</Eyebrow>
            <span className="figure text-xs text-muted">
              {doneCount} of {steps.length}
            </span>
          </div>
          <ul>
            {steps.map((step) => (
              <li key={step.title} className="flex items-center gap-3 border-b border-line px-4 py-3">
                {step.done ? (
                  <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ok text-ok"
                  >
                    <Check size={16} strokeWidth={1.5} />
                  </span>
                ) : (
                  <span aria-hidden className="size-6 shrink-0 rounded-full border border-line-strong" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-md font-medium text-primary">{step.title}</span>
                  <span className="block text-sm text-secondary">{step.description}</span>
                </span>
                <Link
                  href={step.href}
                  className="shrink-0 text-sm text-accent underline-offset-2 hover:underline"
                >
                  {step.linkLabel}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              disabled={!allDone}
              className="h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
            >
              Finish setup
            </button>
            <p className="text-xs text-muted">Enables when all three checks pass.</p>
          </div>
        </section>

        <div className="mt-8">
          <Eyebrow as="h2">Orientation</Eyebrow>
          <Markdown className="mt-3 max-w-[680px]">{ORIENTATION}</Markdown>
        </div>
      </div>
    </>
  );
}
