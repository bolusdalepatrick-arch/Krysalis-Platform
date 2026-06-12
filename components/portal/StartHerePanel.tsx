import Eyebrow from "@/components/Eyebrow";

/**
 * The start-here orientation panel (PRD 7.13): greets a business account's
 * portal users until dismissed. Dismissing stamps a timestamp on the user row
 * (M2+), so the button renders disabled with its real label.
 */
export default function StartHerePanel({
  accountName,
  contactName,
}: {
  accountName: string;
  contactName: string;
}) {
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
        disabled
        className="mt-2 text-sm text-muted underline underline-offset-2 disabled:opacity-60"
      >
        Dismiss
      </button>
    </section>
  );
}
