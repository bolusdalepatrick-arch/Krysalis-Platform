/** The M8 acceptance (PRD 7.13, §13): the seeded Noor Haddad persona walks
 *  her first-week checklist 1 of 3 → complete, earning exactly one
 *  ONBOARDING_COMPLETED (50 XP), with the derivation reflecting each step.
 *  Noor is the live seed row, so every mutation is restored in finally to
 *  keep the seed-integrity suite valid. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { firstWeekStatus } from "@/lib/queries/onboarding";
import { applyOnboardingCompletion } from "@/lib/onboarding";
import { XP_AMOUNTS } from "@/lib/xp";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const NOOR = "u-noor";
const TEST_MSG = "m-test-noor-checkin";

afterAll(async () => {
  await prisma.$disconnect();
});

const noor = () => prisma.user.findUniqueOrThrow({ where: { id: NOOR } });

describe("Noor Haddad walks the first week (PRD 7.13)", () => {
  it("derives 1 of 3, advances to 3 of 3, and completes with one 50 XP award", async () => {
    const before = await noor();
    const designChannel = await prisma.channel.findFirstOrThrow({
      where: { kind: "DEPARTMENT", department: { slug: "design" } },
      select: { id: true },
    });

    try {
      // Starting state: only the Design primer is done (entry has no title
      // yet, no department message).
      const start = await firstWeekStatus(before);
      expect(start.completed).toBe(false);
      expect(start.steps).toEqual({ entry: false, primer: true, checkIn: false });
      expect(start.doneCount).toBe(1);

      // Step 1 — confirm entry by setting a title (what updateProfile does).
      await prisma.user.update({ where: { id: NOOR }, data: { title: "Junior Designer" } });
      let status = await firstWeekStatus(await noor());
      expect(status.doneCount).toBe(2);
      expect(status.steps.entry).toBe(true);

      // Step 3 — check in: a message in the design channel (what sendMessage
      // does).
      await prisma.message.create({
        data: {
          id: TEST_MSG,
          channelId: designChannel.id,
          senderId: NOOR,
          body: "Starting on the Fernwell collateral this week — say hello.",
        },
      });
      status = await firstWeekStatus(await noor());
      expect(status.doneCount).toBe(3);
      expect(status.steps).toEqual({ entry: true, primer: true, checkIn: true });

      // Finish setup: exactly one ONBOARDING_COMPLETED, 50 XP on top of her
      // one lesson's 15.
      const award = await prisma.$transaction((tx) => applyOnboardingCompletion(tx, NOOR));
      expect(award.awarded).toBe(true);

      const done = await noor();
      expect(done.onboardingCompletedAt).not.toBeNull();
      expect(done.experiencePoints).toBe(before.experiencePoints + XP_AMOUNTS.ONBOARDING_COMPLETED);
      const events = await prisma.xpEvent.count({
        where: { userId: NOOR, reason: "ONBOARDING_COMPLETED" },
      });
      expect(events).toBe(1);

      // The rail entry derives from completion — now gone.
      expect((await firstWeekStatus(done)).completed).toBe(true);
    } finally {
      // Restore Noor's seeded mid-onboarding state.
      await prisma.message.deleteMany({ where: { id: TEST_MSG } });
      await prisma.xpEvent.deleteMany({ where: { userId: NOOR, reason: "ONBOARDING_COMPLETED" } });
      await prisma.user.update({
        where: { id: NOOR },
        data: {
          title: before.title,
          experiencePoints: before.experiencePoints,
          currentTierLevel: before.currentTierLevel,
          onboardingCompletedAt: before.onboardingCompletedAt,
        },
      });
    }
  });
});
