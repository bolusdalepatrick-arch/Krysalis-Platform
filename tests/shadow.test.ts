import { afterEach, describe, expect, it } from "vitest";
import { composeProgressUpdate, createDeterministicShadow } from "@/lib/shadow/deterministic";
import { draftBodyFromFacts } from "@/lib/shadow/agent";
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

describe("shadow selector (PRD 7.3, M8 stretch — additive)", () => {
  const original = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = original;
  });

  it("defaults to the deterministic draft when no key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(await draftBodyFromFacts(FACTS)).toBe(composeProgressUpdate(FACTS));
  });

  it("falls back to the deterministic draft when the adapter throws", async () => {
    // Key present, but the network is stubbed to fail — offline and
    // deterministic. The selector must still return a usable draft.
    process.env.ANTHROPIC_API_KEY = "sk-test-not-real";
    const realFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("offline"));
    try {
      expect(await draftBodyFromFacts(FACTS)).toBe(composeProgressUpdate(FACTS));
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
