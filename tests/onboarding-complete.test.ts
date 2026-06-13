/** Employee first-week completion (PRD 7.13, §12): the conditional stamp on
 *  the null timestamp awards ONBOARDING_COMPLETED (50 XP) exactly once, even
 *  when two requests race. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { applyOnboardingCompletion } from "@/lib/onboarding";
import { XP_AMOUNTS } from "@/lib/xp";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const USER = "u-test-onboarding";

async function cleanup() {
  await prisma.xpEvent.deleteMany({ where: { userId: USER } });
  await prisma.user.deleteMany({ where: { id: USER } });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seed(xp = 0) {
  await cleanup();
  await prisma.user.create({
    data: {
      id: USER,
      email: "test-onboarding@krysalis.studio",
      name: "Test Onboarding",
      title: "New Hire",
      role: "EMPLOYEE",
      departmentId: "design",
      experiencePoints: xp,
      onboardingCompletedAt: null,
    },
  });
}

const apply = () => prisma.$transaction((tx) => applyOnboardingCompletion(tx, USER));

describe("applyOnboardingCompletion", () => {
  it("stamps once and awards exactly one 50 XP event", async () => {
    await seed();
    const first = await apply();
    expect(first.awarded).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(user.onboardingCompletedAt).not.toBeNull();
    expect(user.experiencePoints).toBe(XP_AMOUNTS.ONBOARDING_COMPLETED);

    // A second call writes nothing — the null-timestamp guard already flipped.
    const second = await apply();
    expect(second.awarded).toBe(false);
    const events = await prisma.xpEvent.count({
      where: { userId: USER, reason: "ONBOARDING_COMPLETED" },
    });
    expect(events).toBe(1);
  });

  it("awards exactly once when two completions race", async () => {
    await seed();
    const [a, b] = await Promise.all([apply(), apply()]);
    expect([a.awarded, b.awarded].filter(Boolean)).toHaveLength(1);
    const events = await prisma.xpEvent.count({
      where: { userId: USER, reason: "ONBOARDING_COMPLETED" },
    });
    expect(events).toBe(1);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: USER } });
    expect(user.experiencePoints).toBe(XP_AMOUNTS.ONBOARDING_COMPLETED);
  });

  it("crosses the Instar tier when completion pushes XP over 250", async () => {
    await seed(220); // 220 + 50 = 270 -> Instar (level 2)
    const result = await apply();
    expect(result.awarded).toBe(true);
    expect(result.tierChanged).toBe(true);
    expect(result.tier?.level).toBe(2);
  });
});
