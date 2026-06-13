/** lib/progression.ts awardForumXp (PRD 7.2): 5 per post/reply, capped at
 *  25/day, with the tier-up surfaced for the toast. Exercised against the
 *  real database through the same body the forum action runs. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { awardForumXp } from "@/lib/progression";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const USER = "u-test-forum-xp";
const NOW = new Date("2026-06-13T10:00:00");

async function cleanup() {
  await prisma.xpEvent.deleteMany({ where: { userId: USER } });
  await prisma.user.deleteMany({ where: { id: USER } });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const award = (refId: string, now = NOW) =>
  prisma.$transaction((tx) => awardForumXp(tx, USER, refId, now));

describe("forum XP cap and tier-up (PRD 7.2)", () => {
  it("awards 5 per post up to 25/day, then nothing, and reports the tier crossing", async () => {
    await cleanup();
    // 245 XP — one Instar-threshold (250) post away from a tier-up.
    await prisma.user.create({
      data: {
        id: USER,
        email: "test-forum-xp@krysalis.studio",
        name: "Test Forum XP",
        role: "EMPLOYEE",
        departmentId: "engineering",
        experiencePoints: 245,
        currentTierLevel: 1,
      },
    });

    // First post crosses 245 -> 250: Instar, tierChanged.
    const first = await award("post-1");
    expect(first.awarded).toBe(true);
    expect(first.tierChanged).toBe(true);
    expect(first.tier?.level).toBe(2);

    // Posts 2–5 each award 5, no further tier change (250 -> 270).
    for (let i = 2; i <= 5; i++) {
      const r = await award(`post-${i}`);
      expect(r.awarded).toBe(true);
      expect(r.tierChanged).toBe(false);
    }

    // Day total is now 25 — the cap. The 6th awards nothing.
    const sixth = await award("post-6");
    expect(sixth.awarded).toBe(false);

    const events = await prisma.xpEvent.findMany({
      where: { userId: USER, reason: "FORUM_POST" },
    });
    expect(events).toHaveLength(5);
    expect(events.reduce((s, e) => s + e.amount, 0)).toBe(25);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(user.experiencePoints).toBe(270); // 245 + 25
    expect(user.currentTierLevel).toBe(2);

    // A post on a different day awards again — the cap is per-day.
    const nextDay = await award("post-next", new Date("2026-06-14T09:00:00"));
    expect(nextDay.awarded).toBe(true);
  });
});
