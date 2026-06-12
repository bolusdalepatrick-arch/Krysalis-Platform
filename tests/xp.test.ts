import { describe, expect, it } from "vitest";
import {
  FORUM_XP_DAILY_CAP,
  TIERS,
  XP_AMOUNTS,
  remainingForumXpToday,
  tierForXp,
} from "@/lib/xp";

describe("xp amounts", () => {
  it("matches the PRD 7.2 table", () => {
    expect(XP_AMOUNTS).toEqual({
      LESSON_COMPLETED: 15,
      COURSE_COMPLETED: 100,
      BID_ACCEPTED: 40,
      JOB_COMPLETED: 120,
      DEAL_WON: 150,
      ONBOARDING_COMPLETED: 50,
      FORUM_POST: 5,
    });
    expect(FORUM_XP_DAILY_CAP).toBe(25);
  });
});

describe("tiers", () => {
  it("holds the boundary at 249/250", () => {
    expect(tierForXp(249).name).toBe("Larva");
    expect(tierForXp(250).name).toBe("Instar");
  });

  it("maps every threshold to its own tier", () => {
    for (const tier of TIERS) {
      expect(tierForXp(tier.threshold).level).toBe(tier.level);
      if (tier.threshold > 0) {
        expect(tierForXp(tier.threshold - 1).level).toBe(tier.level - 1);
      }
    }
  });

  it("caps at Imago", () => {
    expect(tierForXp(999999).name).toBe("Imago");
  });
});

describe("forum daily cap", () => {
  it("awards full XP until the cap", () => {
    expect(remainingForumXpToday(0)).toBe(5);
    expect(remainingForumXpToday(20)).toBe(5);
  });

  it("awards nothing at or past the cap", () => {
    expect(remainingForumXpToday(25)).toBe(0);
    expect(remainingForumXpToday(30)).toBe(0);
  });

  it("awards a partial amount approaching the cap", () => {
    expect(remainingForumXpToday(22)).toBe(3);
  });
});
