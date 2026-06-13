import type { ShadowFacts } from "./types";

/** The model-backed Shadow adapter (PRD 7.3, M8 stretch — additive, never a
 *  dependency). Calls the Anthropic Messages API over `fetch` — no SDK, so
 *  nothing is added to the §9 allowlist and the build never imports it unless
 *  ANTHROPIC_API_KEY is set. It produces a draft from the *same* facts the
 *  deterministic agent reads (PRD 7.3); it never widens the Shadow's inputs.
 *  The caller falls back to the deterministic agent on any throw. */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You are the Shadow, a draft assistant inside a professional-services firm's internal tool. You write a short client-facing progress update about one engagement, which a person on the team will review, edit, and approve before it is ever sent.

Rules, all absolute:
- Three to five sentences when the facts give it material; fewer if they do not. Never pad to length.
- Plain, competent voice — a colleague's shorthand. No marketing tone.
- No exclamation marks. No emojis. Never use the words: seamless, effortless, supercharge, unleash, unlock, empower, elevate, revolutionize, delightful, blazing, cutting-edge.
- State only what the facts support. Do not invent figures, dates, names, or commitments.
- Plain prose only — no headings, no bullet points, no preamble like "Here is the update". Output the update itself and nothing else.`;

function userPrompt(facts: ShadowFacts): string {
  const lines = [
    `Engagement: ${facts.jobTitle}`,
    `Status: ${facts.status}`,
    `Worker pool assigned: ${Math.round(facts.poolAllocatedPct)} percent`,
  ];
  if (facts.daysToDue !== null && facts.dueLabel) {
    lines.push(
      facts.daysToDue >= 0
        ? `Due ${facts.dueLabel} (${facts.daysToDue} days out)`
        : `Due ${facts.dueLabel} (${Math.abs(facts.daysToDue)} days overdue)`,
    );
  }
  if (facts.latestAssets.length > 0) {
    lines.push(`Recently delivered: ${facts.latestAssets.join(", ")}`);
  }
  if (facts.recentMessages.length > 0) {
    lines.push(
      "Recent team messages:",
      ...facts.recentMessages.map((m) => `- ${m.sender}: ${m.body}`),
    );
  }
  return `Write the progress update from these facts only.\n\n${lines.join("\n")}`;
}

export async function anthropicProgressUpdate(facts: ShadowFacts): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt(facts) }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API answered ${response.status}.`);
  }
  const data: unknown = await response.json();
  const text = extractText(data)?.trim();
  // A whitespace-only completion is no draft — throw so the caller falls
  // back to the deterministic agent rather than storing a blank draft.
  if (!text) throw new Error("Anthropic API returned no text.");
  return text;
}

function extractText(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("content" in data)) return null;
  const content = (data as { content: unknown }).content;
  if (!Array.isArray(content)) return null;
  const parts = content
    .filter(
      (block): block is { type: string; text: string } =>
        typeof block === "object" &&
        block !== null &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string",
    )
    .map((block) => block.text);
  return parts.length > 0 ? parts.join("") : null;
}
