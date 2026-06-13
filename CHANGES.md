# Krysalis Agentic OS — V2

Tagged **v2.0.0**. The build that turned the V1 frontend mockup into a working
system: real PostgreSQL persistence, type-safe Server Actions for every
mutation, and every feature area in PRD §7 implemented end to end against a
seeded, hand-authored narrative. Built across eight milestones (M0–M8), each
ending green and adversarially audited; the per-milestone record is in
[`docs/reports/`](docs/reports/) and the full history in the git log.

## The five surfaces shipped

- **CRM & the gate loop** — a pipeline (table + board), accounts and deals, the
  activity log, and the bounty board fed by HMAC-signed n8n webhooks from the
  public `krysalis-gate` website; claiming a booking opens a deal, winning and
  converting it provisions a client portal and an engagement. `simulate:booking`
  drives the whole loop offline.
- **Task marketplace** — signed client work with transparent economics
  (gross / worker pool / margin), bidding with optimistic placement, the full
  OPEN → COMPLETED status machine, and earnings + XP on completion.
- **Academy** — courses, lessons, and an idempotent XP/tier progression engine
  with five tiers and a quiet tier-up toast.
- **Channels & the Shadow** — department, job, firm, and account threads on a
  5-second poll, with an AI "Shadow" that drafts client progress updates a
  person reviews and approves.
- **Vault, graph, leaderboards, forum** — the asset record, a force-directed
  knowledge map derived at request time from delivered work, three ranked
  boards, and a firm-wide feed.

Plus: the two-composition **client portal** (relationship view for businesses,
self-service for individuals), tiered **settings**, and onboarding at both ends
(the employee first week and the client start-here / setup strip). Identity
pivots entirely on the server between five seeded personas; the design is a
naturalist's field guide — two themes, semantic tokens only, no emoji, no
slop.

## The V3 shelf (the honest next-steps list, PRD §14)

Out of scope for V2, by design — do not gold-plate toward these:

- **Real authentication** — Auth.js at the §7.10 seam, replacing the mock
  persona cookie.
- **Payments / invoicing**.
- **Realtime** — websockets/SSE, replacing the 5-second poll.
- **File upload + storage** — the vault is URL-metadata only in V2.
- **pgvector semantic search** over the vault.
- **The model-backed Shadow as the *default*** — V2 ships it as an additive,
  env-gated alternate; the deterministic agent stays the default and the test
  target.
- Notifications/email, CRM email sync and sequences, calendar integration
  beyond the n8n relay, client loyalty points, SLA/contract-health dashboards,
  data-migration meters, client-facing Shadow auto-replies, extracting the
  portal into its own deployment, mobile apps, multi-tenancy.

## Wiring real n8n traffic

The whole gate loop runs locally with the committed `.env.example`
placeholders. Three server-only values must be set for real cross-system
traffic (see the README and PRD §7.12):

- **`N8N_WEBHOOK_SECRET`** — replace the `dev-not-a-secret` placeholder with the
  real shared HMAC secret, matched on the `krysalis-gate` side.
- **`N8N_CLAIM_WEBHOOK`** — the n8n endpoint notified when a booking is claimed
  (empty until n8n exists).
- **`MOCK_WEBHOOKS`** — leave unset (mock outside production) until n8n is wired,
  then `"false"` to force real calls.
