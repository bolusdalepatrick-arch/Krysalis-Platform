import type { ShadowAgent, ShadowDraft, ShadowFacts } from "./types";

/** The deterministic Shadow (PRD 7.3): composes a 3–5 sentence progress
 *  update from job facts with sentence templates. No network, no model;
 *  the same facts always produce the same draft. */

const STATUS_PHRASE: Record<ShadowFacts["status"], string> = {
  OPEN: "open for bids",
  ASSIGNED: "staffed and ready to start",
  IN_PROGRESS: "in progress",
  REVIEW: "in review",
  COMPLETED: "complete",
};

function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const end = cleaned.search(/[.?]\s|[.?]$/);
  const sentence = end === -1 ? cleaned : cleaned.slice(0, end + 1);
  return sentence.length > 140 ? `${sentence.slice(0, 137).trimEnd()}…` : sentence;
}

export function composeProgressUpdate(facts: ShadowFacts): string {
  const sentences: string[] = [];

  sentences.push(
    `${facts.jobTitle} is ${STATUS_PHRASE[facts.status]} with ${Math.round(
      facts.poolAllocatedPct,
    )} percent of the worker pool assigned.`,
  );

  if (facts.daysToDue !== null && facts.dueLabel) {
    if (facts.daysToDue >= 0) {
      sentences.push(
        `There are ${facts.daysToDue} days to the ${facts.dueLabel} due date.`,
      );
    } else {
      sentences.push(
        `The ${facts.dueLabel} due date passed ${Math.abs(facts.daysToDue)} days ago.`,
      );
    }
  }

  if (facts.latestAssets.length > 0) {
    const names = facts.latestAssets.slice(0, 2).join(" and ");
    sentences.push(`Latest delivered files: ${names}.`);
  }

  const lastMessage = facts.recentMessages.at(-1);
  if (lastMessage) {
    sentences.push(
      `Most recent note, from ${lastMessage.sender}: ${firstSentence(lastMessage.body)}`,
    );
  }

  if (facts.status !== "COMPLETED" && facts.dueLabel) {
    sentences.push(`Delivery is tracking toward the ${facts.dueLabel} review.`);
  }

  return sentences.slice(0, 5).join(" ");
}

/** Wraps a facts loader (database-backed in the app, fixture-backed in
 *  tests and the seed) behind the ShadowAgent interface. */
export function createDeterministicShadow(
  loadFacts: (jobId: string) => Promise<ShadowFacts>,
): ShadowAgent {
  return {
    async draftProgressUpdate(jobId: string): Promise<ShadowDraft> {
      const facts = await loadFacts(jobId);
      return { jobId, body: composeProgressUpdate(facts) };
    },
  };
}
