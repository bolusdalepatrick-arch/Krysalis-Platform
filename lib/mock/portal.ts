/** Client-portal content (PRD 7.8): the guide, the info bar, and the
 *  client-language status labels. Editable by moderators from M7. */

export const INFO_BAR_MESSAGES = [
  { id: "info-july", text: "Our office is closed July 3.", href: undefined as string | undefined, isActive: true, order: 1 },
  { id: "info-packets", text: "Quarterly review packets go out June 20.", href: undefined as string | undefined, isActive: true, order: 2 },
  { id: "info-guide", text: "New here? The guide below covers how this portal works.", href: "#guide", isActive: true, order: 3 },
];

/** Job status in client language (PRD 7.8) — no internal vocabulary. */
export const CLIENT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Being scheduled with our team",
  ASSIGNED: "Team assigned, starting soon",
  IN_PROGRESS: "In progress",
  REVIEW: "In review with our team",
  COMPLETED: "Delivered",
};

export const PORTAL_GUIDE_MD = `## What this portal shows

This portal is the standing record of your work with Krysalis. Each engagement
you have commissioned is listed with its current status in plain terms — in
progress, in review with our team, or delivered. When something changes, the
status here changes; there is no version of events we see that you don't.

Files we deliver land in the shared files panel as they're ready. Anything
listed there is yours to download and keep; if a file you expect is missing,
say so in the message thread and someone will fix it the same day.

## How review and delivery work

Before anything is marked delivered, it passes a review inside our team — a
second set of senior eyes on the work, every time. You'll see the engagement
sit at "in review with our team" while that happens; it usually takes a few
working days. Delivered means we consider the work done and ready for your
sign-off, not that the conversation is over.

If something delivered isn't right, reply in the thread. Revisions that fall
inside the agreed scope are handled without ceremony; if a request falls
outside it, we'll say so plainly and propose what it would take.

## Reaching the team

The message thread on this page goes straight to the people doing your work,
not to a help desk. Replies come during working hours, usually within a few
hours and always within one business day.

For anything better discussed live, ask for a review call in the thread and
your contact will offer times. There's no phone tree and no ticket number —
the person who answers is the person accountable for your engagement.

## Billing and records

Invoices arrive by email from our operations team on the schedule set in your
engagement agreement. The figures in this portal show what each engagement is
contracted at, so the invoice should never be a surprise. Questions about
billing go to the same thread as everything else; we'd rather over-answer than
have you wondering.`;
