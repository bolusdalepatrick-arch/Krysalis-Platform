/** Seed integrity gates (PRD section 12) — run against a seeded database. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();

afterAll(() => prisma.$disconnect());

describe("seed integrity", () => {
  it("every job satisfies workerPool + firmMargin = grossValue", async () => {
    const jobs = await prisma.job.findMany();
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(
        job.workerPool.add(job.firmMargin).equals(job.grossValue),
        `${job.title} breaks the money invariant`,
      ).toBe(true);
    }
  });

  it("accepted splits never exceed the worker pool", async () => {
    const jobs = await prisma.job.findMany({
      include: { bids: { where: { status: "ACCEPTED" } } },
    });
    for (const job of jobs) {
      const allocated = job.bids.reduce(
        (sum, bid) => sum.add(bid.proposedSplit),
        job.workerPool.sub(job.workerPool),
      );
      expect(
        allocated.lte(job.workerPool),
        `${job.title} over-allocates its pool`,
      ).toBe(true);
    }
  });

  it("every user's experiencePoints equals the sum of their XpEvents", async () => {
    const users = await prisma.user.findMany({ include: { xpEvents: true } });
    expect(users.length).toBeGreaterThan(30);
    for (const user of users) {
      const sum = user.xpEvents.reduce((total, event) => total + event.amount, 0);
      expect(user.experiencePoints, `${user.name} ledger mismatch`).toBe(sum);
    }
  });

  it("every CLAIMED booking card has a deal and a claimer", async () => {
    const claimed = await prisma.bookingCard.findMany({ where: { status: "CLAIMED" } });
    expect(claimed.length).toBe(2);
    for (const card of claimed) {
      expect(card.claimedById, `${card.company} card has no claimer`).not.toBeNull();
      expect(card.dealId, `${card.company} card has no deal`).not.toBeNull();
      expect(card.claimedAt).not.toBeNull();
    }
  });

  it("every WON deal has a value", async () => {
    const won = await prisma.deal.findMany({ where: { stage: "WON" } });
    expect(won.length).toBeGreaterThan(0);
    for (const deal of won) {
      expect(deal.value, `${deal.title} won without a value`).not.toBeNull();
      expect(deal.wonAt).not.toBeNull();
    }
  });

  it("a job linked to a deal carries the deal's value as its gross", async () => {
    const linked = await prisma.job.findMany({
      where: { dealId: { not: null } },
      include: { deal: true },
    });
    expect(linked.length).toBeGreaterThan(0);
    for (const job of linked) {
      expect(job.deal?.value && job.grossValue.equals(job.deal.value)).toBe(true);
    }
  });

  it("seeded shape matches PRD section 10", async () => {
    expect(await prisma.department.count()).toBe(4);
    expect(await prisma.account.count()).toBe(9);
    expect(await prisma.deal.count()).toBe(9);
    expect(await prisma.bookingCard.count()).toBe(3);
    expect(await prisma.job.count()).toBe(14);
    expect(await prisma.course.count()).toBe(6);
    const byStatus = await prisma.job.groupBy({ by: ["status"], _count: true });
    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
    expect(statusMap).toEqual({ OPEN: 4, ASSIGNED: 2, IN_PROGRESS: 3, REVIEW: 2, COMPLETED: 3 });
    const employees = await prisma.user.count({
      where: { role: { in: ["EMPLOYEE", "MODERATOR"] } },
    });
    expect(employees).toBe(24);
    expect(await prisma.user.count({ where: { isSystem: true } })).toBe(2);
    expect(await prisma.user.count({ where: { role: "CLIENT" } })).toBe(6);
  });

  it("Noor is the one employee with onboarding pending", async () => {
    const pending = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MODERATOR", "ADMIN"] }, onboardingCompletedAt: null },
    });
    expect(pending.map((u) => u.name)).toEqual(["Noor Haddad"]);
    const noorCompletions = await prisma.lessonCompletion.count({
      where: { memberId: "u-noor" },
    });
    expect(noorCompletions).toBe(1);
    // "Nothing posted yet" (PRD section 10) — her welcome checklist must
    // demo mid-progress, so she has no messages and no forum posts.
    expect(await prisma.message.count({ where: { senderId: "u-noor" } })).toBe(0);
    expect(await prisma.forumPost.count({ where: { authorId: "u-noor" } })).toBe(0);
  });

  it("every outline course ships at least two finished lessons", async () => {
    const courses = await prisma.course.findMany({
      include: { modules: { include: { lessons: true } } },
    });
    for (const course of courses) {
      const finished = course.modules
        .flatMap((m) => m.lessons)
        .filter((lesson) => lesson.body.trim().length > 0).length;
      expect(finished, `${course.title} has too few finished lessons`).toBeGreaterThanOrEqual(2);
    }
  });

  it("a converted job never predates its deal's win", async () => {
    const linked = await prisma.job.findMany({
      where: { dealId: { not: null } },
      include: { deal: true },
    });
    for (const job of linked) {
      expect(
        job.deal?.wonAt && job.createdAt >= job.deal.wonAt,
        `${job.title} predates its won deal`,
      ).toBe(true);
    }
  });

  it("the pipeline covers every stage per section 10", async () => {
    const byStage = await prisma.deal.groupBy({ by: ["stage"], _count: true });
    const stageMap = Object.fromEntries(byStage.map((s) => [s.stage, s._count]));
    expect(stageMap).toEqual({ INBOUND: 2, DISCOVERY: 2, PROPOSAL: 2, VERBAL: 1, WON: 1, LOST: 1 });
    const lost = await prisma.deal.findFirst({ where: { stage: "LOST" } });
    expect(lost?.lostReason).toBeTruthy();
  });

  it("a pending Shadow draft exists with real figures from its job", async () => {
    const draft = await prisma.message.findFirst({
      where: { isShadowDraft: true },
      include: { channel: true },
    });
    expect(draft).not.toBeNull();
    expect(draft?.channel.jobId).toBe("j-tidegate-claims-intake");
    expect(draft?.body).toContain("90 percent of the worker pool");
    expect(draft?.body).toContain("Jul 17");
  });

  it("tiers span Larva to Imago", async () => {
    const employees = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MODERATOR", "ADMIN"] } },
    });
    const tiers = new Set(employees.map((u) => u.currentTierLevel));
    expect(tiers.has(5), "at least one Imago").toBe(true);
    expect(employees.filter((u) => u.currentTierLevel === 1).length).toBeGreaterThanOrEqual(2);
  });

  it("the persona switcher's five users exist with the right roles", async () => {
    const personas = await prisma.user.findMany({
      where: { id: { in: ["u-mara", "u-daniel", "u-priya", "u-ruth", "u-mateo"] } },
      include: { account: true },
    });
    expect(personas).toHaveLength(5);
    const byId = Object.fromEntries(personas.map((p) => [p.id, p]));
    expect(byId["u-mara"].role).toBe("ADMIN");
    expect(byId["u-daniel"].role).toBe("MODERATOR");
    expect(byId["u-priya"].role).toBe("EMPLOYEE");
    expect(byId["u-ruth"].role).toBe("CLIENT");
    expect(byId["u-ruth"].account?.kind).toBe("BUSINESS");
    expect(byId["u-ruth"].portalStartDismissedAt).toBeNull();
    expect(byId["u-mateo"].role).toBe("CLIENT");
    expect(byId["u-mateo"].account?.kind).toBe("INDIVIDUAL");
    expect(byId["u-mateo"].detailsConfirmedAt).not.toBeNull();
    expect(byId["u-mateo"].portalStartDismissedAt).toBeNull();
  });

  it("every active account has its thread; prospects have none", async () => {
    const accounts = await prisma.account.findMany({ include: { channel: true } });
    for (const account of accounts) {
      if (account.status === "ACTIVE") {
        expect(account.channel, `${account.name} is missing its thread`).not.toBeNull();
      } else {
        expect(account.channel).toBeNull();
      }
    }
  });
});
