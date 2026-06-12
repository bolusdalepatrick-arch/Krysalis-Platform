# Krysalis Agentic OS — V1 Frontend

Premium, information-dense dashboard mockup (Slack × Obsidian × Skool) that pivots its entire
color system based on user identity: **Internal Employee Hub** (digital-forest "Metapod" theme)
vs. **External Client Hub** (tech-lavender "Butterfree" theme).

Fully responsive, mobile-first, single-page-app feel. **All state is client-side mock data** —
no backend, no API routes, no environment variables.

## Stack

- Next.js (App Router) + React 19
- Tailwind CSS v4 (themes are CSS variable scopes — zero hardcoded colors)
- TypeScript, no other runtime dependencies

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Deploy to Vercel (two paths)

1. **Git import** — push this repo to GitHub/GitLab and import it at [vercel.com/new](https://vercel.com/new).
   Zero configuration needed; the framework is auto-detected.
2. **CLI** — `npm i -g vercel && vercel` (then `vercel --prod` to promote).

## Tour

- `/login` — dual-entry gateway; the segmented toggle live-swaps the Employee/Client theme (500ms).
  Any credentials sign in (mock auth) and land you as a **full Admin**.
- `/dashboard` — employee workspace: department sidebar (drawer on mobile), four tabs —
  Collaboration Deck (channels, human DMs, ⚡ AI agent co-workers), Forum Feed, The Vault,
  and Agent Control (squad deck with live-mocked quick triggers + Brain Synergy metrics).
- `/client-portal` — minimalist client hub: rotating info bar, Markdown navigation guide,
  shared-asset panel. Content is editable from the Moderator tier in Settings and reflects live.
- `/settings` — role-gated tiers: User (all), Moderator (guide + info bar editors),
  Admin (user matrix + dynamic roles modifier).
- The floating pill (bottom-left) is a **demo role-switcher** to preview admin / moderator /
  employee / client tiers, plus a live theme toggle.

## Structure

```
app/            routes (login, dashboard, client-portal, settings)
components/     UI (single-file components per surface)
lib/            types · mock data · global state (Context + useReducer)
app/globals.css theme token scopes (.theme-employee / .theme-client) + utilities
```
