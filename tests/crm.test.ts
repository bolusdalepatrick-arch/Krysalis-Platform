/** lib/crm.ts pure rules (PRD section 12): WON requires value, LOST
 *  requires a note, movement is free between working stages, and decided
 *  deals stay decided. Database-backed claim and conversion behavior lives
 *  in tests/claim-race.test.ts. */
import { describe, expect, it } from "vitest";
import type { DealStage } from "@prisma/client";
import { WORKING_STAGES, stageChangeBody, validateStageMove } from "@/lib/crm";

const open = (from: DealStage, to: DealStage, hasValue = false, note?: string) =>
  validateStageMove({ from, to, hasValue, note });

describe("stage movement rules", () => {
  it("moves freely between the four working stages", () => {
    for (const from of WORKING_STAGES) {
      for (const to of WORKING_STAGES) {
        if (from === to) continue;
        expect(open(from, to)).toBeNull();
      }
    }
  });

  it("rejects a move to the stage the deal is already in", () => {
    expect(open("PROPOSAL", "PROPOSAL")).toMatch(/already in Proposal/);
  });

  it("requires a value before WON", () => {
    expect(open("VERBAL", "WON", false)).toMatch(/value/i);
    expect(open("VERBAL", "WON", true)).toBeNull();
    expect(open("INBOUND", "WON", true)).toBeNull();
  });

  it("requires a plain-sentence reason before LOST", () => {
    expect(open("PROPOSAL", "LOST", true)).toMatch(/why it was lost/i);
    expect(open("PROPOSAL", "LOST", true, "  ")).toMatch(/why it was lost/i);
    expect(open("PROPOSAL", "LOST", true, "Chose to hire in-house; revisit Q4.")).toBeNull();
  });

  it("keeps decided deals decided", () => {
    expect(open("WON", "PROPOSAL", true)).toMatch(/decided deal/i);
    expect(open("LOST", "DISCOVERY", true, "note")).toMatch(/decided deal/i);
    expect(open("WON", "LOST", true, "note")).toMatch(/decided deal/i);
  });
});

describe("stage change activity body", () => {
  it("composes the seed register, note appended when given", () => {
    expect(stageChangeBody("PROPOSAL", "VERBAL")).toBe("Stage: PROPOSAL to VERBAL.");
    expect(stageChangeBody("PROPOSAL", "LOST", "Chose to hire in-house; revisit Q4.")).toBe(
      "Stage: PROPOSAL to LOST. Chose to hire in-house; revisit Q4.",
    );
    expect(stageChangeBody("VERBAL", "WON", "  ")).toBe("Stage: VERBAL to WON.");
  });
});
