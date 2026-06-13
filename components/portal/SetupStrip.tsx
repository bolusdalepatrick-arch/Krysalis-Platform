"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import {
  confirmPortalDetails,
  dismissPortalStart,
  markBriefReviewed,
} from "@/app/actions/onboarding";
import Eyebrow from "@/components/Eyebrow";
import { formatDate } from "@/lib/format";

export interface SetupState {
  name: string;
  detailsConfirmedAt: string | null;
  portalStartDismissedAt: string | null;
  briefReviewedAt: string | null;
  /** The engagement to review for step 3; null auto-satisfies it (PRD 7.13). */
  mostRecentJobId: string | null;
}

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <Check size={16} strokeWidth={1.5} className="shrink-0 text-ok" aria-hidden />
  ) : (
    <Circle size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
  );
}

/**
 * The individual setup strip (PRD 7.13): three steps, each a verifiable stamp
 * on the user row, completable in any order. Step 3 reviews the account's most
 * recent engagement; with no engagement yet it auto-satisfies (ruling, pre-M7).
 * Once all three hold, the strip collapses to one muted line.
 */
export default function SetupStrip({ state }: { state: SetupState }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(state.name);

  const step1Done = state.detailsConfirmedAt !== null;
  const step2Done = state.portalStartDismissedAt !== null;
  const step3Done = state.briefReviewedAt !== null || state.mostRecentJobId === null;
  const allDone = step1Done && step2Done && step3Done;

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "That didn't complete. Retry.");
      router.refresh();
    });
  }

  if (allDone) {
    const stamps = [state.detailsConfirmedAt, state.portalStartDismissedAt, state.briefReviewedAt]
      .filter((s): s is string => s !== null)
      .sort();
    const finishedAt = stamps[stamps.length - 1];
    return (
      <p className="figure text-sm text-muted">
        Set up · completed{finishedAt ? ` ${formatDate(finishedAt)}` : ""}
      </p>
    );
  }

  const btn =
    "ml-auto h-8 shrink-0 rounded-s border border-line-strong px-3 text-sm font-medium text-primary hover:bg-raised disabled:opacity-60";

  return (
    <section className="rounded-m border border-line bg-surface px-6 py-4">
      <Eyebrow as="h2">Setup</Eyebrow>
      <ul className="mt-1 divide-y divide-line">
        <li className="flex items-center gap-3 py-3.5">
          <StepIcon done={step1Done} />
          {step1Done ? (
            <>
              <span className="font-medium text-primary">Confirm your details</span>
              <span className="figure ml-auto shrink-0 text-sm text-muted">
                Confirmed {state.detailsConfirmedAt ? formatDate(state.detailsConfirmedAt) : ""}
              </span>
            </>
          ) : (
            <>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Your name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 w-full max-w-xs rounded-s border border-line bg-inset px-3 text-base text-primary"
                />
              </label>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => confirmPortalDetails({ name }))}
                className={btn}
              >
                Confirm
              </button>
            </>
          )}
        </li>

        <li className="flex items-center gap-3 py-3.5">
          <StepIcon done={step2Done} />
          <div className="min-w-0">
            <p className="font-medium text-primary">How this works</p>
            {!step2Done ? (
              <p className="text-sm text-secondary">
                What this portal shows, how review and delivery work, and how to reach the team.
              </p>
            ) : null}
          </div>
          {step2Done ? (
            <span className="figure ml-auto shrink-0 text-sm text-muted">Read</span>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => dismissPortalStart())}
              className={btn}
            >
              Got it
            </button>
          )}
        </li>

        <li className="flex items-center gap-3 py-3.5">
          <StepIcon done={step3Done} />
          <div className="min-w-0">
            <p className="font-medium text-primary">Review your engagement brief</p>
            {state.briefReviewedAt === null && state.mostRecentJobId !== null ? (
              <p className="text-sm text-secondary">
                The brief sets out the work as scoped, so we build from the same page.{" "}
                <a href="#engagement" className="text-accent underline-offset-2 hover:underline">
                  Read the brief
                </a>
                .
              </p>
            ) : state.mostRecentJobId === null ? (
              <p className="text-sm text-secondary">
                No engagement yet — nothing to review. You&rsquo;re all set.
              </p>
            ) : null}
          </div>
          {state.briefReviewedAt !== null ? (
            <span className="figure ml-auto shrink-0 text-sm text-muted">
              Reviewed {formatDate(state.briefReviewedAt)}
            </span>
          ) : state.mostRecentJobId !== null ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markBriefReviewed())}
              className={btn}
            >
              Mark as reviewed
            </button>
          ) : null}
        </li>
      </ul>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
