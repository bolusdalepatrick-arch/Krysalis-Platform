import type { MockCourse } from "./types";

/** 6 courses, 1–2 per department; primers marked (PRD section 10). The two
 *  fully-written courses (Engineering, Design) get complete lesson bodies in
 *  the M1 seed; the mock carries outlines plus one finished lesson each. */
export const COURSES: MockCourse[] = [
  {
    id: "c-typescript",
    title: "TypeScript at Krysalis",
    description: "How we write, review, and ship TypeScript on client work — the primer every engineer reads first.",
    departmentId: "engineering",
    isPrimer: true,
    modules: [
      {
        id: "c-ts-m1",
        title: "The house style",
        lessons: [
          {
            id: "c-ts-l1",
            title: "Why strict mode is not optional",
            durationMin: 12,
            body: `Every Krysalis repository ships with \`strict: true\`, and the setting is not a preference — it is how we price work. A fixed-fee engagement only stays profitable if the surprises happen during development, where they cost minutes, instead of after handover, where they cost a support thread and a client's confidence.

Strict mode moves three classes of surprise forward. Null and undefined stop being runtime discoveries: if a dispatch record can arrive without a driver assignment, the type says so, and the load board renders the gap deliberately instead of crashing on a Tuesday. Implicit \`any\` stops being a silent contract: when a function accepts unlabeled data, the compiler makes you say so out loud, and the reviewer gets to ask why. And structural checks catch the drift between what an integration sent last quarter and what it sends now — the Tidegate carrier-format rename surfaced as a type error in a fixture, not a malformed claim in front of an adjuster.

The cost is honesty up front. You will write more type definitions than you would in a weekend project, and some of them will feel like ceremony. Write them anyway, and keep them next to the data they describe — a \`types.ts\` per domain, not a grab-bag \`models.ts\` for the whole repo. When a type gets painful to maintain, that is information: the shape underneath it is probably wrong, and the fix belongs in the data model, not in a looser annotation.

Two house rules close the loop. First, \`any\` does not pass review — \`unknown\` plus a narrowing function is the escape hatch, because it keeps the doubt visible. Second, \`@ts-expect-error\` requires a comment saying what is expected and when it can come out. Both rules exist for the same reason as strict mode itself: on client work, the person who pays for a hidden assumption is never the person who made it.

Read your current project's \`tsconfig.json\` before the next lesson and note anything that deviates. Deviations are allowed; undocumented ones are not.`,
          },
          { id: "c-ts-l2", title: "Types live next to the data", durationMin: 10 },
          { id: "c-ts-l3", title: "Escape hatches and what they cost", durationMin: 9 },
        ],
      },
      {
        id: "c-ts-m2",
        title: "Working in client repositories",
        lessons: [
          { id: "c-ts-l4", title: "Reading a codebase you didn't write", durationMin: 14 },
          { id: "c-ts-l5", title: "Integrations: validate at the boundary", durationMin: 12 },
          { id: "c-ts-l6", title: "Errors a client can read", durationMin: 8 },
        ],
      },
      {
        id: "c-ts-m3",
        title: "Review and delivery",
        lessons: [
          { id: "c-ts-l7", title: "What reviewers look for here", durationMin: 10 },
          { id: "c-ts-l8", title: "The handover-ready repository", durationMin: 11 },
          { id: "c-ts-l9", title: "Your first posting: how to bid", durationMin: 7 },
        ],
      },
    ],
  },
  {
    id: "c-automation",
    title: "Shipping Automations Safely",
    description: "Shadow periods, exception queues, and rollback plans for work that touches a client's system of record.",
    departmentId: "engineering",
    isPrimer: false,
    modules: [
      {
        id: "c-au-m1",
        title: "Before anything writes",
        lessons: [
          { id: "c-au-l1", title: "The shadow period, explained", durationMin: 13 },
          { id: "c-au-l2", title: "Exception queues are the product", durationMin: 11 },
        ],
      },
      {
        id: "c-au-m2",
        title: "When it goes wrong",
        lessons: [
          { id: "c-au-l3", title: "Rollback plans clients sign off on", durationMin: 12 },
          { id: "c-au-l4", title: "Writing the incident note", durationMin: 8 },
        ],
      },
    ],
  },
  {
    id: "c-brand-fieldwork",
    title: "Brand Systems Fieldwork",
    description: "Building brand systems that survive contact with the client's tools — the Design primer.",
    departmentId: "design",
    isPrimer: true,
    modules: [
      {
        id: "c-bf-m1",
        title: "Systems, not artifacts",
        lessons: [
          {
            id: "c-bf-l1",
            title: "The client's tools are the medium",
            durationMin: 12,
            body: `A brand system that only works in our design files is a portfolio piece, not a deliverable. The Fernwell letterhead will live in Word. The Ratio price list will be edited by a wholesale manager in a spreadsheet, eleven months from now, without us in the room. Fieldwork means designing for that room.

Start every engagement by asking what software the client actually opens. Not what they own — what they open. Cassia's front desk has a license for the full design suite and uses none of it; their world is the practice-management system and a shared drive. A patient-intake redesign that requires anything else has failed before the first screen is drawn, no matter how clean the flow is.

Then design the degradation path on purpose. Every system has a best version and a survivable version: the proposal template with the custom face, and the one that falls back to a system font on a machine we have never seen. Theo's acceptance test for the Fernwell templates was a round trip through Margaret's own laptop — if it comes back broken, the system is not done. Decide what is allowed to degrade (spacing tolerances, the second accent color) and what is not (the logo clear space, the figure alignment in tables), and write both lists into the delivery note.

Finally, hand over the rules, not just the files. A one-page "how to not break this" sheet beats a forty-page brand book for a two-person office: which file to copy for a new document, the three things never to change, who to message when something looks off. The vault keeps the masters; the client keeps the habits.

Before the next lesson, pick one deliverable from a current job and name its survivable version. If you cannot, that is the gap to close this week.`,
          },
          { id: "c-bf-l2", title: "Audit before you draw", durationMin: 10 },
          { id: "c-bf-l3", title: "Degradation paths, decided on purpose", durationMin: 11 },
        ],
      },
      {
        id: "c-bf-m2",
        title: "The collateral set",
        lessons: [
          { id: "c-bf-l4", title: "Templates that survive Word", durationMin: 13 },
          { id: "c-bf-l5", title: "Tables, figures, and other unglamorous wins", durationMin: 9 },
          { id: "c-bf-l6", title: "The round-trip acceptance test", durationMin: 8 },
        ],
      },
      {
        id: "c-bf-m3",
        title: "Handover",
        lessons: [
          { id: "c-bf-l7", title: "The one-page rules sheet", durationMin: 9 },
          { id: "c-bf-l8", title: "Filing the masters in the vault", durationMin: 7 },
          { id: "c-bf-l9", title: "Walking the client through it", durationMin: 10 },
        ],
      },
    ],
  },
  {
    id: "c-voice",
    title: "The Krysalis Voice",
    description: "How the firm writes — campaigns, the site, client email — and the Marketing primer.",
    departmentId: "marketing",
    isPrimer: true,
    modules: [
      {
        id: "c-kv-m1",
        title: "Plain words, real claims",
        lessons: [
          { id: "c-kv-l1", title: "What we never say", durationMin: 9, body: `The fastest way to sound like every other automation shop is to borrow their words. We do not. The site, the proposals, and every campaign run on a short discipline: name the work, name the result, and let the specifics carry the weight.

That means numbers over adjectives. "The dunning flow recovered 38 subscriptions in three weeks" beats any sentence built on "powerful" — and it is the sentence the client repeats to their board. When a result is not measurable yet, say what was done and when the measurement comes; honesty about timing reads as competence, because it is.

It also means the client is the subject of the sentence. Their front desk gets its two hours back; their dispatcher runs the morning from one screen. Krysalis appears as the firm that did the work, not the hero of the story. Copy that centers us is copy the reader skips.

A short list of words is banned outright because they promise nothing — the breathless adjectives every automation shop reaches for. If a draft leans on one, the draft does not know what the work actually did; go find out, then write that instead. Exclamation marks are banned in product and proposal copy for the same reason: a true sentence does not need one.

Exercise before the next lesson: take any agency homepage, pick three sentences, and rewrite each one with a number, a subject who is the client, and no banned words. Bring the before and after to your department channel.` },
          { id: "c-kv-l2", title: "Numbers do the persuading", durationMin: 10 },
        ],
      },
      {
        id: "c-kv-m2",
        title: "Channels",
        lessons: [
          { id: "c-kv-l3", title: "Email: one job per message", durationMin: 11 },
          { id: "c-kv-l4", title: "Case studies clients forward", durationMin: 12 },
        ],
      },
    ],
  },
  {
    id: "c-handover",
    title: "Running a Handover",
    description: "Closing an engagement so the client keeps winning after we leave — the Operations primer.",
    departmentId: "operations",
    isPrimer: true,
    modules: [
      {
        id: "c-rh-m1",
        title: "The handover note",
        lessons: [
          { id: "c-rh-l1", title: "Decisions with dates", durationMin: 10, body: `Six months after an engagement closes, nobody rereads the file list. They reread the decisions — and only if someone wrote them down with dates and reasons while they were fresh.

A Krysalis handover note opens with the decision log: each significant choice, the date it was made, who made it, and the sentence of reasoning that made it right at the time. "Staging-first during the shadow period (June 4, Priya and Sam) — so automated records could be diffed against hand-keyed ones before going live." That single line saves a future engineer a debugging morning and saves the client from undoing a choice they never knew was deliberate.

The second section is people, not systems: who at the client actually owns each piece now, who to call when it misbehaves, and — the part that never survives in tickets — how they like to be reached. Irene reads the weekly summary; Curtis reads nothing until something breaks. Writing that down is not gossip; it is the operating manual for the relationship.

Third, the locations: where the masters live in the vault, which assets were shared to the client portal, and which credentials were handed back. Every entry is a link, not a description. If finding something takes more than one click from the note, the note is not finished.

Keep the whole thing under two pages. A handover note that nobody finishes reading protects nobody. Before the next lesson, open the note from the last job you touched — or notice that it does not exist, which is the more common finding, and the reason this course is the Operations primer.` },
          { id: "c-rh-l2", title: "Who owns what now", durationMin: 9 },
        ],
      },
      {
        id: "c-rh-m2",
        title: "The last week",
        lessons: [
          { id: "c-rh-l3", title: "The closing review call", durationMin: 11 },
          { id: "c-rh-l4", title: "From delivered to dormant, gracefully", durationMin: 8 },
        ],
      },
    ],
  },
  {
    id: "c-scoping",
    title: "Scoping Client Engagements",
    description: "Turning a discovery call into a fixed scope the firm can deliver at margin.",
    departmentId: "operations",
    isPrimer: false,
    modules: [
      {
        id: "c-sc-m1",
        title: "Discovery that counts things",
        lessons: [
          { id: "c-sc-l1", title: "Count steps, not feelings", durationMin: 12, body: `A scope built on adjectives fails at delivery. A scope built on counted things survives. The discovery call's one job is to leave with numbers: how many steps, how many documents, how many people, how many times a day.

When Lena walked Tidegate's claims desk, she did not write "intake is very manual." She counted eleven manual steps from carrier email to claim record, and noted which three systems received the same keystrokes. That count became the proposal's spine: parser for the two formats covering 84 percent of volume, queue for the rest, and a number — 21,500.00 — that both sides could defend, because both sides could see what it bought.

Counting also exposes the work that should not be automated. Bellhaven's ninety units sound like a software problem until you learn two office staff handle them, and half the "maintenance requests" are one tenant who prefers the phone. The honest scope is smaller than the enthusiastic one, and the firm's reputation compounds on honest scopes.

Three numbers belong in every discovery summary: volume (how often the painful thing happens), touch (how many hands it passes through), and variance (how many shapes it arrives in). Volume sells the engagement, touch sizes it, and variance is where the risk lives — variance is why the exception queue exists in every automation we ship.

Practice: take the unclaimed booking card on the bounty board and write the three questions you would ask first. Compare with a colleague's three. The overlap is the playbook; the differences are worth a thread in the operations channel.` },
          { id: "c-sc-l2", title: "The three numbers every scope needs", durationMin: 10 },
        ],
      },
      {
        id: "c-sc-m2",
        title: "From numbers to a price",
        lessons: [
          { id: "c-sc-l3", title: "Fixed fees and where they break", durationMin: 13 },
          { id: "c-sc-l4", title: "Writing the proposal", durationMin: 11 },
        ],
      },
    ],
  },
];

export function courseById(id: string): MockCourse | undefined {
  return COURSES.find((c) => c.id === id);
}

export function lessonCount(course: MockCourse): number {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}
