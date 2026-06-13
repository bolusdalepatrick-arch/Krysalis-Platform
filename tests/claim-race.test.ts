/** The claim race and the won-deal conversion (PRD section 12), exercised
 *  against the real database through the same transaction bodies the
 *  actions run. Throwaway rows keep the seeded narrative untouched;
 *  cleanup runs in finally so the integrity suite stays valid either way. */
import { afterAll, describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import { applyClaim, applyConversion } from "@/lib/crm";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();

const USER_A = "u-test-crm-claimer-a";
const USER_B = "u-test-crm-claimer-b";
const CARD_RACE = "bk-test-race";
const CARD_REPEAT = "bk-test-repeat";
const TEST_ACCOUNT = "Brillhart Veterinary Group";

async function cleanup() {
  // Deals cascade their activities; cards detach via SetNull.
  await prisma.message.deleteMany({ where: { senderId: { in: [USER_A, USER_B] } } });
  await prisma.bookingCard.deleteMany({ where: { id: { in: [CARD_RACE, CARD_REPEAT] } } });
  await prisma.deal.deleteMany({ where: { ownerId: { in: [USER_A, USER_B] } } });
  const testAccount = await prisma.account.findFirst({ where: { name: TEST_ACCOUNT } });
  if (testAccount) {
    await prisma.user.deleteMany({ where: { accountId: testAccount.id } });
    await prisma.channel.deleteMany({ where: { accountId: testAccount.id } });
    await prisma.account.delete({ where: { id: testAccount.id } });
  }
  await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seedClaimFixtures() {
  await cleanup();
  await prisma.user.createMany({
    data: [
      {
        id: USER_A,
        email: "test-crm-a@krysalis.studio",
        name: "Test Claimer A",
        role: "EMPLOYEE",
        departmentId: "engineering",
      },
      {
        id: USER_B,
        email: "test-crm-b@krysalis.studio",
        name: "Test Claimer B",
        role: "EMPLOYEE",
        departmentId: "design",
      },
    ],
  });
  await prisma.bookingCard.create({
    data: {
      id: CARD_RACE,
      externalRef: "bk_test_race",
      name: "Avery Brillhart",
      email: "avery@brillhartvet.example",
      company: TEST_ACCOUNT,
      companySize: "2-10",
      automationGoal: "Appointment reminders eat the front desk's mornings.",
      slotStart: new Date("2026-06-20T16:00:00Z"),
      slotEnd: new Date("2026-06-20T16:30:00Z"),
      submittedAt: new Date("2026-06-12T08:00:00Z"),
    },
  });
}

const claim = (cardId: string, userId: string) =>
  prisma.$transaction((tx) => applyClaim(tx, cardId, { id: userId }), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

describe("the claim race (PRD 7.12)", () => {
  it("first claim wins; the second returns the winner's name and changes nothing", async () => {
    await seedClaimFixtures();

    const first = await claim(CARD_RACE, USER_A);
    expect(first.claimed).toBe(true);
    if (!first.claimed) return;

    // The winner's transaction opened the whole CRM thread.
    const card = await prisma.bookingCard.findUniqueOrThrow({
      where: { id: CARD_RACE },
      include: { deal: true },
    });
    expect(card.status).toBe("CLAIMED");
    expect(card.claimedById).toBe(USER_A);
    expect(card.deal?.stage).toBe("DISCOVERY");
    expect(card.deal?.source).toBe("WEBSITE");
    expect(card.deal?.ownerId).toBe(USER_A);

    const account = await prisma.account.findFirstOrThrow({
      where: { name: TEST_ACCOUNT },
      include: { contacts: true },
    });
    expect(account.contacts.some((c) => c.email === "avery@brillhartvet.example")).toBe(true);

    // The loser: ok false in the action's terms, and nothing moved.
    const second = await claim(CARD_RACE, USER_B);
    expect(second.claimed).toBe(false);
    if (second.claimed) return;
    expect(second.claimedByName).toBe("Test Claimer A");

    const after = await prisma.bookingCard.findUniqueOrThrow({ where: { id: CARD_RACE } });
    expect(after.claimedById).toBe(USER_A);
    expect(after.claimedAt?.toISOString()).toBe(card.claimedAt?.toISOString());
    expect(await prisma.deal.count({ where: { accountId: account.id } })).toBe(1);
    expect(
      await prisma.message.count({ where: { senderId: { in: [USER_A, USER_B] } } }),
    ).toBe(1);
  });

  it("attaches a repeat visitor to the existing account, case-insensitively", async () => {
    await prisma.bookingCard.create({
      data: {
        id: CARD_REPEAT,
        externalRef: "bk_test_repeat",
        name: "Rosa Calloway",
        email: "rosa@halcyondental.com",
        company: "halcyon dental partners",
        companySize: "11-50",
        automationGoal: "Second booking from the same clinic.",
        slotStart: new Date("2026-06-22T15:00:00Z"),
        slotEnd: new Date("2026-06-22T15:30:00Z"),
        submittedAt: new Date("2026-06-12T10:00:00Z"),
      },
    });
    const before = await prisma.contact.count({ where: { accountId: "a-halcyon" } });

    const outcome = await claim(CARD_REPEAT, USER_B);
    expect(outcome.claimed).toBe(true);
    if (!outcome.claimed) return;
    expect(outcome.accountId).toBe("a-halcyon");
    expect(outcome.accountName).toBe("Halcyon Dental Partners");
    // Rosa is already on file — no duplicate contact.
    expect(await prisma.contact.count({ where: { accountId: "a-halcyon" } })).toBe(before);

    // Restore the seeded shape for the integrity suite.
    await prisma.bookingCard.delete({ where: { id: CARD_REPEAT } });
    await prisma.deal.deleteMany({ where: { accountId: "a-halcyon", ownerId: USER_B } });
    await prisma.message.deleteMany({ where: { senderId: USER_B } });
  });
});

describe("the won-deal conversion (PRD 7.11, re-runnable)", () => {
  it("commits nothing when the conversion fails validation", async () => {
    const account = await prisma.account.findFirstOrThrow({ where: { name: TEST_ACCOUNT } });
    const deal = await prisma.deal.findFirstOrThrow({ where: { accountId: account.id } });
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "WON", value: new Prisma.Decimal("5200.00"), wonAt: new Date() },
    });

    // Worker pool above the deal's value: the draft-job validation fails,
    // and a converted: false outcome must not have flipped the account,
    // provisioned the thread, or created the portal user on the way down.
    const outcome = await prisma.$transaction((tx) =>
      applyConversion(tx, deal.id, {
        provisionPortalUser: true,
        draftJob: {
          title: "Overdrawn draft",
          brief: "Pool above value, must not commit anything.",
          description: "",
          departmentId: "engineering",
          workerPool: "9000.00",
        },
      }),
    );
    expect(outcome.converted).toBe(false);
    if (outcome.converted) return;
    expect(outcome.error).toMatch(/worker pool/i);

    const untouched = await prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      include: { channel: true, portalUsers: { where: { role: "CLIENT" } } },
    });
    expect(untouched.status).toBe("PROSPECT");
    expect(untouched.channel).toBeNull();
    expect(untouched.portalUsers).toHaveLength(0);
  });

  it("provisions thread, portal user, and the draft job; re-runs find-or-skip", async () => {
    const account = await prisma.account.findFirstOrThrow({ where: { name: TEST_ACCOUNT } });
    const deal = await prisma.deal.findFirstOrThrow({ where: { accountId: account.id } });
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "WON", value: new Prisma.Decimal("5200.00"), wonAt: new Date() },
    });

    const first = await prisma.$transaction((tx) =>
      applyConversion(tx, deal.id, {
        provisionPortalUser: true,
        accountKind: "BUSINESS",
        draftJob: {
          title: "Brillhart reminder automation",
          brief: "Front-desk reminder flows for a two-vet practice.",
          description: "",
          departmentId: "engineering",
          workerPool: "3400.00",
        },
      }),
    );
    expect(first.converted).toBe(true);
    if (!first.converted) return;
    expect(first.thread).toBe("created");
    expect(first.portalUser).toBe("created");
    expect(first.jobId).not.toBeNull();

    const after = await prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      include: { channel: true, portalUsers: true, jobs: true },
    });
    expect(after.status).toBe("ACTIVE");
    expect(after.channel?.kind).toBe("ACCOUNT");
    expect(after.portalUsers.some((u) => u.email === "avery@brillhartvet.example")).toBe(true);
    const job = after.jobs.find((j) => j.id === first.jobId);
    expect(job?.grossValue.toFixed(2)).toBe("5200.00");
    expect(job?.workerPool.toFixed(2)).toBe("3400.00");
    expect(job?.firmMargin.toFixed(2)).toBe("1800.00");
    expect(job?.dealId).toBe(deal.id);

    // Repeat business semantics: provisioning find-or-skips...
    const second = await prisma.$transaction((tx) =>
      applyConversion(tx, deal.id, { provisionPortalUser: true }),
    );
    expect(second.converted).toBe(true);
    if (!second.converted) return;
    expect(second.thread).toBe("existing");
    expect(second.portalUser).toBe("existing");
    expect(second.jobId).toBeNull();

    // ...but one deal opens at most one engagement.
    const third = await prisma.$transaction((tx) =>
      applyConversion(tx, deal.id, {
        provisionPortalUser: false,
        draftJob: {
          title: "Duplicate",
          brief: "Should not exist.",
          description: "",
          departmentId: "engineering",
          workerPool: "1000.00",
        },
      }),
    );
    expect(third.converted).toBe(false);
    if (third.converted) return;
    expect(third.error).toMatch(/already opened/);

    // Job cleanup here; the rest is shared cleanup in afterAll.
    if (first.jobId) {
      await prisma.job.delete({ where: { id: first.jobId } });
    }
  });
});
