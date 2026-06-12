/** The Shadow (PRD 7.3): an interface with a deterministic default
 *  implementation. A model-backed adapter may replace it behind the same
 *  interface (M8 stretch, gated on ANTHROPIC_API_KEY); the build never
 *  requires a key and runs fully offline without it. */

export interface ShadowDraft {
  jobId: string;
  body: string;
}

export interface ShadowAgent {
  draftProgressUpdate(jobId: string): Promise<ShadowDraft>;
}

/** Everything the deterministic Shadow is allowed to read (PRD 7.3):
 *  status, pool allocation, time to due date, latest delivered assets,
 *  and the last messages. Same facts in, same draft out. */
export interface ShadowFacts {
  jobId: string;
  jobTitle: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  /** 0–100, share of the worker pool covered by accepted splits. */
  poolAllocatedPct: number;
  /** Whole days until dueAt; negative when overdue; null when undated. */
  daysToDue: number | null;
  /** "Jul 17" style label for the due date; null when undated. */
  dueLabel: string | null;
  /** Titles of the most recently delivered assets, newest first. */
  latestAssets: string[];
  /** The last (up to) 10 human messages, oldest to newest. */
  recentMessages: { sender: string; body: string }[];
}
