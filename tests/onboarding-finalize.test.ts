/** finalizeJoblessSetup (PRD 7.13, pre-M7 ruling): a job-less individual who
 *  finishes the two interactive steps has step 3 durably stamped, so a later
 *  staffed engagement never re-strands the collapsed strip. A client with a
 *  job keeps the explicit "Mark as reviewed" path. */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { finalizeJoblessSetup } from "@/lib/onboarding";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const ACCOUNT = "a-test-finalize";
const USER = "u-test-finalize";

async function cleanup() {
  await prisma.job.deleteMany({ where: { accountId: ACCOUNT } });
  await prisma.user.deleteMany({ where: { id: USER } });
  await prisma.account.deleteMany({ where: { id: ACCOUNT } });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seed(opts: { detailsConfirmed: boolean; dismissed: boolean }) {
  await cleanup();
  await prisma.account.create({
    data: { id: ACCOUNT, name: "Test Finalize Account", kind: "INDIVIDUAL", status: "ACTIVE" },
  });
  await prisma.user.create({
    data: {
      id: USER,
      email: "test-finalize@krysalis.studio",
      name: "Test Finalize",
      role: "CLIENT",
      accountId: ACCOUNT,
      detailsConfirmedAt: opts.detailsConfirmed ? new Date() : null,
      portalStartDismissedAt: opts.dismissed ? new Date() : null,
      briefReviewedAt: null,
    },
  });
}

const run = () => prisma.$transaction((tx) => finalizeJoblessSetup(tx, USER));
const brief = async () =>
  (await prisma.user.findUniqueOrThrow({ where: { id: USER } })).briefReviewedAt;

describe("finalizeJoblessSetup", () => {
  it("stamps briefReviewedAt once a job-less individual finishes both steps", async () => {
    await seed({ detailsConfirmed: true, dismissed: true });
    expect(await run()).toBe(true);
    expect(await brief()).not.toBeNull();
    // Idempotent: a second pass doesn't re-stamp.
    expect(await run()).toBe(false);
  });

  it("does nothing until both interactive steps are done", async () => {
    await seed({ detailsConfirmed: true, dismissed: false });
    expect(await run()).toBe(false);
    expect(await brief()).toBeNull();
  });

  it("leaves the explicit review path when the account has a staffed job", async () => {
    await seed({ detailsConfirmed: true, dismissed: true });
    await prisma.job.create({
      data: {
        id: "j-test-finalize",
        title: "Vargas-style engagement",
        brief: "x",
        description: "",
        status: "IN_PROGRESS",
        grossValue: "1800.00",
        workerPool: "1100.00",
        firmMargin: "700.00",
        accountId: ACCOUNT,
        departmentId: "design",
      },
    });
    expect(await run()).toBe(false);
    expect(await brief()).toBeNull(); // they must click "Mark as reviewed"
  });
});
