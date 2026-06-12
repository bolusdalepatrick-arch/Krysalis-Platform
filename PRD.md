# Krysalis Agentic OS — Build Specification v3
Product requirements and engineering handbook for the Claude Code build.
Supersedes the original "Ecosystem V1" PRD draft and spec v2. Place this file at
the repository root as `PRD.md` so `CLAUDE.md` can reference it.
Naming note: this is revision 3 of the *spec*; the build it describes is still
called **V2** throughout (V1 is the shipped frontend mockup; V3 is the shelf in
section 14). Revision 3 folds in everything from the later drafts: a CRM wired
to the public website (`krysalis-gate`) through n8n webhooks, onboarding at
both ends, and the three-way experience pivot — individual client, business
client, employee — resolved with route groups and per-account composition
rather than a client-side layout switcher (changes log, items 21–26).
---
## 0. How to use this document
This spec is written to be executed by Claude Code over multiple sessions without
drift. Three rules govern everything below:
1. Read the whole document before writing code. Sections 5 (design rules), 8 (schema),
   and 13 (milestones) are load-bearing.
2. Section 5.1 ("Hard rules") overrides any conflicting instinct, library default,
   or pattern from training. If a choice is not covered there, follow the spirit:
   restrained, specific, human-made.
3. Milestones in section 13 run in order. Each one ends with a working build
   (`npm run build` passes, `npx tsc --noEmit` clean) and a short written report.
   Do not start the next milestone with the previous one red.
When this spec conflicts with the existing V1 code, this spec wins — but report the
conflict rather than silently rewriting.
---
## 1. Product summary
Krysalis is the internal operating system of a professional-services firm. It replaces
five disconnected tools with one platform:
- a **CRM** that receives discovery-call bookings straight from the public website,
  lets any employee claim them off a Bounty Board in chat, and tracks each deal
  from first call to signed engagement (replaces a separate sales tool),
- a **task marketplace** where signed client work is posted with transparent economics
  and employees bid for a share of the payout (replaces Upwork-style freelancer tools),
- a **departmental academy** of structured courses tied to an XP and tier system
  (replaces Skool),
- **contextual messaging** scoped to departments and live jobs, with an AI "Shadow"
  that drafts progress updates for leads to approve (replaces Slack),
- a **vault and knowledge graph** that turns delivered work into an explorable map of
  who built what, with whom, for which client (the "Second Brain").
Onboarding is built in at both ends: new employees get a derived first-week
checklist that walks them into the academy and their department channel, and
newly won clients get a start-here orientation the first time they open the
portal.
**The ecosystem.** Krysalis ships as three isolated surfaces. `krysalis-gate`
(separate repo, already built — its README is the contract) is the public
marketing site with a portfolio, FAQ chatbot, and discovery-call booking. This
repo is **Krysalis OS**: the employee hub and the client portal, two route
groups in one app. The only bridge between surfaces is **n8n**: the website
never calls the platform and the platform never calls the website — every
cross-system message is an HMAC-signed webhook through n8n (section 7.12). No
shared code, packages, or databases. One loop ties the whole business together:
```
visitor books on the website → n8n → signed webhook into Krysalis OS
→ booking card lands on the Bounty Board (#new-business channel)
→ first employee to claim it owns the call; OS notifies n8n, which swaps
  the meeting host → a CRM deal opens under the claimer
→ deal advances INBOUND … WON → account converts: portal access provisioned,
  engagement posted to the marketplace → bids, delivery, vault, graph
```
The interface pivots entirely on identity — three experiences, one codebase,
two token scopes. Employees land in a dense, dark, forest-toned workspace (the
**Metapod** theme). Clients land in a calm, light, lavender-toned portal (the
**Butterfree** theme) that composes itself differently by account kind:
**business clients** get a relationship view — engagement figures, their
Krysalis contact, a message thread — while **individual clients** get a lighter,
faster page built around a three-step setup strip and self-service delivery.
Same components, same tokens; what changes is density and composition (7.8).
The naming runs on one metaphor — metamorphosis — and the design language should
take it seriously: the employee hub is the chrysalis (interior, dense, working),
the client portal is the emergence (light, finished, presentable).
---
## 2. Current state (V1) and what V2 delivers
### What exists today
V1 is a frontend-only mockup. Locked stack (from `package-lock.json` — pin these,
do not upgrade majors mid-build):
| Package | Version |
|---|---|
| next | 16.2.9 (App Router) |
| react / react-dom | 19.2.7 |
| tailwindcss / @tailwindcss/postcss | 4.3.0 |
| typescript | 5.9.3 |
V1 surfaces, per the existing README: `/login` (dual-entry gateway with live theme
toggle), `/dashboard` (tabbed employee workspace: Collaboration Deck, Forum Feed,
The Vault, Agent Control), `/client-portal` (info bar, markdown guide, shared
assets), `/settings` (role-gated editors), and a floating demo role-switcher pill.
All state is client-side mock data in `lib/`. Themes are CSS variable scopes
`.theme-employee` / `.theme-client` in `app/globals.css`. No backend, no env vars.
### What V2 delivers
V2 turns the mockup into a working system:
1. Real persistence: PostgreSQL + Prisma, with the corrected schema in section 8.
2. Type-safe Server Actions for every mutation (catalog in section 9), with
   optimistic UI where it matters.
3. Every feature area in section 7 implemented end to end against seeded,
   hand-authored data — including the CRM, onboarding at both ends, and the
   business/individual portal compositions, new in this revision.
4. The gate loop: one signed inbound webhook receives website bookings as
   bounty cards in chat; claiming opens a CRM deal and notifies n8n (7.12). A
   `simulate:booking` script exercises the whole loop with no n8n in sight.
5. A finished design system: the token tables, typography, and voice rules in
   section 5, applied everywhere — including a purge of every emoji and placeholder
   left over from V1.
6. Tabs promoted to real routes for deep-linking (section 6).
V2 keeps: the two-theme token architecture, the app shell concept, the demo
role-switcher pill, mock authentication (a persona cookie — see 7.10).
---
## 3. Changes from the original draft, and why
A log of every deliberate departure from the first PRD, so nothing reads as an
accident:
1. **Prisma generator fixed.** `prisma-client-react-19` is not a real provider;
   use `prisma-client-js`.
2. **GraphNode / GraphEdge tables removed.** The knowledge graph is *derived* from
   real relations (memberships, assignments, deliveries) at request time in
   `lib/graph/build.ts`. Materialized graph tables duplicate truth and drift from it.
3. **pgvector deferred to V3.** `Unsupported("vector(1536)")` adds extension and
   migration friction with no V2 consumer. Vault search in V2 is keyword filtering;
   the schema leaves a clear seam for embeddings later.
4. **`BIDDING` status removed.** A job with zero bids versus six is a count, not a
   state. The machine is `OPEN → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED`.
5. **Money fields renamed** to the words the UI will actually print:
   `proposedPayToFirm → grossValue`, `memberPayoutBudget → workerPool`,
   `companyNetBenefit → firmMargin`. Invariant enforced: `workerPool + firmMargin
   = grossValue`.
6. **Channel model added.** The draft had `Message.channelId` pointing at nothing.
   Channels are typed (DEPARTMENT, JOB, DM) with derived or explicit membership.
7. **Job–client relation rebuilt around `Account`.** The draft's `Job.clientId`
   pointed at no relation, and modeling clients as bare users assumes one
   contact per company. V2 introduces `Account` (the client company):
   `Job.accountId` relates to it, CLIENT users link to their account for portal
   scoping, and the CRM (item 15) hangs off the same table.
8. **Lesson ordering and completion tracking added.** `Module.order`,
   `Lesson.order`, and a `LessonCompletion` table so XP awards are idempotent and
   progress is computed, not asserted.
9. **Forum modeled.** V1 has a Forum Feed surface; the draft schema didn't. Added
   `ForumPost` (with replies) so V2 doesn't regress a V1 feature.
10. **Portal content modeled.** The client portal's editable guide and info bar
    (Moderator tools) now persist: `PortalGuide`, `InfoBarMessage`.
11. **XP ledger added.** `XpEvent` makes every award auditable and powers the
    profile "performance record" with real history instead of a single mutable number.
12. **`activityScore` dropped from User.** Activity is a windowed query
    (section 7.7), not a stored float that goes stale.
13. **AI Shadow specified as an interface** with a deterministic default
    implementation. It works offline and produces real drafts from real job data;
    a model-backed adapter is an optional env-gated upgrade (7.3).
14. **Language cleanup.** "Sovereign Corporate Ecosystem", "cryptographic workspace
    instance", and similar phrases are gone. The spec — and the product copy — use
    plain words. This is part of the brief: software written in inflated language
    reads as machine-made.
15. **CRM domain added** (`Account`, `Contact`, `Deal`, `DealActivity`). The gate
    repo's README specifies a Bounty Board flow — bookings posted into OS chat,
    first claim wins, n8n swaps the meeting host — but nothing on the platform
    side existed to receive it. The CRM is that receiving end plus the pipeline
    that follows: booking → claim → deal → won → engagement in the marketplace.
16. **`BookingCard` model, `FIRM` channel kind, and a "Gate" system user added.**
    Booking cards are structured rows rendered inline in the firm-wide
    `#new-business` channel, posted under the Gate persona (the website's voice
    inside the OS). The chrysalis glyph stays reserved for the Shadow.
17. **One inbound route handler added** — `app/api/hooks/booking` — as the sole
    exception to the actions-only rule, because third parties cannot invoke
    Server Actions. Its HMAC contract mirrors the gate exactly: same
    `X-Krysalis-Signature` header, same shared secret, same `MOCK_WEBHOOKS`
    semantics (7.12).
18. **Onboarding modeled as derived state.** The first-week checklist is computed
    from real rows (profile fields, lesson completions, messages sent) plus a
    single `onboardingCompletedAt` timestamp — no task tables to drift out of
    sync, the same philosophy as the graph (item 2).
19. **`XpReason` extended** with `DEAL_WON` and `ONBOARDING_COMPLETED`; amounts in
    the 7.2 table. Selling and settling in are work too.
20. **`Department.onboardingCourseId` added** to designate each department's
    primer course, which the first-week checklist points new hires at.
21. **Three client experiences, one architecture.** The latest draft proposed a
    single client-side `UXPivotContainer` that state-toggles three full
    layouts. Rejected as a component: identity is resolved **on the server**
    from the persona cookie (no theme flash — already a §12 gate), route groups
    own the scopes, and the portal composes by `Account.kind`
    (INDIVIDUAL | BUSINESS). A triple-layout client component would ship three
    dashboards in one bundle, break the ~200-line component rule, and put
    identity behind a toggleable client state. The instant-preview behavior the
    draft wanted already exists as the demo role-switcher pill, which now
    carries five personas (7.10).
22. **Account threads added** (`ChannelKind ACCOUNT`) — the honest version of
    the draft's "AI support chat widget" and "book a QBR" modules. One thread
    per active account: portal users on one side, the owning employee and
    admins on the other, reusing the entire channel stack. The Shadow never
    auto-answers clients; "Request a review call" is a prefilled message, not a
    calendar integration (which stays on the V3 shelf).
23. **Enterprise theater deferred.** SLA health meters, MSA/procurement
    tracking, data-migration progress bars, loyalty points, and in-portal QBR
    scheduling have no real data source in V2 — rendering invented meters
    violates the spirit of 5.1.8. All on the V3 shelf; what ships instead is
    real: engagement figures from actual jobs, a named contact from the won
    deal, a live thread.
24. **Onboarding template tables rejected, again.** The draft reintroduced
    `OnboardingTemplate` / `UserOnboardingStep`. The ruling in item 18 stands:
    checklists are derived from real rows plus timestamps. The individual-client
    setup strip (7.13) runs on three nullable timestamps — still no task tables.
25. **`crmStage` string on User superseded.** "LEAD / ONBOARDING / ACTIVE /
    CHURNED" as a free string on the person is the wrong shape twice over; the
    typed pair `Account.status` + `Deal.stage` already carries it on the right
    entities.
26. **Draft regressions noted.** The latest draft re-included `BIDDING`,
    `activityScore`, the `GraphNode`/`GraphEdge` tables, and a `Message.channelId`
    pointing at nothing. The original rulings (items 1–14) stand unchanged.
---
## 4. Users, roles, and permissions
`SystemRole`: `USER`, `MODERATOR`, `EMPLOYEE`, `CLIENT`, `ADMIN`.
| Capability | EMPLOYEE | MODERATOR | ADMIN | CLIENT | USER |
|---|---|---|---|---|---|
| View employee hub (dashboard routes) | yes | yes | yes | no | no |
| View client portal | no | no | yes (preview) | yes | no |
| Place / withdraw bids | yes | yes | yes | no | no |
| Create jobs, accept/reject bids, approve completion | no | no | yes | no | no |
| Mark own job delivered (submit for review) | assigned workers | assigned workers | yes | no | no |
| Enroll, complete lessons | yes | yes | yes | no | no |
| Post in channels / forum | yes | yes | yes | no | no |
| Approve / discard Shadow drafts | job workers | yes | yes | no | no |
| Edit portal guide + info bar | no | yes | yes | no | no |
| Change user roles / departments | no | no | yes | no | no |
| Upload vault assets, toggle social sharing | yes | yes | yes | no | no |
| View CRM (pipeline, accounts, bounty board) | yes | yes | yes | no | no |
| Claim booking cards (first claim wins) | yes | yes | yes | no | no |
| Create deals; edit own deals; log activity | yes | yes | yes (any deal, reassign owner) | no | no |
| Mark a deal won / lost | own deals | own deals | any deal | no | no |
| Convert a won deal (provision portal user, draft job) | no | no | yes | no | no |
| Add employees (starts their onboarding) | no | no | yes | no | no |
| Post in account threads | owned accounts | owned accounts | any | own account only | no |
`USER` is a parked default for accounts not yet provisioned; they see a single
"awaiting assignment" screen. `MODERATOR` is an employee with content-editing
duties. Authorization is checked inside every Server Action (never only in the UI)
via a `requireRole` helper in `lib/auth.ts`.
---
## 5. Design system — the Field Guide
The brief in one line: **this product must look and read like it was built by a
small, opinionated human team — not generated.** Section 5.1 is the contract;
everything after it is the implementation.
The aesthetic position: a naturalist's field guide rendered as software. The
employee hub borrows from the interior of the chrysalis — dark, green-cast,
dense, instrument-like. The client portal borrows from the emerged butterfly —
porcelain light, lavender, editorial. Specimen labels, hairline rules, mono
numerals, one quiet flourish per hub. Nothing glows.
### 5.1 Hard rules (the anti-slop contract)
These are testable and absolute. Violating one is a bug.
1. **No emojis.** Anywhere. Not in UI, seed data, empty states, commit messages,
   comments, or docs. V1's lightning-bolt glyphs (U+26A1) are removed in M0 and replaced with the
   chrysalis mark (5.9) or a Lucide icon.
2. **No gradients on text or controls.** No gradient buttons, no gradient
   headings, no glassmorphism, no `backdrop-blur` cards, no colored glow shadows.
   The only two gradient-adjacent treatments in the entire product are the two
   signature elements in 5.9.
3. **Semantic tokens only.** No hex values, no Tailwind palette classes
   (`bg-slate-900`, `text-indigo-500`) in components. Every color comes from a
   `--color-*` custom property defined in `app/globals.css` under `.theme-employee`
   or `.theme-client`. This rule already existed in V1; V2 keeps it absolute.
4. **The specified type system only** (5.3). Never Inter, Roboto, Poppins,
   Space Grotesk, or system-ui as a visible face.
5. **No banned vocabulary in UI copy or seed content:** seamless, effortless,
   supercharge, unleash, unlock, empower, elevate, revolutionize, delightful,
   blazing, cutting-edge, "Oops", "Uh oh", "Hang tight", "Welcome back!".
   No exclamation marks in interface copy. Full voice rules in 5.7.
6. **No greeting banners.** The dashboard opens with state (date, open work,
   pending drafts), not "Good morning, Sarah!". Human tools — Linear, Things,
   a terminal — do not greet.
7. **No decorative illustration.** No undraw-style people-at-desks, no abstract
   blob art, no AI-generated imagery. Emptiness is handled typographically (5.7).
8. **No lorem ipsum and no faker output.** Every string a user can see comes from
   the hand-authored seed narrative (section 10) or real UI copy.
9. **Tables and lists for data, not card grids.** Cards are reserved for
   marketplace job postings and course tiles; everything tabular (bids, assets,
   leaderboards, users) is a real table with aligned mono numerals.
10. **One border radius scale** (5.4). Never an arbitrary `rounded-[13px]`.
11. **Both themes pass WCAG AA**: body text ≥ 4.5:1 against its surface,
    interactive states have visible non-color affordance, `:focus-visible` ring on
    everything operable.
12. **`prefers-reduced-motion` disables** the theme crossfade, graph drift, and
    all non-essential transitions.
### 5.2 Color tokens
Tokens live in `app/globals.css`. Both scopes define the *same names*; components
never know which theme they are in. Values below are final unless contrast
verification forces a nudge — if nudged, stay within the same hue family and note
it in the milestone report.
**`.theme-employee` — Metapod (dark, digital forest)**
| Token | Value | Use |
|---|---|---|
| `--color-bg-base` | `#0C100D` | App background. Green-cast near-black — never neutral `#000` or `#0A0A0A`. |
| `--color-bg-surface` | `#121813` | Panels, rails, table rows. |
| `--color-bg-raised` | `#1A211B` | Popovers, active cards, composer. |
| `--color-bg-inset` | `#090C0A` | Wells, code, input interiors. |
| `--color-line` | `#222C24` | Default hairline. Lines, not shadows, structure this theme. |
| `--color-line-strong` | `#33402F` | Emphasized dividers, table header rule. |
| `--color-text-primary` | `#E8EDE4` | Warm paper-green white. |
| `--color-text-secondary` | `#A6B2A1` | Supporting text, labels. |
| `--color-text-muted` | `#6E7B6C` | Timestamps, placeholders, disabled. |
| `--color-accent` | `#A9C46B` | Lichen. Primary actions, active nav, links. |
| `--color-accent-hover` | `#BCD482` | |
| `--color-accent-ink` | `#131A0D` | Text on accent fills. |
| `--color-accent-soft` | `#A9C46B1F` | Selected rows, active tab wash (12% alpha). |
| `--color-ok` | `#79BD8A` | Fern — success, COMPLETED. |
| `--color-warn` | `#D7A45C` | Amber bark — REVIEW, pending. |
| `--color-danger` | `#D67A64` | Clay — destructive, rejected. Not pure red. |
| `--color-info` | `#76A8B8` | Stream — informational. |
| `--color-gold` | `#D2B45F` | XP, tiers, earnings figures only. |
| `--shadow-raise` | `none` | This theme is flat; hairlines do the lifting. |
**`.theme-client` — Butterfree (light, tech lavender)**
| Token | Value | Use |
|---|---|---|
| `--color-bg-base` | `#F6F4FA` | Porcelain with a violet cast — never `#FFF` page background. |
| `--color-bg-surface` | `#FCFBFE` | Panels, cards. |
| `--color-bg-raised` | `#FFFFFF` | Popovers, modals (with `--shadow-raise`). |
| `--color-bg-inset` | `#EFEBF6` | Wells, input interiors, info bar track. |
| `--color-line` | `#E4DEF0` | Hairlines. |
| `--color-line-strong` | `#CFC6E3` | |
| `--color-text-primary` | `#241D38` | Ink plum. |
| `--color-text-secondary` | `#5B5274` | |
| `--color-text-muted` | `#8D84A6` | |
| `--color-accent` | `#6A58CF` | Lavender violet, used flat and sparingly. |
| `--color-accent-hover` | `#5947BD` | |
| `--color-accent-ink` | `#FFFFFF` | |
| `--color-accent-soft` | `#6A58CF14` | (8% alpha) |
| `--color-ok` | `#3F8F63` | |
| `--color-warn` | `#A97B22` | |
| `--color-danger` | `#B65A4C` | |
| `--color-info` | `#46789E` | |
| `--color-gold` | `#9C7F2E` | Darkened for light ground. |
| `--shadow-raise` | `0 1px 2px rgba(36,29,56,.06), 0 10px 28px rgba(36,29,56,.08)` | Raised cards only. Single soft shadow, never stacked glows. |
Why lavender doesn't read as AI-default here: it is the brief's own brand color,
it is used **flat** against warm porcelain and plum ink (no violet-to-blue
gradients, no dark-mode neon), and the client hub's personality comes from its
serif editorial voice, not from the accent.
### 5.3 Typography
Three faces, loaded with `next/font/google`, exposed as CSS variables:
| Role | Face | Weights | Where |
|---|---|---|---|
| UI / body | **Schibsted Grotesk** (`--font-ui`) | 400, 500, 700 | Everything by default. |
| Data / numeric | **Spline Sans Mono** (`--font-mono`) | 400, 500 | Money, XP, counts, timestamps, table numerics, code, IDs. Always `font-variant-numeric: tabular-nums`. |
| Editorial | **Newsreader** (`--font-serif`) | 400, 500 + italics | Client-portal guide prose, lesson long-form body, job descriptions. Never for UI chrome. |
Type scale (rem): `0.75 / 0.8125 / 0.875 / 1 / 1.25 / 1.625 / 2.25`. Body is
`0.875rem` in the employee hub (dense) and `1rem` in the client portal (airy).
Headings use Schibsted Grotesk 700 with tracking `-0.01em`; they are set close to
body size — hierarchy comes from weight, spacing, and the eyebrow pattern, not
from huge display text. The one display moment in the product is the login
masthead (`2.25rem`).
**Eyebrow labels** are the structural signature: `0.6875rem`, uppercase,
`letter-spacing: 0.08em`, `--color-text-muted`, mono face. They caption every
panel like a specimen label ("OPEN POSTINGS", "WORKER POOL", "FIELD NOTES").
### 5.4 Space, radius, line
- 4px base unit. Component padding from `{8, 12, 16, 24, 32}`. Dense rail
  rows may use 10px horizontal padding; all other component padding stays on
  the set (ruling, post-M1).
- Density: employee-hub table rows 36px, list rows 44px; client portal rows 52px.
- Radii: `--radius-s: 4px` (inputs, tags, buttons), `--radius-m: 8px` (cards,
  panels), `--radius-l: 12px` (modals, the portal masthead). Pills only for the
  role-switcher and status badges.
- Structure with 1px lines (`--color-line`), not shadows, in the employee hub.
  The client hub may use `--shadow-raise` on raised cards only.
- Max content width: employee hub is full-bleed with a 248px left rail; client
  portal centers at 760px reading measure.
### 5.5 Motion
- Durations: 140ms (hover/press), 220ms (panel/dropdown), 500ms (theme crossfade
  — already a V1 behavior, keep it).
- Easing: `cubic-bezier(0.2, 0, 0, 1)` everywhere. No bounces, no springs.
- Animate `opacity` and `transform` only. No layout-shifting entrances, no
  scroll-triggered reveals, no parallax.
- The graph view may drift gently while settling (7.6); it is the only ambient
  motion in the product and it stops under `prefers-reduced-motion`.
### 5.6 Iconography
`lucide-react`, configured once: `strokeWidth={1.5}`, sizes 16 (inline), 18
(nav/buttons), 20 (page headers) only. Icons inherit `currentColor`; they are
never decoratively colored, never paired with text in headings, and never used
where a word is clearer. No filled icon sets, no emoji-as-icon.
### 5.7 Voice and microcopy
Register: a competent colleague's shorthand. Plain verbs, sentence case, no
filler, no cheer. Buttons name the exact outcome and keep that name through the
flow ("Place bid" → toast "Bid placed").
| Situation | Wrong (slop) | Right |
|---|---|---|
| Save failure | "Oops! Something went wrong" (with a sweat-smile emoji) | "Couldn't save your bid. Check the amount and retry." |
| Empty channel | "Nothing to see here yet!" (with a party emoji) | "No messages yet. Anything posted here is visible to the Meridian rebrand team." |
| Empty job board | "No jobs found :(" | "No open postings in Engineering. New client work appears here as contracts are signed." |
| Bid placed | "Awesome! Your bid is in!" (with a rocket emoji) | "Bid placed — 1,200.00 of the 6,500.00 pool." |
| Greeting | "Welcome back, Sarah!" (with sparkles) | (none — show Thursday, June 12 and the work) |
| New-hire welcome | "Welcome aboard! Let's get you all set up" (with a rocket emoji) | "Three things before the floor opens." |
| Bounty claimed | "You got it! The lead is yours!" (with a party emoji) | "Claimed — the discovery call is yours. Deal opened under Halcyon Dental Partners." |
| Loading | "Hang tight, magic incoming…" | A skeleton row, or "Loading postings…" |
Errors say what happened and the next action, never apologize, never blame the
user. Empty states say what the space is for and offer the one action that fills
it. Confirmations echo the data ("Accepted June Park's bid — 1,800.00 assigned").
### 5.8 Data formatting
- Money: mono face, always two decimals, thousands separators, `$` prefix
  (`$6,500.00`). Negative or margin deltas in `--color-danger`/`--color-ok` text,
  never red/green fills.
- Dates: `Jun 12, 2026` in tables; `Thursday, June 12` as page context; relative
  time only inside chat (`14:32` same-day, `Jun 11, 14:32` otherwise). No
  decorative glyphs appended to timestamps; plain relative is fine in chat lists.
- People: full names everywhere; avatars are generated initials on a deterministic
  hue derived from the user id, using theme tokens — no photo placeholders.
- IDs and slugs render in mono.
### 5.9 Signature elements (the only two flourishes)
1. **Employee hub — canopy grain.** A fixed, full-viewport SVG `feTurbulence`
   noise overlay at 2.5% opacity plus a barely-perceptible radial darkening toward
   the corners. It makes the dark surfaces feel like material instead of flat hex.
   Implemented once in the employee layout; `pointer-events: none`.
2. **Client portal — wing hairline.** A single 1px rule under the portal masthead
   carrying a desaturated iridescent gradient (lavender → teal → rose at low
   saturation). This is the one gradient in the product.
Plus one recurring mark: the **chrysalis glyph**, a small inline SVG (a teardrop
cocoon outline, 14px, stroke 1.5, `currentColor`) that labels everything the
Shadow produced. It is the product's only piece of custom iconography.
### 5.10 Post-milestone design audit
After every UI milestone, run this check against live screens and include the
result in the milestone report:
1. Grep app/, components/, lib/, prisma/ for hex values, Tailwind palette
   classes, emoji codepoints, and banned vocabulary — all must return zero.
   Rule documents (PRD.md, docs/ui-contract.md) are exempt (ruling, post-M1).
2. Screenshot dashboard, a job detail, the pipeline, a lesson, a channel, and
   both portal compositions in their themes. Confirm: no gradients outside 5.9,
   hairline structure intact, mono numerals aligned, eyebrows present, focus
   rings visible.
3. Read every visible string on those screens aloud-in-your-head. Anything that
   sounds like a SaaS landing page gets rewritten per 5.7.
4. Keyboard-walk one full flow (place a bid) without a mouse.
---
## 6. Information architecture and routes
V1's dashboard tabs become routes (deep-linkable, shareable, back-button-correct).
The shell — left rail, top context bar, role-switcher pill — lives in layouts and
persists across navigation.
```
app/
  layout.tsx                     fonts, <body>, persona/theme resolution
  login/page.tsx                 dual-entry gateway (kept from V1, restyled)
  (employee)/
    layout.tsx                   .theme-employee scope, rail, canopy grain
    dashboard/page.tsx           today view: the command center (see below)
    dashboard/welcome/page.tsx               first-week checklist (7.13)
    dashboard/marketplace/page.tsx
    dashboard/marketplace/[jobId]/page.tsx
    dashboard/crm/page.tsx                   pipeline: table default, board toggle (7.11)
    dashboard/crm/accounts/page.tsx
    dashboard/crm/accounts/[accountId]/page.tsx
    dashboard/crm/deals/[dealId]/page.tsx
    dashboard/crm/bounties/page.tsx          unclaimed cards + claim history (7.12)
    dashboard/academy/page.tsx
    dashboard/academy/[courseId]/page.tsx
    dashboard/academy/[courseId]/lesson/[lessonId]/page.tsx
    dashboard/channels/page.tsx              redirects to first channel
    dashboard/channels/[channelId]/page.tsx
    dashboard/forum/page.tsx
    dashboard/vault/page.tsx
    dashboard/graph/page.tsx
    dashboard/leaderboards/page.tsx
    dashboard/people/[userId]/page.tsx       profile + performance record
  (client)/
    layout.tsx                   .theme-client scope, masthead + wing hairline
    client-portal/page.tsx
  api/hooks/booking/route.ts     the only route handler — inbound n8n webhook (7.12)
  settings/page.tsx              role-gated tiers (theme follows persona)
```
Left rail order: Today, Marketplace, CRM, Academy, Channels (with department/job
sub-list), Forum, Vault, Graph, Leaderboards. While a user's onboarding is
incomplete, a "First week" entry with a progress count ("2 of 3") sits at the
very top. Department channels nest under a "CHANNELS" eyebrow; job channels
under "ACTIVE JOBS"; `#new-business` sits alone under "FIRM"; account threads
the viewer can see nest under "CLIENTS".
**The Today view is the command center** the latest draft sketched as a
split-pane — delivered instead as one composed page of dense blocks, each
linking into its deep route: the date line, OPEN WORK (postings in the viewer's
department), PENDING DRAFTS (Shadow drafts awaiting their approval), PIPELINE
(deal counts by stage, mono figures, owner-filtered), UNCLAIMED BOUNTIES (count
+ the newest card), and RECENT ACTIVITY. The graph stays on its own route — it
is the one heavy bundle (§12) and does not belong on the landing screen.
Theme mechanics: the persona cookie (7.10) resolves to a user; the route-group
layout applies `.theme-employee` or `.theme-client` on a wrapper div, and the
portal composes by `Account.kind` (7.8) — identity is decided on the server,
never by client state. The 500ms crossfade on the login toggle is kept.
---
## 7. Feature specifications
### 7.1 Marketplace
**Board** (`/dashboard/marketplace`): filter by department and status; default
shows OPEN. Each posting card shows title, client, department, due date, and the
economics strip — three mono figures under eyebrows: GROSS / WORKER POOL / MARGIN.
The transparency is the point; do not hide the firm's margin from employees.
**Job detail**: serif description, economics strip, bid table (bidder, split,
pitch, status, placed-at), worker list once assigned, the job's channel link, and
delivered vault assets.
**Status machine** — transitions are Server Actions with role checks:
| From → To | Trigger | Who |
|---|---|---|
| (create) → OPEN | `createJob` | ADMIN |
| OPEN → ASSIGNED | `acceptBid` (one or more); admin closes bidding | ADMIN |
| ASSIGNED → IN_PROGRESS | `startJob` | any assigned worker or ADMIN |
| IN_PROGRESS → REVIEW | `submitForReview` | any assigned worker |
| REVIEW → IN_PROGRESS | `requestChanges` (with note) | ADMIN |
| REVIEW → COMPLETED | `approveCompletion` | ADMIN |
**Bidding rules:** one bid per member per job (`@@unique`); `proposedSplit` must be
> 0 and ≤ the unallocated remainder of `workerPool`; bids editable while PENDING;
accepting a bid creates the `JobMember`, sets status ACCEPTED, awards XP, and —
if the job was OPEN — flips it to ASSIGNED and provisions the job channel.
Placing a bid uses `useOptimistic` (the bid row appears instantly, reconciles on
the action result).
**Completion effects** (one transaction): set `completedAt`; for each worker,
increment `totalEarnings` by their accepted split and write a `JOB_COMPLETED`
`XpEvent`; recompute tiers; the job's assets and members become graph edges
automatically (because the graph is derived).
**Money invariants**, enforced in `lib/money.ts` and re-checked in actions:
`workerPool + firmMargin === grossValue`; `Σ accepted splits ≤ workerPool`.
All arithmetic on Prisma `Decimal`, never floats.
### 7.2 Academy
Course catalog grouped by department; tiles show title, module/lesson counts,
and the viewer's progress as a thin token-colored bar (no rings, no donuts).
**Classroom** (`/dashboard/academy/[courseId]`): two-pane. Left: ordered module
outline with per-lesson completion ticks. Center: lesson title, serif markdown
body, optional asset link, and one button — "Mark lesson complete" → becomes
"Completed Jun 12" (muted, with tick). Completion is idempotent via
`LessonCompletion`; the course's `Enrollment.progressPct` is recomputed from
completions, and finishing the last lesson also writes `COURSE_COMPLETED`.
**XP and tiers** (constants in `lib/xp.ts`, single source of truth):
| Event | XP |
|---|---|
| Lesson completed | 15 |
| Course completed | 100 |
| Bid accepted | 40 |
| Job completed (per worker) | 120 |
| Deal won (owner) | 150 |
| Onboarding completed | 50 |
| Forum post or reply | 5 (max 25/day) |
| Tier | Name | Threshold |
|---|---|---|
| 1 | Larva | 0 |
| 2 | Instar | 250 |
| 3 | Chrysalis | 750 |
| 4 | Eclosion | 1,500 |
| 5 | Imago | 3,000 |
Tier names render as small mono badges next to names (gold token). On tier-up,
show a quiet toast ("Tier 3 — Chrysalis") — no confetti, no modal.
**Profile / performance record** (`/dashboard/people/[userId]`): tier, XP,
earnings, completed jobs (with clients), courses finished, and a reverse-chrono
ledger from `XpEvent`. This page is what the leaderboards link into.
### 7.3 Channels and the Shadow
Channel kinds: DEPARTMENT (one per department, created in seed), JOB (created
automatically when a job becomes ASSIGNED, archived visually when COMPLETED),
DM (explicit `ChannelMember` rows), FIRM (firm-wide; membership derived as
every EMPLOYEE/MODERATOR/ADMIN), and ACCOUNT (one per ACTIVE account, created
at conversion — the client-facing thread, 7.8; membership derived as the
account's portal users + the owning employee + workers on the account's
non-COMPLETED jobs + admins — ruling, post-M1). One FIRM channel ships
in V2: `#new-business`, home of the Bounty Board (7.12) — booking cards render
inline there as structured messages. Membership for DEPARTMENT/JOB is likewise
derived (department members; assigned workers + admins). ACCOUNT threads list
on the employee rail under a "CLIENTS" eyebrow for their owner and admins, and
render inside the portal for clients; they are the only channels a CLIENT can
see or post in.
**Chat view**: day-grouped messages, sender name + time, composer pinned at
bottom. Sending uses `useOptimistic`. Freshness via polling: a client hook calls
a `fetchMessagesAfter(channelId, cursor)` action every 5s, paused on
`document.hidden`. SSE/websockets are explicitly V3 — do not add a realtime dep.
**The Shadow** is the AI presence and it must be honest about being a draft
machine, not a chat gimmick:
- `lib/shadow/types.ts` defines `interface ShadowAgent {
  draftProgressUpdate(jobId: string): Promise<ShadowDraft> }`.
- `lib/shadow/deterministic.ts` is the default implementation: it reads strictly
  job data — status, % of pool allocated, days to due date, latest delivered
  assets, and the last 10 messages — and assembles a 3–5 sentence progress update
  from composed sentence templates. Same input, same output. No network.
- `lib/shadow/anthropic.ts` (optional, M8 stretch): if `ANTHROPIC_API_KEY` is set,
  a model-backed adapter replaces the deterministic one behind the same interface.
  The build must never require the key.
Flow: in a JOB channel, workers see a "Draft update" affordance → action creates a
`Message` with `isShadowDraft: true`, sender = the seeded Shadow system user.
Drafts render inset with the chrysalis glyph, visible only to job workers/admins,
with Approve / Edit / Discard. Approving stamps `approvedById`, clears the draft
flag, and the message becomes visible to the channel, attributed "Shadow · approved
by Daniel Okafor" in muted text. Discard deletes it.
"Agent Control" from V1 becomes the dashboard's "Pending drafts" block plus the
per-channel affordance — not a separate fake-agent showcase.
### 7.4 Forum
Single firm-wide feed with optional department tag. Posts: optional title, body
(plain text with line breaks; no markdown editor), replies one level deep.
Reverse-chrono, no votes, no reactions in V2. Posting awards capped XP (7.2).
### 7.5 Vault
A real table: title, type tag (pdf / doc / sheet / image / figma / link), linked
job, uploaded-by, date, size, and a "Commons" toggle (`isSharedSocial`) that
exposes the asset to every employee rather than just the job team. Filters:
type, department (via job), commons-only. "Upload" in V2 collects metadata +
an external URL — file storage is V3; the form says so plainly.
The client portal's shared-assets panel shows assets from the account's jobs
where `isSharedSocial` is true OR the job is theirs and status is REVIEW/COMPLETED.
### 7.6 Knowledge graph
`/dashboard/graph` renders the firm as a force-directed map, derived at request
time by `lib/graph/build.ts`:
- Nodes: departments, employees, jobs, client accounts, and commons/delivered
  assets. Typed sizes (department 28, job 20, person 16, asset 12) and token
  colors (line-strong, accent, text-secondary, warn for in-flight jobs, ok for
  completed). Prospect accounts with no jobs stay off the map — the graph is
  delivery topology; the pipeline lives in the CRM.
- Edges: person—department (membership), person—job (worked on), account—job
  (commissioned), asset—job (delivered). No pairwise person—person
  "collaborated" edges — collaboration is legible through shared job nodes, and
  pairwise edges turn 24 people into a hairball.
- Layout: `d3-force` only (the single permitted viz dependency); rendering is
  plain React SVG. Pan (drag), zoom (wheel, 0.5–2.5×), hover highlights the
  1-hop neighborhood and fades the rest to 25% opacity, click opens a right-side
  inspector with the node's facts and links into the app.
- Cap 300 nodes; beyond that, collapse assets first. Simulation settles and
  stops; gentle drift only while settling.
### 7.7 Leaderboards
Three boards, each a ranked table (rank in mono, name, figure, spark-less — no
charts), with an All-time / 90-day toggle where noted:
1. **Jobs executed** — count of the member's `JobMember` rows on COMPLETED jobs.
   Toggle: all-time / last 90 days (by `completedAt`).
2. **Gross value worked** — sum of `grossValue` across the member's COMPLETED
   jobs. Label it exactly that; on team jobs every worker is credited the full
   gross, and the column header's tooltip says so. Honest labeling beats fake
   precision.
3. **Knowledge contributors** — trailing 30 days: messages sent (excluding
   Shadow drafts) + 3×forum posts + 2×lesson completions.
Computed by indexed queries in `lib/leaderboards.ts`; no stored scores.
### 7.8 Client portal
One theme, two compositions, switched by `Account.kind` on the server. Shared
foundation at 760px measure: masthead (firm name, wing hairline), rotating info
bar (active `InfoBarMessage` rows, 8s interval, pausable, reduced-motion shows
them stacked), the guide (`PortalGuide.markdown` rendered in Newsreader), and
the shared-assets panel (7.5). Jobs, assets, and the thread are scoped by the
session user's `accountId`. On both compositions: no XP, no margins, no
internal vocabulary — `firmMargin`, deal stages, and pipeline language never
render here.
**Business composition** (the relationship view):
- A figures row in mono under eyebrows — ENGAGEMENTS COMPLETED / IN FLIGHT /
  TOTAL INVESTED (sum of `grossValue` on their COMPLETED jobs; what they paid
  is theirs to see — what the firm kept is not).
- The contact card: the owning employee from the won deal (name, title, email),
  else the managing director. The draft called this a CSM; here it is simply a
  person.
- The engagements table with status in plain words ("In review with our team").
- The start-here orientation panel on first visits (7.13).
- **Messages**: the account thread (7.3) — day-grouped, same composer and 5s
  poll as the hub. Beside the composer, one quiet "Request a review call"
  affordance that prefills the composer ("We'd like to schedule a review call.")
  — a message a person answers, not a calendar integration.
**Individual composition** (the lighter, faster view):
- The three-step setup strip (7.13) until finished, then a single muted
  "Set up · completed Jun 12" line.
- One engagement card (individual clients rarely carry more than one job) with
  status in plain words and its delivered assets inline — self-service delivery
  without a separate "delivery center".
- **Messages**, prominent — for a client of one, the thread is the relationship.
- No figures row, no contact card panel (the contact's name appears in the
  thread itself); density stays low on purpose.
### 7.9 Settings
Tiered by role, as in V1: everyone sees their profile (name, title — email and
role read-only); MODERATOR adds the guide editor (textarea + live Newsreader
preview, autosaved draft, explicit "Publish guide") and the info-bar manager
(reorder, toggle, edit rows); ADMIN adds the user matrix (table: name, email,
department select, role select — changes via action with confirmation echoing
the change).
### 7.10 Authentication (mock, by design)
V2 keeps demo auth: the login form accepts anything and sets an httpOnly cookie
`krysalis_persona` containing a seeded user id; `lib/auth.ts#getSessionUser()`
reads it server-side. The role-switcher pill swaps the cookie between five
seeded personas (admin, moderator, employee, business client, individual
client) and refreshes — this is the live three-way pivot, demonstrable in two
clicks. A one-line comment marks this insecure-by-design seam where Auth.js
lands in V3.
### 7.11 CRM — accounts, contacts, deals
The CRM is deliberately small: the rows a six-person firm actually touches,
nothing it doesn't. Three nouns — **Account** (the company), **Contact** (a
person there), **Deal** (one pursuit, with an owner and a stage) — plus an
activity log.
**Pipeline** (`/dashboard/crm`): the default view is a dense table — deal,
account, owner, stage badge, value in mono (em dash until set), source, age,
last activity — sortable, filterable by stage and owner. A "Board" toggle shows
the six stage columns; entries inside columns are single-line rows (deal title,
value, owner initials), not fat cards. Rule 5.1.9 holds either way: the board is
a grouping, not a card grid.
**Stages** (`DealStage`): `INBOUND → DISCOVERY → PROPOSAL → VERBAL → WON | LOST`.
Movement is free between the four working stages (real pipelines jump around);
two transitions carry rules, enforced in `lib/crm.ts` and re-checked in actions:
- **→ WON** requires `value` to be set (a deal cannot be won without a number),
  stamps `wonAt`, and writes a `DEAL_WON` XpEvent for the owner.
- **→ LOST** requires a plain-sentence reason, stored on the deal and echoed as
  a `STAGE_CHANGE` activity.
Every stage move writes a `STAGE_CHANGE` activity row automatically, so the deal
page reads as a history without anyone maintaining one.
**Deal detail** (`/dashboard/crm/deals/[dealId]`): header with title, account
link, owner, stage rail (the six stages as a horizontal track, current one
filled); facts column (value, source, expected close, linked booking card if it
came from the website, linked job once converted); the activity log
(reverse-chrono, kind tag in mono — NOTE / CALL / EMAIL / MEETING / STAGE
CHANGE — author, body, date) with a composer; and the contact card.
**Account detail** (`/dashboard/crm/accounts/[accountId]`): status (PROSPECT /
ACTIVE / DORMANT), website, notes, contacts table, deals table, jobs table
(once any exist), and — for ACTIVE accounts — the portal users attached to it.
**Converting a won deal** is the seam between selling and delivering, and it is
ADMIN-gated (job creation already is, per section 4). On a WON deal, an admin
sees "Convert to engagement": one panel that (a) flips the account to ACTIVE
and provisions its message thread (7.3), (b) optionally provisions a CLIENT
portal user from the primary contact's name
and email (mock auth — no invitation machinery in V2), and (c) opens the
create-job form prefilled with the deal's account, a title derived from the deal,
and `grossValue` = the deal's value. The account's kind (INDIVIDUAL or
BUSINESS) is set here if it arrived ambiguous from the website — bookings carry
a company string, so cards default the account to BUSINESS; the converting
admin corrects it for solo clients. The created job stores `dealId`, so the
graph, the marketplace, and the CRM all agree about where the work came from.
Manual entry exists for the non-website world: "New deal" accepts an existing
account or a new account name + contact, a title, source (REFERRAL / OUTBOUND /
EVENT), and optional value — so the pipeline is never hostage to the webhook.
### 7.12 The Bounty Board and the gate webhooks
The gate repo's README defines the contract; this section is the platform half
of it. Everything crosses through n8n, signed; the two repos never speak
directly.
**Inbound — booking received.** `POST /api/hooks/booking` is the only route
handler in the app (Server Actions cannot receive third-party POSTs). n8n
relays a confirmed website booking:
```json
{
  "bookingId": "bk_8f31c2",
  "slotStart": "2026-06-18T15:00:00.000Z",
  "slotEnd":   "2026-06-18T15:30:00.000Z",
  "name": "Rosa Calloway",
  "email": "rosa@halcyondental.com",
  "company": "Halcyon Dental Partners",
  "companySize": "11-50",
  "automationGoal": "Front desk spends two hours a day on appointment reminders and reschedules.",
  "submittedAt": "2026-06-12T09:14:00.000Z"
}
```
The handler: (1) verifies `X-Krysalis-Signature` — hex HMAC-SHA256 of the raw
body with `N8N_WEBHOOK_SECRET`, compared timing-safe via `lib/hmac.ts`
(`node:crypto`, no new dependency) — 401 on mismatch; (2) zod-parses, 422 on
failure; (3) **upserts** a `BookingCard` on `externalRef = bookingId`, so n8n
retries are harmless; (4) posts a `Message` to `#new-business` linked to the
card, sender = the **Gate** system user; (5) `revalidatePath` on the channel
and bounties routes; (6) returns `{ "ok": true }`. The 5s channel poll carries
the card to everyone watching.
**The card in chat**: a surface panel with a 2px left rule in `--color-accent`,
a "NEW BUSINESS" eyebrow, the company name at 1rem/700, the goal excerpt
(two lines, then truncation), the slot in mono ("Jun 18, 15:00–15:30"), and one
button — "Claim". The same cards list at `/dashboard/crm/bounties` (unclaimed
first, then recent claims). No chrysalis glyph here; that mark is the Shadow's.
**Claiming — first claim wins, atomically.** `claimBookingCard` runs a
conditional update (`status = UNCLAIMED → CLAIMED`, set `claimedById`,
`claimedAt`); if zero rows match, the action returns
`ok: false, "Already claimed by June Park."` In the same transaction it opens
the CRM thread: find-or-create the `Account` by case-insensitive name (repeat
visitors attach to their existing account), create the `Contact`, create a
`Deal` (title "Halcyon Dental Partners — discovery", stage DISCOVERY, source
WEBSITE, owner = claimer, booking card linked), and post a follow-up message
("Claimed by June Park — deal opened."). Claiming is deliberately **not**
optimistic: two people will race this button, so it shows a pending state and
the result is authoritative. The card's claimed state replaces the button with
"Claimed by June Park · Jun 12, 14:08" in muted mono.
**Outbound — claim notification.** After the transaction commits, the action
POSTs to `N8N_CLAIM_WEBHOOK` —
`{ "bookingId", "claimedBy": { "name", "email" }, "claimedAt" }` — signed with
the same header and secret, so n8n can verify provenance and swap the meeting
host (per the gate README, the platform's responsibility ends at this signed
call). A failed call never rolls back the claim: the error is stored on the
card (`lastWebhookError`), surfaced to admins with a "Resend to n8n" action.
**Environment & mock mode** (mirrors the gate exactly): `N8N_WEBHOOK_SECRET`
and `N8N_CLAIM_WEBHOOK` are server-only; `MOCK_WEBHOOKS` unset means mock
everywhere except production, `"true"` forces mocks, `"false"` forces real
calls. Mocked outbound logs the signed payload and succeeds. For development
and demos, `npm run simulate:booking` (a `tsx` script) signs a sample payload
and POSTs it to the local handler — the entire loop, card to claim to deal, runs
with no n8n anywhere.
### 7.13 Onboarding — first week and start here
**Employees: the first week.** A new account (created by an admin via "Add
employee" in settings, or seeded) has `onboardingCompletedAt = null`. Until it
is stamped, the rail shows "First week · 2 of 3" at the top, and the first
dashboard visit of a session lands on `/dashboard/welcome` (a session cookie
prevents repeat redirects; nothing is walled off — every route stays
reachable).
The welcome page is a field-guide page, not a wizard: the date, a one-line
brief ("Three things before the floor opens."), and a checklist **derived
entirely from real rows** — no task tables:
1. **Confirm your entry** — name and title present on the profile; editable
   inline.
2. **Read your department primer** — enrolled in the department's designated
   onboarding course (`Department.onboardingCourseId`) with at least one lesson
   completed; links straight into the classroom.
3. **Check in with your department** — at least one message sent by you in your
   department channel.
Below the checklist, a short orientation in Newsreader: how the marketplace
works, how XP and tiers work, where the vault lives — five paragraphs a person
would actually read. When all three checks pass, "Finish setup" enables; the
action re-verifies server-side, stamps `onboardingCompletedAt`, and writes a
single `ONBOARDING_COMPLETED` XpEvent (guarded by the null timestamp — never
twice). The rail entry disappears. No confetti; the quiet tier-style toast:
"Setup complete — 50 XP."
**Clients: start here.** Two shapes, by account kind, both running on nullable
timestamps — no task tables (changes log, item 24).
*Business accounts:* the first time a portal user signs in
(`portalStartDismissedAt = null`), a panel sits above the guide: addressed to
the account ("For Halcyon Dental Partners"), naming their Krysalis contact (the
owner of the won deal that converted them, else the managing director), and
three short Newsreader paragraphs — what this portal shows, how review and
approval work, how to reach the team. One quiet "Dismiss" link stamps the field.
The panel is the won-deal handoff made visible: conversion (7.11) provisions the
user, and this is what greets them.
*Individual accounts:* a three-step setup strip at the top of the portal, each
step a verifiable stamp on the user row:
1. **Confirm your details** — name shown, one inline edit, "Confirm" stamps
   `detailsConfirmedAt`.
2. **How this works** — the same orientation content as the business panel,
   condensed; "Got it" stamps `portalStartDismissedAt`.
3. **Review your engagement brief** — links to their job's description;
   "Mark as reviewed" stamps `briefReviewedAt`.
Steps complete in any order; the strip shows ticks, then collapses to one muted
line. No XP, no reward — clients are not in the tier system, and loyalty
points are on the V3 shelf (changes log, item 23).
---
## 8. Data model
`prisma/schema.prisma`, complete and final for V2. PostgreSQL locally via the
provided `docker-compose.yml` (postgres:17-alpine, healthcheck, volume) or any
hosted Postgres; `DATABASE_URL` in `.env` (with a committed `.env.example`).
Prisma: latest stable (developed against 6.x), classic `prisma-client-js`
generator, client singleton in `lib/db.ts`.
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
enum SystemRole {
  USER
  MODERATOR
  EMPLOYEE
  CLIENT
  ADMIN
}
enum JobStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  REVIEW
  COMPLETED
}
enum BidStatus {
  PENDING
  ACCEPTED
  REJECTED
}
enum ChannelKind {
  DEPARTMENT
  JOB
  DM
  FIRM
  ACCOUNT
}
enum XpReason {
  LESSON_COMPLETED
  COURSE_COMPLETED
  BID_ACCEPTED
  JOB_COMPLETED
  DEAL_WON
  ONBOARDING_COMPLETED
  FORUM_POST
}
enum AccountStatus {
  PROSPECT
  ACTIVE
  DORMANT
}
enum AccountKind {
  INDIVIDUAL
  BUSINESS
}
enum DealStage {
  INBOUND
  DISCOVERY
  PROPOSAL
  VERBAL
  WON
  LOST
}
enum DealSource {
  WEBSITE
  REFERRAL
  OUTBOUND
  EVENT
}
enum ActivityKind {
  NOTE
  CALL
  EMAIL
  MEETING
  STAGE_CHANGE
}
enum BookingStatus {
  UNCLAIMED
  CLAIMED
  ARCHIVED
}
// ── Identity ────────────────────────────────────────────────
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  name         String
  title        String?     // e.g. "Senior Engineer" — shown on profiles
  role         SystemRole  @default(USER)
  isSystem     Boolean     @default(false) // the Shadow and Gate personas
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  accountId    String?     // CLIENT users: the company they belong to
  account      Account?    @relation("AccountUsers", fields: [accountId], references: [id], onDelete: SetNull)
  experiencePoints Int     @default(0)
  currentTierLevel Int     @default(1)
  totalEarnings    Decimal @default(0) @db.Decimal(12, 2)
  onboardingCompletedAt  DateTime? // employees: first-week checklist finished
  portalStartDismissedAt DateTime? // clients: orientation read (both kinds)
  detailsConfirmedAt     DateTime? // individual clients: setup step 1 (7.13)
  briefReviewedAt        DateTime? // individual clients: setup step 3 (7.13)
  bids               Bid[]
  assignedJobs       JobMember[]
  enrollments        Enrollment[]
  lessonCompletions  LessonCompletion[]
  sentMessages       Message[]
  channelMemberships ChannelMember[]
  forumPosts         ForumPost[]
  vaultUploads       VaultAsset[]
  xpEvents           XpEvent[]
  portalGuideEdits   PortalGuide[]
  ownedDeals         Deal[]             @relation("DealOwner")
  dealActivities     DealActivity[]
  claimedCards       BookingCard[]      @relation("ClaimedCards")
  createdAt          DateTime           @default(now())
}
model Department {
  id          String      @id @default(uuid())
  name        String      @unique
  slug        String      @unique
  description String
  members     User[]
  courses     Course[]    @relation("DepartmentCourses")
  jobs        Job[]
  channel     Channel?
  forumPosts  ForumPost[]
  onboardingCourseId String? @unique // the department's first-week primer (7.13)
  onboardingCourse   Course? @relation("DepartmentPrimer", fields: [onboardingCourseId], references: [id], onDelete: SetNull)
}
// ── Marketplace ─────────────────────────────────────────────
model Job {
  id           String     @id @default(uuid())
  title        String
  brief        String     // one-sentence board-card summary
  description  String     // full markdown body
  status       JobStatus  @default(OPEN)
  grossValue   Decimal    @db.Decimal(12, 2) // client pays
  workerPool   Decimal    @db.Decimal(12, 2) // allocated to workers
  firmMargin   Decimal    @db.Decimal(12, 2) // retained; invariant: pool + margin = gross
  accountId    String
  account      Account    @relation(fields: [accountId], references: [id])
  dealId       String?    @unique // the won deal this engagement converted from (7.11)
  deal         Deal?      @relation(fields: [dealId], references: [id], onDelete: SetNull)
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  createdAt    DateTime   @default(now())
  dueAt        DateTime?
  completedAt  DateTime?
  bids        Bid[]
  workers     JobMember[]
  vaultAssets VaultAsset[]
  channel     Channel?
  @@index([status, departmentId])
}
model JobMember {
  jobId    String
  job      Job    @relation(fields: [jobId], references: [id], onDelete: Cascade)
  memberId String
  member   User   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  @@id([jobId, memberId])
}
model Bid {
  id            String    @id @default(uuid())
  jobId         String
  job           Job       @relation(fields: [jobId], references: [id], onDelete: Cascade)
  memberId      String
  member        User      @relation(fields: [memberId], references: [id], onDelete: Cascade)
  proposedSplit Decimal   @db.Decimal(10, 2)
  pitchText     String?
  status        BidStatus @default(PENDING)
  createdAt     DateTime  @default(now())
  @@unique([jobId, memberId])
  @@index([jobId, status])
}
// ── Academy ─────────────────────────────────────────────────
model Course {
  id           String       @id @default(uuid())
  title        String
  description  String
  departmentId String
  department   Department   @relation("DepartmentCourses", fields: [departmentId], references: [id], onDelete: Cascade)
  primerFor    Department?  @relation("DepartmentPrimer")
  modules      Module[]
  enrollments  Enrollment[]
}
model Module {
  id       String   @id @default(uuid())
  title    String
  order    Int
  courseId String
  course   Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons  Lesson[]
}
model Lesson {
  id          String             @id @default(uuid())
  title       String
  order       Int
  body        String             // markdown
  assetUrl    String?
  durationMin Int?
  moduleId    String
  module      Module             @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  completions LessonCompletion[]
}
model Enrollment {
  id          String   @id @default(uuid())
  memberId    String
  member      User     @relation(fields: [memberId], references: [id], onDelete: Cascade)
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progressPct Float    @default(0) // denormalized; recomputed from completions
  isCompleted Boolean  @default(false)
  updatedAt   DateTime @updatedAt
  @@unique([memberId, courseId])
}
model LessonCompletion {
  memberId    String
  member      User     @relation(fields: [memberId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completedAt DateTime @default(now())
  @@id([memberId, lessonId])
}
// ── Communications ──────────────────────────────────────────
model Channel {
  id           String          @id @default(uuid())
  kind         ChannelKind
  name         String          // "engineering", "job-meridian-rebrand"; derived label for DMs
  departmentId String?         @unique
  department   Department?     @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  jobId        String?         @unique
  job          Job?            @relation(fields: [jobId], references: [id], onDelete: Cascade)
  accountId    String?         @unique
  account      Account?        @relation(fields: [accountId], references: [id], onDelete: Cascade)
  members      ChannelMember[] // explicit rows for DMs only; others derive membership
  messages     Message[]
  createdAt    DateTime        @default(now())
}
model ChannelMember {
  channelId String
  channel   Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([channelId, userId])
}
model Message {
  id            String       @id @default(uuid())
  channelId     String
  channel       Channel      @relation(fields: [channelId], references: [id], onDelete: Cascade)
  senderId      String
  sender        User         @relation(fields: [senderId], references: [id])
  body          String
  isShadowDraft Boolean      @default(false) // Shadow proposal awaiting approval
  approvedById  String?      // user id; intentionally scalar (display-only)
  bookingCardId String?      @unique // renders the card inline in #new-business (7.12)
  bookingCard   BookingCard? @relation(fields: [bookingCardId], references: [id], onDelete: Cascade)
  createdAt     DateTime     @default(now())
  @@index([channelId, createdAt])
}
model ForumPost {
  id           String      @id @default(uuid())
  authorId     String
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  departmentId String?     // null = firm-wide
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  title        String?
  body         String
  parentId     String?
  parent       ForumPost?  @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies      ForumPost[] @relation("Replies")
  createdAt    DateTime    @default(now())
  @@index([createdAt])
}
// ── Vault ───────────────────────────────────────────────────
model VaultAsset {
  id             String   @id @default(uuid())
  title          String
  fileUrl        String
  fileType       String   // "pdf" | "doc" | "sheet" | "image" | "figma" | "link"
  sizeKb         Int?
  isSharedSocial Boolean  @default(false) // visible firm-wide ("Commons")
  uploadedById   String
  uploadedBy     User     @relation(fields: [uploadedById], references: [id])
  jobId          String?
  job            Job?     @relation(fields: [jobId], references: [id], onDelete: SetNull)
  createdAt      DateTime @default(now())
  @@index([jobId])
  // V3 seam: add `embedding Unsupported("vector(1536)")?` + pgvector extension
}
// ── CRM & the gate ──────────────────────────────────────────
model Account {
  id        String        @id @default(uuid())
  name      String        @unique
  kind      AccountKind   @default(BUSINESS)
  website   String?
  status    AccountStatus @default(PROSPECT)
  notes     String?
  contacts  Contact[]
  deals     Deal[]
  jobs      Job[]
  portalUsers User[]      @relation("AccountUsers")
  channel   Channel?      // the ACCOUNT thread, provisioned at conversion
  createdAt DateTime      @default(now())
}
model Contact {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  name      String
  email     String
  title     String?
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([accountId])
}
model Deal {
  id              String       @id @default(uuid())
  title           String
  accountId       String
  account         Account      @relation(fields: [accountId], references: [id], onDelete: Cascade)
  ownerId         String
  owner           User         @relation("DealOwner", fields: [ownerId], references: [id])
  stage           DealStage    @default(INBOUND)
  source          DealSource
  value           Decimal?     @db.Decimal(12, 2) // required before WON
  expectedCloseAt DateTime?
  wonAt           DateTime?
  lostAt          DateTime?
  lostReason      String?      // required on LOST, plain sentence
  bookingCard     BookingCard?
  job             Job?         // the engagement this converted into
  activities      DealActivity[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  @@index([stage])
  @@index([ownerId])
  @@index([accountId])
}
model DealActivity {
  id        String       @id @default(uuid())
  dealId    String
  deal      Deal         @relation(fields: [dealId], references: [id], onDelete: Cascade)
  authorId  String
  author    User         @relation(fields: [authorId], references: [id])
  kind      ActivityKind
  body      String
  createdAt DateTime     @default(now())
  @@index([dealId, createdAt])
}
model BookingCard {
  id               String        @id @default(uuid())
  externalRef      String        @unique // n8n's bookingId — the idempotency key
  name             String
  email            String
  company          String
  companySize      String
  automationGoal   String
  slotStart        DateTime
  slotEnd          DateTime
  status           BookingStatus @default(UNCLAIMED)
  claimedById      String?
  claimedBy        User?         @relation("ClaimedCards", fields: [claimedById], references: [id], onDelete: SetNull)
  claimedAt        DateTime?
  dealId           String?       @unique // the deal opened on claim
  deal             Deal?         @relation(fields: [dealId], references: [id], onDelete: SetNull)
  message          Message?      // its inline rendering in #new-business
  lastWebhookError String?       // outbound claim notification failure, if any
  submittedAt      DateTime
  createdAt        DateTime      @default(now())
  @@index([status])
}
// ── Ledger & portal content ─────────────────────────────────
model XpEvent {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int
  reason    XpReason
  refId     String?  // lessonId / jobId / postId etc.
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
model PortalGuide {
  id          String   @id @default("main") // single row
  markdown    String
  updatedAt   DateTime @updatedAt
  updatedById String?
  updatedBy   User?    @relation(fields: [updatedById], references: [id], onDelete: SetNull)
}
model InfoBarMessage {
  id        String   @id @default(uuid())
  text      String
  href      String?
  isActive  Boolean  @default(true)
  order     Int
  updatedAt DateTime @updatedAt
}
```
Schema notes: every join table cascades from both sides; user deletion is out of
scope for V2 UI but the schema won't strand rows. `Decimal` everywhere money
appears — never `Float`. The graph has no tables (section 3, item 2).
---
## 9. Server architecture
**Pattern.** All mutations are Server Actions in `app/actions/*.ts` grouped by
domain (`marketplace.ts`, `crm.ts`, `academy.ts`, `chat.ts`, `forum.ts`,
`vault.ts`, `onboarding.ts`, `admin.ts`, `auth.ts`). Every action: (1)
`getSessionUser()` + role/ownership check, (2) parse input with a zod schema
from `lib/validators.ts`, (3) mutate in a `prisma.$transaction` when more than
one row changes, (4) `revalidatePath` the affected routes, (5) return the
shared envelope:
```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };  // error is a 5.7-compliant sentence
```
Actions never throw to the client; they return `ok: false` with copy the UI can
render verbatim. Reads happen in Server Components via `lib/queries/*`. No API
routes in V2 with one exception: `app/api/hooks/booking/route.ts`, the inbound
n8n receiver (7.12) — third parties cannot invoke Server Actions, so this is the
one front door, HMAC-verified before anything else runs.
**Action catalog** (authorization per section 4):
| Action | Input (zod) | Effects |
|---|---|---|
| `switchPersona` | personaId | sets `krysalis_persona` cookie (demo only) |
| `createJob` | title, brief, description, accountId, departmentId, grossValue, workerPool, dueAt?, dealId? | derives firmMargin, validates invariant, creates OPEN job |
| `placeBid` / `updateBid` / `withdrawBid` | jobId, proposedSplit, pitchText? | pool-remainder check; optimistic row |
| `acceptBid` | bidId | tx: bid ACCEPTED, JobMember created, XP `BID_ACCEPTED`, job → ASSIGNED if OPEN, job channel provisioned |
| `rejectBid` | bidId | bid REJECTED |
| `startJob` | jobId | ASSIGNED → IN_PROGRESS |
| `submitForReview` | jobId, note? | IN_PROGRESS → REVIEW; note posted to job channel |
| `requestChanges` | jobId, note | REVIEW → IN_PROGRESS; note posted |
| `approveCompletion` | jobId | tx: COMPLETED, completedAt, earnings += splits, XP `JOB_COMPLETED`, tier recompute |
| `enrollInCourse` | courseId | creates Enrollment |
| `completeLesson` | lessonId | idempotent; tx: LessonCompletion, XP, progress recompute, course-complete bonus, tier recompute |
| `sendMessage` | channelId, body | membership check (covers CLIENT users in their ACCOUNT thread); optimistic append |
| `fetchMessagesAfter` | channelId, cursor | read action for the 5s poll |
| `requestShadowDraft` | jobId | runs ShadowAgent, stores draft Message |
| `approveShadowDraft` / `discardShadowDraft` | messageId | clears flag + stamps approver / deletes |
| `createForumPost` / `replyToPost` | body, title?, departmentId? / parentId, body | XP with daily cap |
| `addVaultAsset` | title, fileUrl, fileType, jobId?, sizeKb? | URL-format validation |
| `toggleAssetSharing` | assetId | flips isSharedSocial |
| `publishGuide` | markdown | upserts PortalGuide "main" |
| `upsertInfoBarMessage` / `reorderInfoBar` / `toggleInfoBarMessage` | … | portal info bar CRUD |
| `updateUserRole` / `updateUserDepartment` | userId, value | ADMIN; confirmation copy echoes the change |
| `claimBookingCard` | cardId | atomic first-claim (conditional update); same tx: find-or-create Account by name, create Contact + Deal (DISCOVERY, WEBSITE, owner = claimer), post claim message; after commit: signed claim webhook to n8n, failure stored on the card |
| `resendClaimWebhook` | cardId | ADMIN; retries the outbound notification |
| `createDeal` | accountId? or newAccount{name, contactName, contactEmail}, title, source, value?, expectedCloseAt? | manual pipeline entry (7.11) |
| `updateDeal` | dealId, patch | owner or ADMIN |
| `setDealStage` | dealId, stage, note? | writes STAGE_CHANGE activity; WON requires value (stamps wonAt, XP `DEAL_WON`); LOST requires note (stamps lostAt, lostReason) |
| `logDealActivity` | dealId, kind, body | NOTE / CALL / EMAIL / MEETING |
| `convertWonDeal` | dealId, provisionPortalUser?, draftJob? | ADMIN; tx: account → ACTIVE, ACCOUNT thread provisioned, optional CLIENT user from primary contact, optional OPEN job prefilled gross = deal value, `Job.dealId` set |
| `createEmployee` | name, email, departmentId, role | ADMIN; account created with onboarding pending |
| `completeOnboarding` | — | re-verifies the three 7.13 checks server-side; stamps timestamp; XP `ONBOARDING_COMPLETED` once |
| `dismissPortalStart` | — | client persona; stamps portalStartDismissedAt |
| `confirmPortalDetails` | name | individual client; updates name, stamps detailsConfirmedAt |
| `markBriefReviewed` | — | individual client; stamps briefReviewedAt |
**Optimistic UI** is used in exactly three places — bid placement, message send,
lesson completion — via React 19 `useOptimistic` + `useTransition`. Everything
else is a plain form action with a pending state on the button
(`useFormStatus`), which is honest and simpler. Claiming a booking card is
deliberately on the plain path: it is a race, and the loser must see the truth,
not a flicker.
**Domain logic lives in `lib/`**, pure and unit-testable: `lib/money.ts`
(Decimal math + invariants), `lib/xp.ts` (awards, caps, tier function),
`lib/crm.ts` (stage rules, account find-or-create), `lib/hmac.ts` (sign +
timing-safe verify, `node:crypto`), `lib/graph/build.ts`, `lib/leaderboards.ts`,
`lib/shadow/*`.
**Dependency allowlist for V2** — nothing else without updating this spec:
`prisma`, `@prisma/client`, `zod`, `lucide-react`, `d3-force`, `react-markdown`,
`remark-gfm`, `clsx`. Dev: `vitest`, `tsx`, `@types/d3-force`.
---
## 10. Seed specification
The seed is product surface. A demo that ships with "Test Job 1" and lorem ipsum
reads as machine-generated no matter how good the CSS is, so the seed is
hand-authored prose in `prisma/seed-data.ts` (typed constants, stable hardcoded
ids) executed by `prisma/seed.ts`. No faker. Same data every run.
**The firm.** Krysalis runs on its own platform. Four departments: Engineering,
Design, Marketing, Operations.
**People.** 24 employees with realistic, varied full names and titles (the tone
of a real staff page — e.g. Priya Raman, Staff Engineer; Daniel Okafor,
Engineering Lead; June Park, Brand Designer; Tomás Herrera, Ops Coordinator;
Sara Lindqvist, Content Strategist; Marcus Webb, Frontend Engineer; Aiko Tanaka,
Design Lead; Lena Borowski, Account Manager; Noor Haddad, Junior Designer —
author the remaining fifteen in the same register; no joke names, no
celebrities, no alliteration gags). Plus: Mara Voss, Managing Director (ADMIN);
two of the 24 flagged MODERATOR; two `isSystem` users with no department —
"Shadow" (the draft agent) and "Gate" (the website's voice, sender of booking
cards); one parked USER account; and six CLIENT users — one per active account,
Mateo Vargas's among them. The persona pill's five entries: Mara Voss (ADMIN),
one MODERATOR, one EMPLOYEE, the Tidegate portal user (business client), and
Mateo Vargas (individual client). Every employee has `onboardingCompletedAt`
set **except Noor Haddad**,
who joined three weeks ago and stands at 1 of 3 checklist items (enrolled in the
Design primer, one lesson done, nothing posted yet) — so the welcome page demos
mid-progress.
**Accounts.** Five ACTIVE BUSINESS accounts — Northbeam Logistics, Cassia
Health, Fernwell & Co., Ratio Coffee Roasters, Tidegate Insurance — each with a
linked portal user (`User.accountId`) and 1–2 named contacts. One ACTIVE
INDIVIDUAL account: **Mateo Vargas**, an independent financial planner, his own
single contact and portal user — seeded mid-setup (details confirmed, the other
two steps open) so the individual composition and its strip demo live. Three
PROSPECT accounts with no jobs: Halcyon Dental Partners, Westerly Charter Co.,
Bellhaven Property Group, each with a contact. Account notes are one or two
working sentences ("Two-clinic dental group in Tacoma; front-desk automation is
the wedge."), not filler.
**Account threads.** Every ACTIVE account has its ACCOUNT channel. Three carry
short, real exchanges (2–5 turns): Tidegate's includes the conversion handoff
("Your portal is live; the intake engagement kicks off Monday."), one business
thread includes a client's "Request a review call" message and the owner's
reply, and Mateo's thread reads like a client of one — direct, first-name,
quick.
**Pipeline.** 9 deals spread so every stage and view has something real in it:
2 INBOUND, 2 DISCOVERY (both opened from claimed booking cards, source
WEBSITE), 2 PROPOSAL with values set, 1 VERBAL, 1 WON, 1 LOST with a
plain-sentence reason ("Chose to hire in-house; revisit Q4."). The WON deal —
"Tidegate claims-intake automation", owner Lena Borowski, won three weeks ago —
is already converted: its job is one of the IN_PROGRESS jobs below
(`Job.dealId` linked, gross equal to the deal's value), and Tidegate's portal
user has **not** dismissed the start-here panel, so the client-onboarding
moment demos live. Owners are spread across several employees. Each deal
carries 2–6 hand-written `DealActivity` rows in real CRM register — terse,
dated, specific ("Call w/ Rosa. Two locations, paper intake at both. Send the
Cassia case study.") — plus the automatic STAGE_CHANGE rows.
**Booking cards.** Three. One UNCLAIMED card sits in `#new-business` — Halcyon
Dental Partners, slot a few days out, automation goal in the visitor's own
words ("Front desk spends two hours a day on appointment reminders and
reschedules."). Two CLAIMED cards link to the two DISCOVERY deals, with their
claim follow-up messages in the channel and `claimedAt` timestamps that match
the deal history.
**Jobs.** 14, distributed 4 OPEN / 2 ASSIGNED / 3 IN_PROGRESS / 2 REVIEW /
3 COMPLETED, spread across departments and the six active accounts, with
believable titles
("Northbeam dispatch dashboard, phase two", "Cassia patient-intake redesign",
"Ratio spring campaign system"), serif-worthy
two-paragraph descriptions, and internally consistent money (business jobs
gross between 3,200.00 and 24,000.00; Mateo's one engagement — "Vargas advisory
site and intake form", IN_PROGRESS — at 1,800.00; pool 55–70% of gross;
accepted splits that actually sum ≤ pool). Completed jobs have completedAt
dates over the past five months so the 90-day toggles mean something.
**Bids.** OPEN jobs carry 2–5 PENDING bids each with one-or-two-sentence pitches
in each bidder's plausible voice; assigned jobs keep their ACCEPTED and a couple
of REJECTED bids as history.
**Academy.** 6 courses (1–2 per department) with titles like real internal
curricula ("Scoping Client Engagements", "TypeScript at Krysalis", "Brand
Systems Fieldwork", "Running a Handover"). Two courses fully written — 3 modules,
3–4 lessons each, genuine 300–500-word markdown lessons someone could learn
from — the rest with real outlines and 2 finished lessons. Each department's
`onboardingCourseId` points at its primer; the two fully-written courses serve
Engineering and Design, and the other primers have at least their first lesson
complete so the first-week checklist works end to end for every department.
Enrollment and completion spread unevenly so progress bars and XP differ per
person.
**Channels & messages.** All four department channels, the `#new-business`
FIRM channel (carrying the three booking cards, their claim follow-ups, and a
couple of human reactions to the unclaimed one), the six ACCOUNT threads (three
written as above), plus job channels for
every non-OPEN job. Three threads written in full (10–16 turns of believable
shop talk — questions, links to vault assets by name, a disagreement that
resolves); one IN_PROGRESS job channel contains a pending Shadow draft generated
by the deterministic agent at seed time. Other channels get 3–6 lighter messages.
Timestamps spread over recent weeks, clustered in working hours.
**Forum.** ~10 posts (a process question with replies, a win announcement
written like a person wrote it, a tooling recommendation, a hiring note).
**Vault.** ~18 assets with real-sounding filenames and types, most linked to
jobs, 5 shared to the Commons.
**XP.** Backfill `XpEvent` rows consistent with the above — including Lena's
`DEAL_WON` and an `ONBOARDING_COMPLETED` for everyone but Noor — so
`experiencePoints`, tiers (at least one Imago, several Larvae),
`totalEarnings`, and all three leaderboards come out non-uniform and plausible.
**Portal.** A genuinely useful 400-word client guide (what the portal shows, how
review works, who to contact) and 3 info-bar messages ("Office closed July 3",
"Quarterly review packets go out June 20", one link to the guide). Four of the
five business portal users have `portalStartDismissedAt` set; Tidegate's does
not (see Pipeline above). Mateo stands at step 1 of 3 on the setup strip.
---
## 11. `CLAUDE.md` — place this at the repo root, verbatim
````markdown
# Krysalis Agentic OS — working agreements
Authoritative spec: PRD.md. When code and PRD disagree, PRD wins; report the
conflict, don't paper over it. Design hard rules are PRD §5.1 — they are bugs
when violated, same as type errors.
## Stack (pinned — no major upgrades)
Next.js 16.2.x (App Router) · React 19.2 · Tailwind CSS 4.3 (PostCSS) ·
TypeScript 5.9 strict · Prisma + PostgreSQL. Node 20.9+.
## Commands
- `docker compose up -d` then `npx prisma migrate dev` then `npx prisma db seed`
- `npm run dev` / `npm run build` / `npx tsc --noEmit` / `npm test` (vitest)
- `npm run simulate:booking` — signed sample booking into the local webhook (no n8n needed)
## Environment (`.env`, committed `.env.example`)
DATABASE_URL · N8N_WEBHOOK_SECRET · N8N_CLAIM_WEBHOOK · MOCK_WEBHOOKS
(unset = mock outside production, mirroring the gate repo) · ANTHROPIC_API_KEY
(optional, Shadow adapter only). All server-only; this app has no
NEXT_PUBLIC_ variables.
## Layout
- `app/` routes; `(employee)` and `(client)` route groups own the theme scopes
- `app/actions/` Server Actions only ("use server", zod-validated, ActionResult envelope)
- `app/api/hooks/` the ONLY route handler — inbound n8n webhook, HMAC-verified (PRD §7.12)
- `lib/` pure domain logic (money, xp, crm, hmac, graph, shadow, leaderboards, queries, auth, db)
- `components/` one component per file, PascalCase, ~200 lines max — split beyond that
- `prisma/` schema, migrations, seed.ts, seed-data.ts (hand-authored, deterministic)
## Non-negotiables
1. Server Components by default; "use client" only on interactive leaves.
2. Every mutation: auth check → zod parse → transaction if multi-row →
   revalidatePath → ActionResult. Never throw to the client.
3. Colors via `--color-*` tokens only. No hex, no Tailwind palette classes in
   components. Fonts via `--font-ui` / `--font-mono` / `--font-serif` only.
4. No emojis anywhere (code, UI, seed, commits). No gradients outside PRD §5.9.
   No banned vocabulary (PRD §5.1.5). Sentence case, no exclamation marks in UI.
5. Money is Prisma Decimal end to end; invariants in lib/money.ts are re-checked
   inside actions.
6. Dependencies limited to the PRD §9 allowlist.
7. No `any`, no `@ts-expect-error` without a comment explaining why.
8. Tabular data renders as tables with mono tabular-nums figures, not card grids.
9. krysalis-gate is a separate island. Never import from it, share types with
   it, or call it directly — signed n8n webhooks (PRD §7.12) are the only bridge.
## Definition of done (every milestone)
`npm run build` passes · `npx tsc --noEmit` clean · vitest green ·
PRD §5.10 design audit run on touched screens · short report written
(what changed, decisions made, anything that contradicted the PRD).
## Commits
Conventional commits, one per task, imperative, no emoji:
`feat(marketplace): enforce worker-pool remainder on bid placement`
````
---
## 12. Quality gates
- **Types & build:** strict TS, `tsc --noEmit` clean, `next build` clean at every
  milestone boundary.
- **Tests (vitest):** required coverage of pure domain logic — `lib/money.ts`
  (invariants, remainder math, Decimal edge cases), `lib/xp.ts` (caps, tier
  boundaries at 249/250, idempotent lesson award), `lib/leaderboards.ts` scoring,
  `lib/graph/build.ts` (node/edge derivation from a fixture), `lib/crm.ts`
  (WON requires value, LOST requires note, account find-or-create is
  case-insensitive), `lib/hmac.ts` (sign/verify round-trip, tampered body
  rejected, timing-safe compare used), zod validators,
  and the deterministic Shadow (same input → same output). One claim-race test:
  the second `claimBookingCard` against an already-claimed card returns
  `ok: false` and changes nothing. Action-level tests otherwise optional in V2.
- **Accessibility:** focus-visible everywhere, semantic tables and landmarks,
  labels on every input, AA contrast in both themes, reduced-motion honored,
  bid flow completable by keyboard alone.
- **Performance:** production build, local — dashboard LCP under 2.5s; no layout
  shift on theme application (theme class resolves on the server, never flashes);
  graph page is the only route allowed a heavy client bundle.
- **Seed integrity check** in tests: every job satisfies the money invariant;
  every user's `experiencePoints` equals the sum of their `XpEvent`s; every
  CLAIMED booking card has a deal and a claimer; every WON deal has a value;
  where a job links a deal, the job's `grossValue` equals the deal's value.
---
## 13. Milestones
Sequential. Each ends green (section 11 definition of done) plus its own
acceptance list.
**M0 — Alignment & shell.** Audit V1 against this spec and report drift. Add
`PRD.md` (this file) and `CLAUDE.md` (§11) to the root. Install the §9 allowlist.
Load the three fonts; replace `app/globals.css` token scopes with the §5.2
tables; add the canopy grain, wing hairline, and chrysalis glyph; purge every
emoji and banned phrase from V1 code. Convert dashboard tabs to the §6 routes
with the persistent shell. *Done when:* both themes render the restyled shell
with mock data still in place, the §5.10 grep returns zero, build green.
**M1 — Data layer.** `docker-compose.yml`, `.env.example`, §8 schema, first
migration, `lib/db.ts`, `lib/auth.ts` (persona cookie + `requireRole`), and the
full §10 seed including backfilled XP and the seeded Shadow draft. *Done when:*
`migrate dev && db seed` from scratch succeeds twice (idempotent reset), seed
integrity tests pass, persona switcher swaps between the five seeded personas.
**M2 — Marketplace.** Board, job detail, the full status machine, bidding with
optimistic UI, completion transaction with earnings + XP. *Done when:* the whole
OPEN→COMPLETED lifecycle is drivable through the UI as admin + employee personas,
invariants hold under deliberate over-bidding, money tests green.
**M3 — Academy & progression.** Catalog, classroom, lesson completion, XP/tier
engine, profile performance record, tier badges rendering wherever names appear.
*Done when:* completing a seeded course end-to-end awards exactly the §7.2
amounts once, progress bars recompute, a tier-up toast fires at the boundary.
**M4 — Channels & Shadow.** Channel routes + rail (all five kinds, with derived
membership — FIRM and ACCOUNT included), composer with optimistic
send, 5s visibility-aware polling, deterministic Shadow, draft
request/approve/discard flow with the chrysalis treatment. *Done when:* two
browser windows on different personas converge within one poll cycle, a
requested draft contains real figures from the job it summarizes, and a CLIENT
persona can see and post in exactly their own ACCOUNT thread and nothing else.
**M5 — CRM & the gate loop.** Pipeline table + board toggle, account and deal
pages, activity log, manual deal entry; `lib/hmac.ts`; the inbound webhook
route with signature verification and idempotent upsert; bounty cards rendering
in `#new-business` and at `/dashboard/crm/bounties`; the atomic claim
transaction with outbound n8n notification (+ admin resend); `convertWonDeal`;
the `simulate:booking` script. *Done when:* `npm run simulate:booking` lands a
card in the channel within one poll cycle; the same script run twice creates
one card; a two-window claim race yields exactly one winner and the loser sees
"Already claimed by …"; claiming opens a DISCOVERY deal under the right
account; marking a deal WON and converting it provisions a portal user, the
account thread, and a
draft job whose gross equals the deal's value; the §5.10 audit passes on every
new screen.
**M6 — Vault, graph, leaderboards, forum.** Vault table + filters + Commons
toggle; derived force graph (now including account nodes) with
hover/inspect/pan/zoom; three leaderboards with toggles; forum feed with
replies and capped XP. *Done when:* graph reflects a newly completed job
without any graph-specific write, leaderboard figures match hand-computed
values from the seed.
**M7 — Client portal & settings.** Both portal compositions on live data:
shared foundation (info bar, guide, job statuses in client language, shared
assets); business view (figures row, contact card, start-here panel with
dismiss, account thread with the review-call prefill); individual view (setup
strip, engagement card with inline assets, prominent thread); moderator editors
with live preview; admin user matrix including "Add employee". *Done when:* a
moderator edit to the guide appears in both client personas on next load; the
Tidegate persona sees the start-here panel naming Lena Borowski and can dismiss
it once; the Mateo persona finishes the setup strip and it collapses to one
line; a review-call request sent from the portal appears in the owner's
CLIENTS rail within one poll; a newly added employee lands with onboarding
pending; and no internal vocabulary, margin figure, or pipeline language is
reachable from either client persona.
**M8 — Onboarding & hardening.** The `/dashboard/welcome` first-week page:
derived checklist, inline profile edit, primer and channel links, "Finish
setup" with server-side re-verification and the one-time XP award, the rail
entry and once-per-session landing. Then the hardening pass: accessibility,
reduced-motion verification, perf budget check, README rewrite (setup,
personas, the simulate script, tour), full-product §5.10 audit, remaining
tests. Stretch, only if everything above is green: the env-gated Anthropic
Shadow adapter. *Done when:* the Noor Haddad persona can be walked 0 → complete
with exactly one 50 XP award and the entry disappears from the rail; §12 holds
in full.
---
## 14. Out of scope for V2 (the V3 shelf)
Real authentication (Auth.js at the 7.10 seam) · payments/invoicing ·
websockets/SSE realtime (bounty cards arrive on the 5s poll for now) ·
file upload + storage (vault stays URL-based) · pgvector semantic search over
the vault · model-backed Shadow as default · notifications/email · CRM email
sync, sequences, and reminders · calendar integration beyond the n8n booking
relay (in-portal QBR scheduling included) · client loyalty points · SLA and
contract-health dashboards · MSA / procurement-approval tracking ·
data-migration progress meters · client-facing Shadow auto-replies (it drafts
for employees only) · extracting the client portal into its own deployed
surface (the gate README's three-island picture, fully separated) · mobile
apps · multi-tenancy.
Listing these is part of the spec: do not gold-plate toward them.
---
## 15. Open decisions for the owner
1. **Postgres locally:** is Docker available to the build environment? If not,
   say so and a hosted `DATABASE_URL` (e.g. Neon) replaces compose in M1.
2. **Shadow adapter:** should M7 attempt the real Anthropic-backed adapter
   (requires an API key in `.env`), or ship deterministic-only?
3. **Earnings currency:** USD assumed throughout. Confirm or name the currency
   before M1 so seed figures and formatting are right the first time.
4. **n8n provisioning:** the claim webhook URL and the shared secret must exist
   on the n8n side before M5 goes live against real traffic. Until then,
   `MOCK_WEBHOOKS` + `simulate:booking` keep the entire loop local — confirm
   whether M5 should ship mock-only or wired.
5. **Won-deal handoff:** conversion auto-provisions the client portal user from
   the primary contact (as specified in 7.11). Confirm this, or say if portal
   access should instead wait for a manual step.
---
## 16. Kickoff prompt for Claude Code
```text
You are picking up the Krysalis Agentic OS repository(THIS IS NOW THE KRYSALIS PLATFORM FOLDER) (Next.js 16 / React 19 /
Tailwind 4 / TypeScript, currently a frontend-only mockup with mock data).
Read PRD.md in full before writing any code. Sections 5 (design hard rules),
7.11–7.13 (CRM, gate webhooks, onboarding), 8 (schema), 9 (server
architecture), 10 (seed), and 13 (milestones) are binding.
The product must read as built by a careful human team: no emojis, no gradient
or glassmorphism styling outside PRD §5.9, semantic color tokens only, the
specified type system, and microcopy per PRD §5.7.
Execute Milestone 0, then Milestone 1, exactly as specified in PRD §13:
1. Audit the existing V1 code against PRD §2 and report any drift before changing it.
2. Add CLAUDE.md to the repo root with the verbatim contents of PRD §11.
3. Complete M0 (fonts, token scopes, signature elements, emoji purge, tab-to-route
   conversion including the CRM and welcome routes) and run the PRD §5.10 design audit.
4. Complete M1 (compose file, .env.example, schema, migration, auth helpers, full
   hand-authored seed per PRD §10 — accounts, deals, and booking cards included)
   and run the seed integrity tests.
No n8n values are needed for M0/M1; MOCK_WEBHOOKS covers everything until M5.
Then stop and report: files changed, decisions made, audit results, seed counts,
and anything in the PRD that conflicted with what you found. Do not begin
Milestone 2 until the report is acknowledged.
```
