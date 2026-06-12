import type { MockChannel, MockForumPost, MockMessage } from "./types";

export const CHANNELS: MockChannel[] = [
  { id: "ch-engineering", kind: "DEPARTMENT", name: "engineering", departmentId: "engineering" },
  { id: "ch-design", kind: "DEPARTMENT", name: "design", departmentId: "design" },
  { id: "ch-marketing", kind: "DEPARTMENT", name: "marketing", departmentId: "marketing" },
  { id: "ch-operations", kind: "DEPARTMENT", name: "operations", departmentId: "operations" },
  { id: "ch-new-business", kind: "FIRM", name: "new-business" },
  { id: "ch-job-tidegate", kind: "JOB", name: "job-tidegate-claims-intake", jobId: "j-tidegate-claims-intake" },
  { id: "ch-job-fernwell-brand", kind: "JOB", name: "job-fernwell-brand-refresh", jobId: "j-fernwell-brand-refresh" },
  { id: "ch-job-vargas", kind: "JOB", name: "job-vargas-site", jobId: "j-vargas-site" },
  { id: "ch-acct-northbeam", kind: "ACCOUNT", name: "Northbeam Logistics", accountId: "a-northbeam" },
  { id: "ch-acct-cassia", kind: "ACCOUNT", name: "Cassia Health", accountId: "a-cassia" },
  { id: "ch-acct-fernwell", kind: "ACCOUNT", name: "Fernwell & Co.", accountId: "a-fernwell" },
  { id: "ch-acct-ratio", kind: "ACCOUNT", name: "Ratio Coffee Roasters", accountId: "a-ratio" },
  { id: "ch-acct-tidegate", kind: "ACCOUNT", name: "Tidegate Insurance", accountId: "a-tidegate" },
  { id: "ch-acct-vargas", kind: "ACCOUNT", name: "Mateo Vargas", accountId: "a-vargas" },
];

let n = 0;
function msg(
  channelId: string,
  senderId: string,
  at: string,
  body: string,
  extra?: Partial<MockMessage>,
): MockMessage {
  n += 1;
  return { id: `m-${n}`, channelId, senderId, body, at, ...extra };
}

export const MESSAGES: MockMessage[] = [
  // engineering — light, recent
  msg("ch-engineering", "u-daniel", "2026-06-11T09:05:00", "Review queue is empty for the first time since April. If you have a posting you've been sitting on, today's the day to bid."),
  msg("ch-engineering", "u-owen", "2026-06-11T09:22:00", "Northbeam phase two is up on the board. Pool looks right this time."),
  msg("ch-engineering", "u-priya", "2026-06-11T09:31:00", "I posted a bid. If we split it like phase one we can keep the same review cadence with Irene."),
  msg("ch-engineering", "u-fatima", "2026-06-12T08:47:00", "Reminder: the Cassia fax pilot review is Tuesday. Bring real misclassification numbers, not vibes."),

  // design
  msg("ch-design", "u-aiko", "2026-06-10T10:12:00", "Fernwell collateral went to review yesterday. Margaret's first pass comes back Friday."),
  msg("ch-design", "u-june", "2026-06-10T10:25:00", "Vargas wireframes are with Mateo. He picked direction B inside an hour — shortest approval of my year."),
  msg("ch-design", "u-theo", "2026-06-11T14:03:00", "Cassia intake posting is worth a look. The paper packet is eleven pages; the flow should be one."),
  msg("ch-design", "u-noor", "2026-06-12T09:02:00", "Working through the brand systems primer this week. The third lesson's checklist is already useful."),

  // marketing
  msg("ch-marketing", "u-hana", "2026-06-09T11:18:00", "Ratio email flows are in review. Dunning numbers from the test window: 38 recovered subscriptions."),
  msg("ch-marketing", "u-camille", "2026-06-09T11:30:00", "The win-back subject lines that worked are the plain ones. Filing that away for the spring kit."),
  msg("ch-marketing", "u-dmitri", "2026-06-11T15:44:00", "Site audit for the gate refresh is in the vault under Gate content audit, June. Three pages carry most of the traffic."),

  // operations
  msg("ch-operations", "u-lena", "2026-06-10T09:40:00", "Tidegate kickoff went clean. Shadow period starts after the parser handles both carrier formats."),
  msg("ch-operations", "u-martina", "2026-06-10T09:52:00", "Northbeam driver packet: source docs are in. Drafting the checklist version this week."),
  msg("ch-operations", "u-elias", "2026-06-12T08:30:00", "Quarterly review packets go out June 20. Account owners, get your engagement summaries to me by Wednesday."),

  // #new-business — the bounty board (PRD 7.12)
  msg("ch-new-business", "u-gate", "2026-06-05T11:27:00", "Discovery call booked from the website.", { bookingCardId: "bk-bellhaven" }),
  msg("ch-new-business", "u-sara", "2026-06-05T12:03:00", "Claimed — deal opened under Bellhaven Property Group."),
  msg("ch-new-business", "u-gate", "2026-06-09T08:02:00", "Discovery call booked from the website.", { bookingCardId: "bk-westerly" }),
  msg("ch-new-business", "u-marcus", "2026-06-09T08:41:00", "Claimed — the discovery call is mine. Deal opened under Westerly Charter Co."),
  msg("ch-new-business", "u-gate", "2026-06-12T09:14:00", "Discovery call booked from the website.", { bookingCardId: "bk-halcyon" }),
  msg("ch-new-business", "u-lena", "2026-06-12T09:26:00", "Tacoma dental group, front-desk pain. The Cassia reminder work is the obvious case study."),
  msg("ch-new-business", "u-hana", "2026-06-12T09:33:00", "I can take the Thursday slot if nobody with clinic experience claims it by lunch."),

  // Tidegate job channel — the full thread (PRD section 10 register)
  msg("ch-job-tidegate", "u-priya", "2026-06-02T09:10:00", "Kickoff notes are in the vault as Tidegate intake, kickoff summary. Short version: two carrier formats cover 84 percent of volume; we parse those and queue the rest."),
  msg("ch-job-tidegate", "u-marcus", "2026-06-02T09:24:00", "Starting the exception queue this week. Plan is a single review list with claim preview and a one-click accept into the record."),
  msg("ch-job-tidegate", "u-priya", "2026-06-03T11:02:00", "First carrier format parses clean on 312 of 320 sample notices. The eight failures are scanned PDFs, which go to the queue by design."),
  msg("ch-job-tidegate", "u-marcus", "2026-06-04T15:48:00", "Question on sync: do we write to their staging table or straight to the claim record? Their API docs say staging, Sam said records."),
  msg("ch-job-tidegate", "u-priya", "2026-06-04T16:05:00", "Staging. If we write records directly during the shadow period we can't diff against the hand-keyed ones, which is the whole point of the shadow period."),
  msg("ch-job-tidegate", "u-marcus", "2026-06-04T16:11:00", "Disagree — staging doubles the mapping work and Sam's team reads records, not staging rows."),
  msg("ch-job-tidegate", "u-priya", "2026-06-04T16:30:00", "Called Sam to settle it. Staging during shadow, records after acceptance. He'll give the team a staging view so they can read along."),
  msg("ch-job-tidegate", "u-marcus", "2026-06-04T16:33:00", "Settled then. I'll build the mapper against staging and keep the record writer behind a flag."),
  msg("ch-job-tidegate", "u-priya", "2026-06-09T10:20:00", "Second carrier format is harder — their field names changed in March and the sample set mixes both versions. Normalizing first."),
  msg("ch-job-tidegate", "u-marcus", "2026-06-10T14:12:00", "Exception queue interface is up on staging. Screenshots in the vault under Exception queue, first cut."),
  msg("ch-job-tidegate", "u-lena", "2026-06-11T09:15:00", "Ruth asked for a written progress note for her steering meeting Monday. Keep it to a paragraph; I'll pass it through."),
  msg(
    "ch-job-tidegate",
    "u-shadow",
    "2026-06-12T08:00:00",
    "Tidegate claims-intake automation is in progress with 90 percent of the worker pool assigned and 35 days to the due date. The first carrier format parses 312 of 320 sample notices; scanned PDFs route to the exception queue by design. The exception queue interface reached staging this week, with screenshots filed in the vault as Exception queue, first cut. Current focus is normalizing the second carrier format, whose field names changed in March. Delivery is tracking toward the July 17 review.",
    { isShadowDraft: true },
  ),

  // Fernwell brand job channel — lighter
  msg("ch-job-fernwell-brand", "u-june", "2026-06-09T10:30:00", "Full collateral set is in the vault: letterhead, proposal template, report covers. Submitting for review."),
  msg("ch-job-fernwell-brand", "u-theo", "2026-06-09T10:41:00", "Word templates survived a round trip through Margaret's machine. Calling that the real acceptance test."),
  msg("ch-job-fernwell-brand", "u-mara", "2026-06-10T09:05:00", "Reviewing Thursday. If Margaret's pass is clean we close this one out before the quarterly packets."),

  // Vargas job channel — lighter
  msg("ch-job-vargas", "u-june", "2026-06-08T09:45:00", "Direction B approved. Building the intake form fields from Mateo's current questionnaire, minus the four questions nobody answers."),
  msg("ch-job-vargas", "u-aiko", "2026-06-08T10:02:00", "Keep the form under ten fields. His clients are retirees; every extra field costs him a booking."),
  msg("ch-job-vargas", "u-june", "2026-06-11T16:20:00", "Staging link is in the vault. Copy review is the last open item before client review."),

  // Account threads (PRD 7.3, 7.8)
  msg("ch-acct-tidegate", "u-lena", "2026-05-26T10:00:00", "Ruth — your portal is live; the intake engagement kicks off Monday. You'll see the engagement listed below with its current status, and anything we deliver lands in the shared files panel."),
  msg("ch-acct-tidegate", "u-ruth", "2026-05-26T11:42:00", "Found it, thank you. I'll have Sam look at the staging view when it's ready."),
  msg("ch-acct-tidegate", "u-lena", "2026-06-11T09:30:00", "Progress note ahead of your Monday steering meeting is coming by Friday."),

  msg("ch-acct-northbeam", "u-curtis", "2026-06-09T14:10:00", "We'd like to schedule a review call."),
  msg("ch-acct-northbeam", "u-lena", "2026-06-09T15:02:00", "Of course. Thursday 10:00 or Friday 14:00 work on our side — pick whichever suits Irene too and I'll send the invite."),
  msg("ch-acct-northbeam", "u-curtis", "2026-06-09T15:30:00", "Thursday 10:00. Irene will join for the dispatch items."),

  msg("ch-acct-vargas", "u-june", "2026-06-08T12:00:00", "Mateo — direction B it is. Next thing you'll see from me is the intake form with your questionnaire folded in."),
  msg("ch-acct-vargas", "u-mateo", "2026-06-08T12:35:00", "Great. One ask: keep the risk-tolerance question, my compliance person insists."),
  msg("ch-acct-vargas", "u-june", "2026-06-08T12:41:00", "It stays. Everything else nonessential goes."),
];

export const FORUM_POSTS: MockForumPost[] = [
  {
    id: "f-handover-question",
    authorId: "u-martina",
    departmentId: "operations",
    title: "What belongs in a handover note?",
    body: "Closing out the driver packet soon and I want the handover to be the kind we wish every job had. What do people actually reread later — decisions, contacts, file locations? The Running a Handover course covers structure, but I want the lived answer.",
    at: "2026-06-10T11:00:00",
    replies: [
      { id: "fr-1", authorId: "u-priya", body: "Decisions with dates. Six months later nobody needs the file list — they need why we chose staging-first.", at: "2026-06-10T12:14:00" },
      { id: "fr-2", authorId: "u-lena", body: "The client's reading habits. Who actually opens what you send. That never makes it into notes and always matters.", at: "2026-06-10T13:02:00" },
    ],
  },
  {
    id: "f-ratio-win",
    authorId: "u-rebecca",
    departmentId: "marketing",
    title: "Dunning flow recovered 38 subscriptions in its first window",
    body: "The Ratio dunning emails have been live for three weeks: 38 recovered subscriptions against 61 failed payments. The plain-text version outperformed the designed one in every segment. Camille called it during drafting; noting it here so we stop re-litigating plain versus designed each kit.",
    at: "2026-06-09T16:20:00",
    replies: [
      { id: "fr-3", authorId: "u-camille", body: "For transactional email, design is a tax. Happy to be the broken record.", at: "2026-06-09T16:48:00" },
    ],
  },
  {
    id: "f-fixture-tool",
    authorId: "u-grace",
    departmentId: "engineering",
    title: "Recommendation: snapshot fixtures for parser tests",
    body: "For the Cassia fax pilot I started checking parser output against committed snapshot fixtures instead of hand-written assertions. Catching regressions has been faster and review diffs are readable. If you're testing anything that transforms documents, try it before writing another forty assertions.",
    at: "2026-06-08T10:35:00",
    replies: [
      { id: "fr-4", authorId: "u-viktor", body: "Adopting this for the carrier formats on Tidegate. The March field rename would have been a one-line diff instead of a debugging morning.", at: "2026-06-08T11:20:00" },
    ],
  },
  {
    id: "f-hiring-note",
    authorId: "u-mara",
    title: "Hiring: one more automation engineer this summer",
    body: "The pipeline says we'll need a fourth automation engineer by August. Referrals first, as always — send people to me directly with a line on what you've seen them build. Same bar as ever: ships carefully, writes things down.",
    at: "2026-06-06T09:10:00",
    replies: [
      { id: "fr-5", authorId: "u-viktor", body: "Sending you someone from my last team. She rebuilt their billing jobs solo and documented every decision.", at: "2026-06-06T10:25:00" },
    ],
  },
  {
    id: "f-vault-naming",
    authorId: "u-aiko",
    departmentId: "design",
    title: "Vault naming: put the account first",
    body: "Half the vault sorts by account and half by project word. Proposal: account first, then the thing — Fernwell letterhead, final. Cheap to adopt, makes the table scannable, and the graph view will thank us later.",
    at: "2026-06-04T14:50:00",
    replies: [
      { id: "fr-6", authorId: "u-june", body: "Adopted for everything I touch from today.", at: "2026-06-04T15:12:00" },
      { id: "fr-7", authorId: "u-tomas", body: "Renaming the ops templates this week to match.", at: "2026-06-05T09:30:00" },
    ],
  },
  {
    id: "f-shadow-drafts",
    authorId: "u-daniel",
    departmentId: "engineering",
    title: "Use the Shadow drafts, edit them hard",
    body: "The progress drafts are good scaffolding and bad final copy. The Tidegate one this morning had every fact right and the emphasis wrong — it led with pool allocation when Ruth cares about the shadow period. Approve nothing you wouldn't have written.",
    at: "2026-06-12T09:40:00",
    replies: [],
  },
];
