import type { GraphTone } from "@/lib/graph/build";

/** Tone names resolve to --color-* tokens (PRD rule 5.1.3: no hex in
 *  components). SVG strokes need a CSS value, so these are var() refs. */
export const TONE_VAR: Record<GraphTone, string> = {
  "line-strong": "var(--color-line-strong)",
  accent: "var(--color-accent)",
  info: "var(--color-info)",
  secondary: "var(--color-text-secondary)",
  warn: "var(--color-warn)",
  ok: "var(--color-ok)",
};

/** The legend (PRD 7.6) — every node kind that can appear on the map. */
export const LEGEND: { label: string; size: number; tone: GraphTone }[] = [
  { label: "Department", size: 28, tone: "line-strong" },
  { label: "Client account", size: 24, tone: "info" },
  { label: "Job — in flight", size: 20, tone: "warn" },
  { label: "Job — completed", size: 20, tone: "ok" },
  { label: "Person", size: 16, tone: "accent" },
  { label: "Asset", size: 12, tone: "secondary" },
];
