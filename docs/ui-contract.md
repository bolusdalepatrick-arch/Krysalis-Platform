# UI contract — how every Krysalis screen is built

Binding summary of PRD sections 5–6 for anyone writing a page or component.
PRD.md wins on conflict. Violations are bugs.

## Tokens (the only colors)

Tailwind utilities generated from the theme scopes — components never know
which theme they are in:

- Backgrounds: `bg-base` (page), `bg-surface` (panels, rails, rows),
  `bg-raised` (popovers, composer, active cards), `bg-inset` (wells, input
  interiors), `bg-accent-soft` (selected row / active tab wash).
- Lines: `border-line` (default hairline), `border-line-strong` (table header
  rule, emphasized dividers). Structure with 1px lines, not shadows.
- Text: `text-primary`, `text-secondary` (supporting), `text-muted`
  (timestamps, placeholders), `text-accent` (links, active nav), `text-ok`,
  `text-warn`, `text-danger`, `text-info`, `text-gold` (XP/tiers/earnings only).
- Fills: `bg-accent text-accent-ink` for the primary action;
  `hover:bg-accent-hover`. Status colors are never fills (outline badges via
  `StatusBadge`).
- Never: hex values, Tailwind palette classes (they do not compile — the stock
  palette is wiped), arbitrary color values, gradients, `backdrop-blur`, glow
  shadows. `--shadow-raise` (via `style={{ boxShadow: "var(--shadow-raise)" }}`)
  is allowed on raised cards/popovers only; it is `none` in the employee theme.
- One sanctioned hex exception outside `app/globals.css`: the
  `viewport.themeColor` literals in `app/layout.tsx` (browser chrome only —
  Next.js cannot read CSS custom properties there). They mirror the two
  `--color-bg-base` values; change them together with the tokens.

## Type

- Faces: default is the UI grotesk. `.figure` (or `font-mono` utility) for
  money, XP, counts, timestamps, IDs, table numerics — always tabular.
  `.prose-serif` / `<Markdown>` for editorial bodies only (guide, lessons, job
  descriptions). Never serif for UI chrome.
- Sizes: `text-2xs` (eyebrows) `text-xs` `text-sm` `text-md` (employee body)
  `text-base` (client body) `text-lg` `text-xl` `text-2xl` (login masthead
  only). Headings: `font-bold tracking-[-0.01em]`, set close to body size —
  hierarchy comes from weight, spacing, and eyebrows, not display sizes.
- Eyebrows: use `<Eyebrow>` or `.eyebrow` to caption every panel
  ("OPEN POSTINGS", "WORKER POOL"). Write them in sentence case in JSX; the
  class uppercases.

## Space, radius, density

- Padding from 8/12/16/24/32 (`p-2 p-3 p-4 p-6 p-8`). Page gutter: `px-6`.
  Dense rail rows may use 10px horizontal padding (`px-2.5`) — ruling,
  post-M1; everything else stays on the set.
- Employee hub: table rows `h-9` (36px), list rows `h-11` (44px), body
  `text-md`. Client portal: rows ~52px (`h-13` / `py-3.5`), body `text-base`.
- Radii: `rounded-s` (inputs, tags, buttons), `rounded-m` (cards, panels),
  `rounded-l` (modals, portal masthead). `rounded-full` only for the
  role-switcher pill and status badges. Nothing arbitrary.

## Tables vs cards

Tabular data (bids, assets, leaderboards, users, deals, contacts) is a real
`<table>`: eyebrow-styled `<th>` (left-aligned; money columns right-aligned),
`border-b border-line-strong` under the header row, `border-b border-line`
between rows, money/dates in `.figure`. Cards are reserved for marketplace
postings and course tiles.

## Money, dates, people

- `formatMoney` → `$6,500.00`, mono, right-aligned in tables. Em dash (—) when
  unset. Deltas via `text-ok`/`text-danger` text, never fills.
- `formatDate` → `Jun 12, 2026` in tables; `formatDayContext` → "Thursday,
  June 12" as page context; `formatChatTime` inside chat only.
- People: full names, `<AvatarBadge>` initials; names link to
  `/dashboard/people/[id]`. Tier badges: `StatusBadge tone="gold"`.

## Icons

`lucide-react`, `strokeWidth={1.5}`, sizes 16 (inline) / 18 (nav, buttons) /
20 (page headers) only. Icons inherit `currentColor`; never decoratively
colored, never inside headings, never where a word is clearer.

## Voice (PRD 5.7)

Sentence case. No exclamation marks. No greetings, no cheer, no apology. No:
seamless, effortless, supercharge, unleash, unlock, empower, elevate,
revolutionize, delightful, blazing, cutting-edge, "Oops", "Uh oh", "Hang
tight", "Welcome back". Buttons name the exact outcome ("Place bid"). Empty
states say what the space is for and what fills it ("No open postings in
Engineering. New client work appears here as contracts are signed."). Errors:
what happened, then the next action.

## Structure

- Server Components by default; `"use client"` only on interactive leaves.
- One component per file, PascalCase, ~200 lines max — split beyond that.
- Pages start with `<PageHeader eyebrow title meta actions>` (employee hub).
- M0 note: actions that need the database render as `disabled` buttons with
  their real labels — no placeholder copy, no fake handlers.

## Shared primitives

`components/Eyebrow`, `components/PageHeader`, `components/AvatarBadge`,
`components/StatusBadge`, `components/Markdown`, `components/ChrysalisGlyph`
(Shadow-produced content only), `components/crm/BookingCardPanel` (booking
cards only — never the glyph). Mock data: import from `@/lib/mock`; formatting
from `@/lib/format`; personas from `@/lib/personas`.
