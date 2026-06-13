"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissPortalStart } from "@/app/actions/onboarding";
import Eyebrow from "@/components/Eyebrow";

/**
 * The start-here orientation panel (PRD 7.13): greets a business account's
 * portal users until dismissed. The one-time Dismiss stamps the user row;
 * the panel does not return after.
 */
export default function StartHerePanel({
  accountName,
  contactName,
}: {
  accountName: string;
  contactName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function dismiss() {
    setError(false);
    startTransition(async () => {
      const result = await dismissPortalStart();
      if (!result.ok) setError(true);
      router.refresh();
    });
  }

  return (
    <section className="rounded-l border border-line bg-surface p-6">
      <Eyebrow as="h2">Start here</Eyebrow>
      <h3 className="mt-2 text-base font-bold tracking-[-0.01em] text-primary">
        For {accountName}
      </h3>
      <div className="prose-serif mt-1 text-secondary">
        <p>
          This portal is the standing record of your work with Krysalis. Each engagement
          you&rsquo;ve commissioned is listed below with its status in plain terms, the figure it
          was contracted at, and the files we deliver as they&rsquo;re ready. When something changes
          here, it has changed in fact.
        </p>
        <p>
          Before anything is marked delivered, it passes a review inside our team — a second set of
          senior eyes on the work, every time. While that happens the engagement reads
          &ldquo;In review with our team&rdquo;; once it reads &ldquo;Delivered&rdquo;, the work is
          ready for your sign-off, not past discussion.
        </p>
        <p>
          The message thread below goes to the people doing your work, not a help desk.{" "}
          {contactName} looks after your account and reads everything posted there; for anything
          better discussed live, ask for a review call in the thread and you&rsquo;ll have times
          within a business day.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        disabled={pending}
        className="mt-2 text-sm text-muted underline underline-offset-2 hover:text-primary disabled:opacity-60"
      >
        {pending ? "Dismissing" : "Dismiss"}
      </button>
      {error ? (
        <p className="mt-1 text-sm text-danger">Couldn&rsquo;t dismiss just now. Retry.</p>
      ) : null}
    </section>
  );
}
