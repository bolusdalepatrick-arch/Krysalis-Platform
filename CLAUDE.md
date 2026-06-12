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
