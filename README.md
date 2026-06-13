# Krysalis Agentic OS

The internal operating system of a small professional-services firm, built as
one Next.js app with two identity-scoped surfaces: a dense, dark **employee
hub** (the Metapod theme) and a calm, light **client portal** (the Butterfree
theme). It replaces five disconnected tools — a CRM wired to the public website
through signed n8n webhooks, a task marketplace with transparent economics, a
departmental academy with XP and tiers, contextual messaging with an AI
"Shadow" that drafts progress updates, and a knowledge graph derived from
delivered work.

The authoritative specification is [`PRD.md`](PRD.md); the working agreements
are in [`CLAUDE.md`](CLAUDE.md) and the design contract in
[`docs/ui-contract.md`](docs/ui-contract.md). When code and the PRD disagree,
the PRD wins.

## Stack (pinned)

Next.js 16.2.x (App Router) · React 19.2 · Tailwind CSS 4.3 (PostCSS) ·
TypeScript 5.9 strict · Prisma + PostgreSQL · Node 20.9+. The only runtime
dependencies beyond these are `zod`, `lucide-react`, `d3-force`,
`react-markdown`, `remark-gfm`, and `clsx` (PRD §9 allowlist).

## Setup

```bash
# 1. Environment — copy the committed example and adjust if needed.
cp .env.example .env

# 2. Postgres. With Docker:
docker compose up -d
#    Without Docker, point DATABASE_URL at any Postgres 17 instance.

# 3. Schema + the hand-authored seed.
npx prisma migrate dev
npx prisma db seed

# 4. Run.
npm run dev        # http://localhost:3000
```

Build and checks:

```bash
npm run build          # production build
npx tsc --noEmit       # strict typecheck
npm test               # vitest — requires the seeded database
```

The test suite reads the seeded database (it uses throwaway rows and restores
any seeded row it touches), so run `npx prisma db seed` before `npm test` on a
fresh database.

## Environment

All variables are server-only; this app has no `NEXT_PUBLIC_` variables.
`.env.example` ships three deliberately-marked development placeholders so a
fresh clone runs the whole loop offline:

| Variable | Example default | Purpose |
|---|---|---|
| `DATABASE_URL` | the compose URL | Postgres connection. |
| `N8N_WEBHOOK_SECRET` | `dev-not-a-secret` | Shared HMAC secret for the n8n bridge. A **dev placeholder** so `simulate:booking` verifies on a fresh clone — replace it before pointing real n8n traffic at this app. |
| `N8N_CLAIM_WEBHOOK` | *(empty)* | The n8n endpoint notified when a booking is claimed. Empty until n8n exists; outbound calls are mocked. |
| `MOCK_WEBHOOKS` | *(unset)* | Unset means mock everywhere except production; `"true"` forces mocks, `"false"` forces real calls. |

`ANTHROPIC_API_KEY` is optional and only enables the model-backed Shadow
adapter (below). The build and the entire test suite run and pass with it
absent.

## The gate loop, offline

A discovery-call booking on the public website (`krysalis-gate`, a separate
repo) crosses to this app as one HMAC-signed n8n webhook, lands as a bounty
card in the `#new-business` channel, and — when an employee claims it — opens a
CRM deal and notifies n8n back. The whole loop runs locally with no n8n:

```bash
npm run dev                  # in one terminal
npm run simulate:booking     # signs the PRD §7.12 sample and POSTs it locally
```

The card appears in `#new-business` and on `/dashboard/crm/bounties`; running
the script twice yields one card (idempotent on the booking id). **Mock-failure
convention:** in mock mode, claiming a card whose company name contains `409`
simulates an outbound n8n failure, populating `lastWebhookError` so the admin
"Resend to n8n" path is demoable offline.

## Personas

Authentication is mock by design (a persona cookie holds a seeded user id;
Auth.js is the V3 seam). The floating role-switcher pill swaps between five
seeded personas in two clicks — the live three-way identity pivot:

| Persona | Role | Lands on |
|---|---|---|
| Mara Voss | Admin (Managing Director) | the employee hub, full access |
| Daniel Okafor | Moderator | the hub plus the portal-content editors |
| Priya Raman | Employee (Engineering) | the hub |
| Ruth Calder | Client (Tidegate Insurance, business) | the relationship portal |
| Mateo Vargas | Client (individual) | the lighter, self-service portal |

A sixth seeded employee, **Noor Haddad**, joined three weeks ago and sits
mid-onboarding (1 of 3 first-week checks); she demonstrates the
`/dashboard/welcome` flow.

## Tour

- **`/login`** — dual-entry gateway; the segmented toggle live-swaps the two
  themes (500ms crossfade). Any credentials sign in.
- **`/dashboard`** — the Today command center: open work, pending Shadow
  drafts, the pipeline, unclaimed bounties, recent activity.
- **`/dashboard/marketplace`** — signed client work with transparent economics
  (gross / worker pool / margin); bid, get accepted, deliver, complete.
- **`/dashboard/crm`** — the pipeline (table + board), deal and account pages,
  the bounty board, and won-deal conversion into an engagement.
- **`/dashboard/academy`** — courses, lessons, XP and tiers.
- **`/dashboard/channels`** — department, job, firm, and account threads with a
  5-second poll and the Shadow draft flow.
- **`/dashboard/vault`**, **`/dashboard/graph`**, **`/dashboard/leaderboards`**,
  **`/dashboard/forum`** — the record, the derived knowledge map, the standings,
  and the field-notes feed.
- **`/client-portal`** — the client surface, composed by account kind; scoped
  entirely to the session account, with no internal vocabulary or figures.
- **`/settings`** — tiered by role: profile for all, the guide and info-bar
  editors for moderators, the user matrix and "Add employee" for admins.

## The Shadow

The AI presence is honest about being a draft machine. The default,
`lib/shadow/deterministic.ts`, reads only a job's real figures and its last ten
human messages and composes a progress update from sentence templates — same
input, same output, no network. If `ANTHROPIC_API_KEY` is set, an env-gated
model-backed adapter (`lib/shadow/anthropic.ts`) replaces it at request time
behind the same interface; it is additive and never a build or test dependency,
and falls back to the deterministic agent on any error. Every draft is reviewed,
edited, and approved by a person before it posts.

## Deploy

The platform expects a Postgres database (any provider) and the server-only env
above. `npm run build` then `npm start`, or import the repo on Vercel and set
the environment variables in the project settings. The `krysalis-gate` website
is a separate deployment; the only link between them is the signed n8n webhook.
