import type {
  Agent,
  Channel,
  ChatMessage,
  ClientAsset,
  Department,
  ForumPost,
  ManagedUser,
  Member,
  VaultItem,
} from "./types";

export const DEPARTMENTS: Department[] = [
  { id: "leadership", name: "Leadership Hub", icon: "👑" },
  { id: "marketing", name: "Marketing & Sales", icon: "📈" },
  { id: "research", name: "Research Lab", icon: "🧪" },
  { id: "dev", name: "Developers Guild", icon: "💻" },
];

export const COMPANY_VALUES = [
  "Ship with care, not haste",
  "Compound knowledge daily",
  "Automate the boring 80%",
  "Clients feel the craft",
];

export const CORE_GOALS = [
  "Q2 · Launch the Agent Mesh pilot",
  "Q2 · 95% client NPS on deliveries",
  "Q2 · Vault coverage to 5k notes",
];

export const MEMBERS: Member[] = [
  { id: "dana", name: "Dana Whitfield", title: "COO", online: true, departmentId: "leadership" },
  { id: "marcus", name: "Marcus Reed", title: "Chief of Staff", online: true, departmentId: "leadership" },
  { id: "priya", name: "Priya Anand", title: "Strategy Lead", online: false, departmentId: "leadership" },
  { id: "sofia", name: "Sofia Marin", title: "Growth Lead", online: true, departmentId: "marketing" },
  { id: "jake", name: "Jake Tran", title: "SDR", online: true, departmentId: "marketing" },
  { id: "emma", name: "Emma Castillo", title: "Content", online: false, departmentId: "marketing" },
  { id: "lena", name: "Dr. Lena Voss", title: "Principal Researcher", online: true, departmentId: "research" },
  { id: "tomas", name: "Tomas Okafor", title: "ML Engineer", online: false, departmentId: "research" },
  { id: "mia", name: "Mia Chen", title: "Research Ops", online: true, departmentId: "research" },
  { id: "alex", name: "Alex Kim", title: "Staff Engineer", online: true, departmentId: "dev" },
  { id: "rosa", name: "Rosa Delgado", title: "Platform", online: true, departmentId: "dev" },
  { id: "sam", name: "Sam Patel", title: "Frontend", online: false, departmentId: "dev" },
];

export const AGENTS: Agent[] = [
  {
    id: "meeting-summarizer",
    name: "Meeting Summarizer",
    role: "Summarizer",
    departmentId: "leadership",
    status: "running",
    currentWorkflow: "Running: exec-sync-digest via n8n",
    synergy: 91,
    vaultNotesIndexed: 1204,
    quickActions: [{ label: "Run Meeting Summarizer" }, { label: "Post Digest to Vault" }],
    lastRun: "Today · 09:14",
    ack: "✅ Workflow `exec-sync-digest` triggered · transcript ingested · summary in ~2 min",
  },
  {
    id: "okr-tracker",
    name: "OKR Tracker",
    role: "Tracker",
    departmentId: "leadership",
    status: "idle",
    currentWorkflow: "Last: okr-pulse weekly re-score",
    synergy: 78,
    vaultNotesIndexed: 642,
    quickActions: [{ label: "Re-score Key Results" }, { label: "View Confidence Report" }],
    lastRun: "Yesterday · 17:02",
    ack: "✅ Workflow `okr-pulse` triggered · 12 key results re-scoring",
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    role: "Lead Qualifier",
    departmentId: "marketing",
    status: "running",
    currentWorkflow: "Running: lead-qualify-v3 via n8n",
    synergy: 86,
    vaultNotesIndexed: 938,
    quickActions: [{ label: "Qualify New Leads" }, { label: "View Lead Scoreboard" }],
    lastRun: "Today · 11:48",
    ack: "✅ Workflow `lead-qualify-v3` triggered · 42 records queued · ETA ~4 min",
  },
  {
    id: "campaign-copilot",
    name: "Campaign Copilot",
    role: "Copilot",
    departmentId: "marketing",
    status: "idle",
    currentWorkflow: "Last: campaign-drafts-v2 (3 variants)",
    synergy: 72,
    vaultNotesIndexed: 511,
    quickActions: [{ label: "Draft Campaign Variants" }, { label: "Re-index Vault" }],
    lastRun: "Yesterday · 15:31",
    ack: "✅ Workflow `campaign-drafts-v2` triggered · 3 variants drafting",
  },
  {
    id: "paper-digestor",
    name: "Paper Digestor",
    role: "Digestor",
    departmentId: "research",
    status: "idle",
    currentWorkflow: "Last: paper-digest (6 PDFs)",
    synergy: 94,
    vaultNotesIndexed: 2310,
    quickActions: [{ label: "Digest New Papers" }, { label: "Re-index Vault" }],
    lastRun: "Today · 07:20",
    ack: "✅ Workflow `paper-digest` triggered · 6 PDFs parsing",
  },
  {
    id: "insight-miner",
    name: "Insight Miner",
    role: "Miner",
    departmentId: "research",
    status: "running",
    currentWorkflow: "Running: arxiv-sweep-nightly via n8n",
    synergy: 81,
    vaultNotesIndexed: 1877,
    quickActions: [{ label: "Run arXiv Sweep" }, { label: "Cluster New Findings" }],
    lastRun: "Today · 03:00",
    ack: "✅ Workflow `arxiv-sweep-nightly` triggered · 128 abstracts scanning",
  },
  {
    id: "pr-reviewer",
    name: "PR Reviewer",
    role: "PR Reviewer",
    departmentId: "dev",
    status: "running",
    currentWorkflow: "Running: pr-review-queue via n8n",
    synergy: 88,
    vaultNotesIndexed: 1456,
    quickActions: [{ label: "Review Open PRs" }, { label: "Re-index Vault" }],
    lastRun: "Today · 12:05",
    ack: "✅ Workflow `pr-review-queue` triggered · 5 open PRs queued",
  },
  {
    id: "deploy-sentinel",
    name: "Deploy Sentinel",
    role: "Sentinel",
    departmentId: "dev",
    status: "idle",
    currentWorkflow: "Last: nightly smoke-suite · all green",
    synergy: 67,
    vaultNotesIndexed: 389,
    quickActions: [{ label: "Run Smoke Tests" }, { label: "View Deploy Log" }],
    lastRun: "Today · 02:12",
    ack: "✅ Workflow `smoke-suite` triggered · staging checks running",
  },
];

export const CHANNELS: Channel[] = [
  { id: "lead-ann", name: "announcements", departmentId: "leadership" },
  { id: "lead-gen", name: "leadership-general", departmentId: "leadership" },
  { id: "mkt-ann", name: "announcements", departmentId: "marketing" },
  { id: "mkt-gen", name: "marketing-general", departmentId: "marketing" },
  { id: "res-ann", name: "announcements", departmentId: "research" },
  { id: "res-gen", name: "research-general", departmentId: "research" },
  { id: "dev-ann", name: "announcements", departmentId: "dev" },
  { id: "dev-gen", name: "dev-general", departmentId: "dev" },
];

let mid = 0;
function m(author: string, time: string, text: string, kind: ChatMessage["kind"] = "human"): ChatMessage {
  mid += 1;
  return { id: `seed-${mid}`, author, time, text, kind };
}

export const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  "ch:lead-ann": [
    m("Dana Whitfield", "08:42", "Board deck v3 is locked. Thanks for the late-night pass, everyone — it goes out at 17:00 JST."),
    m("Marcus Reed", "09:05", "Reminder: all-hands moved to Thursday 10:00. Agenda is pinned in the Vault."),
    m("Priya Anand", "09:31", "Q2 OKR mid-point review is live. Owners, update your confidence scores by EOW please."),
    m("Meeting Summarizer", "09:40", "📋 Digest of Monday's exec sync posted to the Vault → \"Exec Sync · Week 24\".", "agent"),
    m("Dana Whitfield", "10:12", "Two new client engagements signed this morning. Kickoff briefs landing in Marketing & Sales today."),
    m("You", "10:15", "Huge. Congrats team 🎉", "self"),
  ],
  "ch:lead-gen": [
    m("Marcus Reed", "11:02", "Travel approvals for the Osaka offsite close Friday — get your requests in."),
    m("Priya Anand", "11:20", "Drafting the partner-tier pricing memo. Anyone have the latest CAC numbers handy?"),
    m("Dana Whitfield", "11:24", "Sofia posted them in #marketing-general yesterday — pulling them into the memo now."),
    m("OKR Tracker", "12:00", "📈 Weekly pulse: 8 of 12 key results on-track, 3 at-risk, 1 blocked. Full report in the Vault.", "agent"),
    m("You", "12:08", "The blocked one is the SSO migration — meeting with Dev Guild this afternoon to unblock.", "self"),
    m("Marcus Reed", "12:11", "Perfect, I'll note it in the board addendum."),
    m("Priya Anand", "12:40", "Memo draft is up for comments — leadership eyes only for now."),
  ],
  "ch:mkt-ann": [
    m("Sofia Marin", "08:15", "Webinar wrap: 312 registrants, 187 live attendees, 42 hand-raisers. Strongest funnel this quarter 🔥"),
    m("Lead Qualifier", "08:20", "⚡ Auto-qualification of webinar leads has started · workflow `lead-qualify-v3` · 42 records queued.", "agent"),
    m("Emma Castillo", "09:00", "Case study #4 (logistics client) is approved by legal — publishing tomorrow with the new template."),
    m("Jake Tran", "09:45", "Booked 6 discovery calls off the webinar list already. The AI-scored shortlist is scary good."),
    m("Sofia Marin", "10:30", "Q3 campaign theme brainstorm Thursday 14:00 — bring one bold idea each."),
    m("You", "10:33", "I'll bring two 😄", "self"),
  ],
  "ch:mkt-gen": [
    m("Jake Tran", "11:10", "Anyone have the one-pager for the manufacturing vertical? Prospect is asking."),
    m("Emma Castillo", "11:12", "In the Vault under \"Vertical One-Pagers\" — updated it last week."),
    m("Campaign Copilot", "11:30", "✍️ Drafted 3 subject-line variants for the nurture sequence · open-rate prediction attached.", "agent"),
    m("Sofia Marin", "11:41", "Variant B is the winner, ship it."),
    m("Jake Tran", "12:02", "CRM hygiene day is Friday — clear your stale opportunities before the sync runs."),
    m("You", "12:05", "On it. Also flagging two duplicate accounts I found.", "self"),
    m("Emma Castillo", "12:36", "New brand photography is in the shared drive — tagged by use-case."),
  ],
  "ch:res-ann": [
    m("Dr. Lena Voss", "07:55", "Reading group Wednesday: \"Toolformer revisited\" — 14 pages, summaries will be in the Vault by tonight."),
    m("Insight Miner", "08:00", "🌙 Nightly arXiv sweep complete · 128 abstracts scanned · 7 flagged as highly relevant.", "agent"),
    m("Mia Chen", "08:40", "Lab compute budget approved for Q3 — H100 hours up 40%."),
    m("Tomas Okafor", "09:15", "Eval harness v2 is live. Re-run your baselines before citing old numbers."),
    m("Dr. Lena Voss", "10:05", "We got accepted to the workshop! Camera-ready due in 3 weeks."),
    m("You", "10:09", "Congratulations! 🎉 Happy to help with the ablation tables.", "self"),
  ],
  "ch:res-gen": [
    m("Tomas Okafor", "10:50", "Seeing a weird regression on the retrieval benchmark — anyone touched the chunking config?"),
    m("Mia Chen", "10:58", "Chunk size went 512→768 in last week's vault re-index. Could be it."),
    m("Paper Digestor", "11:05", "📄 Digested 6 new PDFs into structured notes · 2 contain relevant chunking ablations.", "agent"),
    m("Dr. Lena Voss", "11:12", "Ha — the agent literally found us prior art. Reading now."),
    m("Tomas Okafor", "11:30", "Confirmed, reverting to 512 for the benchmark set. Thanks all."),
    m("You", "11:34", "Adding a regression test so this can't sneak in again.", "self"),
  ],
  "ch:dev-ann": [
    m("Alex Kim", "08:30", "Release 2.14 is out 🚀 — changelog in the Vault. Zero rollbacks needed."),
    m("Deploy Sentinel", "08:32", "🛡 Post-deploy smoke-suite: 84/84 checks green · p95 latency stable.", "agent"),
    m("Rosa Delgado", "09:10", "Platform maintenance window Saturday 02:00–04:00 JST — API may blip."),
    m("Sam Patel", "09:55", "Design system v3 tokens merged. Migrate your components when you touch them."),
    m("Alex Kim", "10:40", "RFC: trunk-based deploys with feature flags — comments open until Friday (see Forum)."),
    m("You", "10:44", "Commented — strongly in favor, with one caveat on flag cleanup.", "self"),
  ],
  "ch:dev-gen": [
    m("Sam Patel", "11:15", "Anyone else seeing flaky e2e on the checkout spec? Third retry today."),
    m("Rosa Delgado", "11:20", "Known issue — race in the test fixture. Fix is in PR #482."),
    m("PR Reviewer", "11:25", "🔍 PR #482 reviewed · 2 suggestions posted · no blocking issues found.", "agent"),
    m("Alex Kim", "11:31", "Merging after CI. Sam, rebase and you should be green."),
    m("Sam Patel", "11:58", "Green ✅ thanks both."),
    m("You", "12:14", "Reminder: dependency-bump day tomorrow, expect a noisy PR queue.", "self"),
    m("Rosa Delgado", "12:30", "I'll babysit the queue with the PR Reviewer agent."),
  ],
  "dm:dana": [
    m("Dana Whitfield", "09:02", "Got 10 minutes before the board call? Want your read on the automation pilot slide."),
    m("You", "09:04", "Yes — sending you two tweaks to the ROI framing now.", "self"),
    m("Dana Whitfield", "09:15", "Both taken. Much sharper, thank you."),
    m("You", "09:16", "Anytime. Good luck in there 🍀", "self"),
  ],
  "dm:sofia": [
    m("Sofia Marin", "10:20", "The webinar lead list just hit the CRM — quality looks unusually high."),
    m("You", "10:22", "The new qualification workflow is doing the heavy lifting. Check the scoreboard.", "self"),
    m("Sofia Marin", "10:25", "Just did. 42 qualified, 11 hot. Booking blitz tomorrow?"),
    m("You", "10:26", "Locked. I'll prep the talk tracks tonight.", "self"),
  ],
  "dm:lena": [
    m("Dr. Lena Voss", "13:05", "Your ablation idea made it into the camera-ready. Co-author credit, obviously."),
    m("You", "13:08", "Honored! Send me the LaTeX and I'll polish the tables this week.", "self"),
  ],
  "dm:alex": [
    m("Alex Kim", "14:10", "Trunk-based RFC is trending positive. Can you own the flag-cleanup tooling section?"),
    m("You", "14:12", "Yep — drafting it tonight, will tag you for review.", "self"),
    m("Alex Kim", "14:13", "Legend. 🙏"),
  ],
  "agent:meeting-summarizer": [
    m("You", "09:10", "Summarize this morning's exec sync and post the digest to the Vault.", "self"),
    m("Meeting Summarizer", "09:10", "On it. Pulling the transcript from the recording bot now.", "agent"),
    m("Meeting Summarizer", "09:11", "✅ Workflow `exec-sync-digest` triggered · transcript ingested · summary in ~2 min", "agent"),
    m("Meeting Summarizer", "09:14", "Done — digest posted to the Vault as \"Exec Sync · Week 24\". 5 decisions, 3 action items, 1 risk flagged.", "agent"),
  ],
  "agent:okr-tracker": [
    m("You", "17:00", "Re-score all key results before the leadership review.", "self"),
    m("OKR Tracker", "17:00", "✅ Workflow `okr-pulse` triggered · 12 key results re-scoring", "agent"),
    m("OKR Tracker", "17:02", "Complete. 8 on-track · 3 at-risk · 1 blocked. Confidence report is in the Vault.", "agent"),
  ],
  "agent:lead-qualifier": [
    m("You", "11:45", "Qualify the leads from today's webinar.", "self"),
    m("Lead Qualifier", "11:45", "Acknowledged. Fetching 42 new records from the webinar integration.", "agent"),
    m("Lead Qualifier", "11:46", "✅ Workflow `lead-qualify-v3` triggered · 42 records queued · ETA ~4 min", "agent"),
    m("Lead Qualifier", "11:50", "Done — 42 scored: 11 hot 🔥 · 19 warm · 12 nurture. Scoreboard updated.", "agent"),
  ],
  "agent:campaign-copilot": [
    m("You", "15:28", "Draft three subject-line variants for the nurture sequence.", "self"),
    m("Campaign Copilot", "15:28", "✅ Workflow `campaign-drafts-v2` triggered · 3 variants drafting", "agent"),
    m("Campaign Copilot", "15:31", "Variants ready in the shared doc, with predicted open rates: A 38% · B 44% · C 41%.", "agent"),
  ],
  "agent:paper-digestor": [
    m("You", "07:15", "Digest the 6 new PDFs in the reading-group folder.", "self"),
    m("Paper Digestor", "07:15", "✅ Workflow `paper-digest` triggered · 6 PDFs parsing", "agent"),
    m("Paper Digestor", "07:20", "All 6 digested into structured notes — key claims, methods, and citations linked into the vault graph.", "agent"),
  ],
  "agent:insight-miner": [
    m("You", "08:05", "Anything notable in last night's arXiv sweep?", "self"),
    m("Insight Miner", "08:05", "7 of 128 abstracts flagged highly relevant. Top hit: a chunking ablation study matching our retrieval regression.", "agent"),
    m("You", "08:07", "Cluster those 7 and post to #research-general.", "self"),
    m("Insight Miner", "08:07", "✅ Workflow `arxiv-sweep-nightly` (cluster step) triggered · posting summary shortly.", "agent"),
  ],
  "agent:pr-reviewer": [
    m("You", "11:22", "Review PR #482 — it fixes the flaky e2e fixture.", "self"),
    m("PR Reviewer", "11:22", "✅ Workflow `pr-review-queue` triggered · PR #482 queued first", "agent"),
    m("PR Reviewer", "11:25", "Review posted: 2 non-blocking suggestions (test isolation + a typo). LGTM overall. 👍", "agent"),
  ],
  "agent:deploy-sentinel": [
    m("You", "02:05", "Run the smoke suite against staging before the 2.14 release.", "self"),
    m("Deploy Sentinel", "02:05", "✅ Workflow `smoke-suite` triggered · staging checks running", "agent"),
    m("Deploy Sentinel", "02:12", "84/84 checks green · p95 latency stable · release window is clear. 🛡", "agent"),
  ],
};

export const FORUM_POSTS: ForumPost[] = [
  {
    id: "fp1",
    departmentId: "leadership",
    author: "Marcus Reed",
    time: "2d ago",
    title: "Should agent digests go to email too?",
    body: "The Vault digests are great but I keep missing them. Proposal: mirror the daily agent digest to email at 08:00 local.",
    upvotes: 14,
    order: 6,
    replies: [
      { id: "fr1", author: "Dana Whitfield", time: "2d ago", text: "Supportive — as long as it's opt-in per person." },
      { id: "fr2", author: "Priya Anand", time: "1d ago", text: "Could the Meeting Summarizer own this end-to-end?" },
    ],
  },
  {
    id: "fp2",
    departmentId: "leadership",
    author: "Priya Anand",
    time: "5d ago",
    title: "Feedback wanted: partner-tier pricing memo",
    body: "Draft is in the Vault. Particularly keen on pushback for the usage-based tier — is the floor too low?",
    upvotes: 9,
    order: 3,
    replies: [{ id: "fr3", author: "Marcus Reed", time: "4d ago", text: "Floor feels right; the ceiling is what I'd revisit." }],
  },
  {
    id: "fp3",
    departmentId: "marketing",
    author: "Jake Tran",
    time: "1d ago",
    title: "The AI lead scoring is changing how I prospect",
    body: "Three weeks in: my call connect rate is up 22% just by working the hot list first. Anyone else re-ordering their day around the scoreboard?",
    upvotes: 21,
    order: 7,
    replies: [
      { id: "fr4", author: "Sofia Marin", time: "1d ago", text: "Same. Let's make 'scoreboard first' the official SOP." },
      { id: "fr5", author: "Emma Castillo", time: "20h ago", text: "Content angle: this is a case study about ourselves." },
    ],
  },
  {
    id: "fp4",
    departmentId: "marketing",
    author: "Emma Castillo",
    time: "4d ago",
    title: "Retiring the old newsletter template?",
    body: "Open rates on the new template are +9pts over four sends. I propose we sunset the old one and archive it in the Vault.",
    upvotes: 12,
    order: 4,
    replies: [{ id: "fr6", author: "Jake Tran", time: "3d ago", text: "+1, the new footer CTA alone is worth it." }],
  },
  {
    id: "fp5",
    departmentId: "research",
    author: "Tomas Okafor",
    time: "8h ago",
    title: "Eval harness v2 — share your regression diffs",
    body: "Post your before/after numbers here so we can spot systemic shifts. I'll compile into a Vault note on Friday.",
    upvotes: 8,
    order: 8,
    replies: [{ id: "fr7", author: "Dr. Lena Voss", time: "6h ago", text: "Retrieval +2.1, reasoning flat. Posting full table tomorrow." }],
  },
  {
    id: "fp6",
    departmentId: "research",
    author: "Mia Chen",
    time: "3d ago",
    title: "Reading group cadence: weekly or biweekly?",
    body: "Attendance is dipping. Would a biweekly deep-dive with agent-prepared summaries beat the weekly skim?",
    upvotes: 11,
    order: 5,
    replies: [
      { id: "fr8", author: "Tomas Okafor", time: "3d ago", text: "Biweekly + Paper Digestor pre-reads gets my vote." },
    ],
  },
  {
    id: "fp7",
    departmentId: "dev",
    author: "Alex Kim",
    time: "1d ago",
    title: "RFC: trunk-based deploys with feature flags",
    body: "Full RFC in the Vault. TL;DR: kill long-lived branches, deploy trunk hourly, gate everything behind flags with a 2-week cleanup SLA.",
    upvotes: 19,
    order: 9,
    replies: [
      { id: "fr9", author: "Rosa Delgado", time: "1d ago", text: "Platform is ready for this. Flag cleanup tooling is the only gap." },
      { id: "fr10", author: "Sam Patel", time: "22h ago", text: "Frontend on board if preview deploys stay per-PR." },
    ],
  },
  {
    id: "fp8",
    departmentId: "dev",
    author: "Rosa Delgado",
    time: "6d ago",
    title: "Postmortem culture check",
    body: "We're writing postmortems but not re-reading them. Should the Deploy Sentinel surface 'similar past incident' links automatically?",
    upvotes: 16,
    order: 2,
    replies: [{ id: "fr11", author: "Alex Kim", time: "5d ago", text: "Yes — vault similarity search makes this nearly free." }],
  },
];

export const VAULT_ITEMS: VaultItem[] = [
  { id: "v1", departmentId: "leadership", type: "SOP", title: "Board Reporting SOP", description: "Monthly cadence, deck structure, and sign-off chain for board communications.", updated: "Updated 2d ago", tag: "Governance" },
  { id: "v2", departmentId: "leadership", type: "Playbook", title: "Hiring Bar Playbook", description: "Interview loops, scorecards, and debrief format for every role family.", updated: "Updated 1w ago", tag: "People" },
  { id: "v3", departmentId: "leadership", type: "Training", title: "Manager Foundations", description: "Four-module training for new leads: feedback, 1:1s, planning, calibration.", updated: "Updated 3w ago", tag: "Training" },
  { id: "v4", departmentId: "leadership", type: "SOP", title: "Exec Sync · Week 24 Digest", description: "Agent-generated digest: 5 decisions, 3 action items, 1 risk flagged.", updated: "Updated today", tag: "Agent Digest" },
  { id: "v5", departmentId: "marketing", type: "Playbook", title: "Webinar Funnel Playbook", description: "End-to-end: promotion timeline, live-call structure, and post-event sequences.", updated: "Updated 1d ago", tag: "Demand Gen" },
  { id: "v6", departmentId: "marketing", type: "SOP", title: "Lead Handoff SOP", description: "Scoring thresholds and SLAs for marketing → sales handoff via the qualifier agent.", updated: "Updated 4d ago", tag: "RevOps" },
  { id: "v7", departmentId: "marketing", type: "Training", title: "Voice & Tone Module", description: "Brand voice training with annotated examples and rewrite exercises.", updated: "Updated 2w ago", tag: "Brand" },
  { id: "v8", departmentId: "marketing", type: "Playbook", title: "Vertical One-Pagers", description: "Per-industry value props: manufacturing, logistics, fintech, healthcare.", updated: "Updated 1w ago", tag: "Sales Enablement" },
  { id: "v9", departmentId: "research", type: "SOP", title: "Eval Harness v2 Guide", description: "How to run baselines, log runs, and submit regression diffs.", updated: "Updated 8h ago", tag: "Evals" },
  { id: "v10", departmentId: "research", type: "Playbook", title: "Literature Triage Playbook", description: "Using the Insight Miner sweep + Paper Digestor to keep reading load sane.", updated: "Updated 3d ago", tag: "Process" },
  { id: "v11", departmentId: "research", type: "Training", title: "Vault Graph Onboarding", description: "Linking notes, naming conventions, and how agents index your writing.", updated: "Updated 5d ago", tag: "Knowledge" },
  { id: "v12", departmentId: "research", type: "SOP", title: "Compute Request SOP", description: "Requesting H100 hours: quotas, justification template, approval chain.", updated: "Updated 1w ago", tag: "Ops" },
  { id: "v13", departmentId: "dev", type: "SOP", title: "Release Checklist 2.x", description: "Pre-flight, deploy, smoke-suite, and rollback procedure for every release.", updated: "Updated 1d ago", tag: "Release" },
  { id: "v14", departmentId: "dev", type: "Playbook", title: "Incident Response Playbook", description: "Sev levels, comms templates, and the postmortem format.", updated: "Updated 2w ago", tag: "Reliability" },
  { id: "v15", departmentId: "dev", type: "Training", title: "Design System v3 Migration", description: "Token mapping, codemods, and component-by-component migration notes.", updated: "Updated 3d ago", tag: "Frontend" },
  { id: "v16", departmentId: "dev", type: "SOP", title: "Trunk-Based Deploys RFC", description: "Hourly trunk deploys gated by flags with a 2-week cleanup SLA. Comments open.", updated: "Updated 1d ago", tag: "RFC" },
];

export const CLIENT_ASSETS: ClientAsset[] = [
  { id: "ca1", name: "Kickoff Deck — Engagement Overview.pdf", icon: "📊", sharedBy: "Dana Whitfield", date: "Jun 9, 2026", isNew: true },
  { id: "ca2", name: "Automation Pilot — Scope of Work.docx", icon: "📄", sharedBy: "Marcus Reed", date: "Jun 8, 2026", isNew: true },
  { id: "ca3", name: "Discovery Workshop Recording.mp4", icon: "🎬", sharedBy: "Priya Anand", date: "Jun 5, 2026", isNew: false },
  { id: "ca4", name: "Weekly Progress Report — W23.pdf", icon: "📈", sharedBy: "Krysalis Reports", date: "Jun 6, 2026", isNew: false },
  { id: "ca5", name: "Integration Checklist.xlsx", icon: "🧮", sharedBy: "Alex Kim", date: "Jun 3, 2026", isNew: false },
  { id: "ca6", name: "Brand Asset Pack.zip", icon: "📁", sharedBy: "Emma Castillo", date: "May 29, 2026", isNew: false },
];

export const DEFAULT_POSITIONS = ["Admin", "Moderator", "Employee", "Client"];

export const USERS: ManagedUser[] = [
  { id: "u1", name: "Dana Whitfield", email: "dana@krysalis.ai", position: "Admin", status: "Active" },
  { id: "u2", name: "Marcus Reed", email: "marcus@krysalis.ai", position: "Moderator", status: "Active" },
  { id: "u3", name: "Sofia Marin", email: "sofia@krysalis.ai", position: "Employee", status: "Active" },
  { id: "u4", name: "Alex Kim", email: "alex@krysalis.ai", position: "Employee", status: "Active" },
  { id: "u5", name: "Jordan Lee · Acme Corp", email: "jordan@acme.co", position: "Client", status: "Active" },
  { id: "u6", name: "Riley Fox · Northwind", email: "riley@northwind.io", position: "Client", status: "Suspended" },
];

export const INFO_MESSAGES = [
  "Our Promise: Accelerating Your Enterprise AI",
  "New: Automation pilot demo scheduled for next Thursday",
  "Tip: Freshly shared files are flagged in your Asset Panel",
];

export const GUIDE_MD = `# Welcome to Krysalis

Your dedicated portal for everything we're building together.

## Getting started

1. **Bookmark this portal** — updates, files and announcements land here first.
2. Check the **Asset Panel** below for files our team has shared with your account.
3. Questions? Your engagement lead replies within one business day.

## How we work

- **Weekly sync** — every Thursday, 30 minutes, agenda shared the day before.
- **Deliverables** are posted to the Asset Panel and flagged as *New*.
- **Feedback** can be sent directly to your engagement lead at any time.

> Our promise: senior attention on every deliverable, no black boxes, and a measurable result every sprint.

## Current engagement

- Phase: **Discovery → Build**
- Next milestone: *Automation pilot demo*
- Point of contact: **Dana Whitfield** — dana@krysalis.ai

---

*This guide is maintained by the Krysalis team and updates in real time.*
`;
