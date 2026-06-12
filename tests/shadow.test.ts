import { describe, expect, it } from "vitest";
import { composeProgressUpdate, createDeterministicShadow } from "@/lib/shadow/deterministic";
import type { ShadowFacts } from "@/lib/shadow/types";

const FACTS: ShadowFacts = {
  jobId: "j-test",
  jobTitle: "Meridian rebrand",
  status: "IN_PROGRESS",
  poolAllocatedPct: 82.4,
  daysToDue: 12,
  dueLabel: "Jun 24",
  latestAssets: ["Meridian wordmark, third round", "Color study"],
  recentMessages: [
    { sender: "June Park", body: "Third round of the wordmark is up. The narrow counters survived the small sizes." },
  ],
};

describe("deterministic shadow", () => {
  it("produces the same draft for the same facts", () => {
    expect(composeProgressUpdate(FACTS)).toBe(composeProgressUpdate(FACTS));
    expect(composeProgressUpdate({ ...FACTS })).toBe(composeProgressUpdate(FACTS));
  });

  it("composes three to five sentences from real figures", () => {
    const draft = composeProgressUpdate(FACTS);
    const sentences = draft.match(/[.!?](\s|$)/g) ?? [];
    expect(sentences.length).toBeGreaterThanOrEqual(3);
    expect(sentences.length).toBeLessThanOrEqual(5);
    expect(draft).toContain("82 percent");
    expect(draft).toContain("12 days");
    expect(draft).toContain("Meridian wordmark, third round");
    expect(draft).toContain("June Park");
  });

  it("changes when the facts change", () => {
    const other = composeProgressUpdate({ ...FACTS, poolAllocatedPct: 50 });
    expect(other).not.toBe(composeProgressUpdate(FACTS));
  });

  it("handles undated jobs and empty channels", () => {
    const draft = composeProgressUpdate({
      ...FACTS,
      daysToDue: null,
      dueLabel: null,
      latestAssets: [],
      recentMessages: [],
    });
    expect(draft).toContain("in progress");
    expect(draft).not.toContain("due date");
  });

  it("serves drafts through the ShadowAgent interface", async () => {
    const agent = createDeterministicShadow(async () => FACTS);
    const draft = await agent.draftProgressUpdate("j-test");
    expect(draft.jobId).toBe("j-test");
    expect(draft.body).toBe(composeProgressUpdate(FACTS));
  });
});
