/** The M7 isolation guarantees (PRD 7.8), pinned server-side — pure access
 *  guards plus a database-backed cross-account thread check. Mirrors how M4
 *  pinned "a CLIENT planted in memberIds gets nothing." */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  canViewAccount,
  employeeAreaRedirect,
  portalAreaRedirect,
} from "@/lib/access";
import { canViewChannel, canPostChannel, type ChannelFacts } from "@/lib/channels";
import { portalData } from "@/lib/queries/portal";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("guard 1 — employee routes refuse clients server-side", () => {
  it("redirects a CLIENT to the portal and a parked USER to login", () => {
    expect(employeeAreaRedirect("CLIENT")).toBe("/client-portal");
    expect(employeeAreaRedirect("USER")).toBe("/login");
    expect(employeeAreaRedirect("EMPLOYEE")).toBeNull();
    expect(employeeAreaRedirect("MODERATOR")).toBeNull();
    expect(employeeAreaRedirect("ADMIN")).toBeNull();
  });

  it("keeps non-clients out of the portal, lets clients and admin in", () => {
    expect(portalAreaRedirect("EMPLOYEE")).toBe("/dashboard");
    expect(portalAreaRedirect("MODERATOR")).toBe("/dashboard");
    expect(portalAreaRedirect("USER")).toBe("/dashboard");
    expect(portalAreaRedirect("CLIENT")).toBeNull();
    expect(portalAreaRedirect("ADMIN")).toBeNull(); // preview
  });
});

describe("guard 3 — a client can only reach their own account", () => {
  it("canViewAccount: own account yes, another account no, admin previews any", () => {
    const ruth = { role: "CLIENT" as const, accountId: "a-tidegate" };
    expect(canViewAccount(ruth, "a-tidegate")).toBe(true);
    expect(canViewAccount(ruth, "a-northbeam")).toBe(false); // id swap denied
    expect(canViewAccount({ role: "ADMIN", accountId: null }, "a-northbeam")).toBe(true);
    expect(canViewAccount({ role: "EMPLOYEE", accountId: null }, "a-tidegate")).toBe(false);
  });

  it("a CLIENT cannot view or post in another account's thread", async () => {
    // Ruth Calder is Tidegate's portal user; Northbeam's thread is not hers.
    const ruth = await prisma.user.findUniqueOrThrow({
      where: { id: "u-ruth" },
      select: { id: true, role: true, departmentId: true },
    });
    const northbeam = await prisma.channel.findFirstOrThrow({
      where: { kind: "ACCOUNT", account: { name: "Northbeam Logistics" } },
      include: {
        account: {
          select: {
            portalUsers: { select: { id: true } },
            deals: { where: { stage: "WON" }, select: { ownerId: true } },
            jobs: {
              where: { status: { not: "COMPLETED" } },
              select: { workers: { select: { memberId: true } } },
            },
          },
        },
      },
    });
    const facts: ChannelFacts = {
      kind: "ACCOUNT",
      departmentId: null,
      jobWorkerIds: [],
      accountUserIds: northbeam.account!.portalUsers.map((u) => u.id),
      accountOwnerIds: northbeam.account!.deals.map((d) => d.ownerId),
      accountWorkerIds: northbeam.account!.jobs.flatMap((j) =>
        j.workers.map((w) => w.memberId),
      ),
      memberIds: [],
    };
    const viewer = { id: ruth.id, role: ruth.role, departmentId: ruth.departmentId };
    expect(facts.accountUserIds).not.toContain(ruth.id);
    expect(canViewChannel(viewer, facts)).toBe(false);
    expect(canPostChannel(viewer, facts)).toBe(false);
  });
});

describe("guard 2 — the portal projection carries no internal figures", () => {
  it("ClientJobView exposes gross + a plain status label, never margin/pool/stage", async () => {
    const ruth = await prisma.user.findUniqueOrThrow({ where: { id: "u-ruth" } });
    const data = await portalData(ruth.accountId!, ruth.id);
    expect(data).not.toBeNull();
    expect(data!.jobs.length).toBeGreaterThan(0);
    for (const job of data!.jobs) {
      const keys = Object.keys(job);
      expect(keys).not.toContain("firmMargin");
      expect(keys).not.toContain("workerPool");
      expect(keys).not.toContain("bids");
      expect(keys).not.toContain("status"); // raw enum never crosses
      expect(keys).not.toContain("deal");
      // What it does carry: gross and a human label.
      expect(job.grossValue).toMatch(/^\d+\.\d{2}$/);
      expect(typeof job.statusLabel).toBe("string");
    }
    // Every job belongs to Ruth's account — no leakage of other accounts'.
    const accountJobs = await prisma.job.findMany({
      where: { accountId: ruth.accountId!, status: { not: "OPEN" } },
      select: { id: true },
    });
    expect(new Set(data!.jobs.map((j) => j.id))).toEqual(
      new Set(accountJobs.map((j) => j.id)),
    );
  });

  it("portalData reads only the account it is given (Mateo sees only his own)", async () => {
    const mateo = await prisma.user.findUniqueOrThrow({ where: { id: "u-mateo" } });
    const data = await portalData(mateo.accountId!, mateo.id);
    expect(data).not.toBeNull();
    expect(data!.account.id).toBe(mateo.accountId);
    expect(data!.account.kind).toBe("INDIVIDUAL");
    // Mateo's assets are his account's only.
    const otherAccountAssets = data!.assets.filter((a) => a.jobId === null);
    expect(otherAccountAssets).toHaveLength(0);
  });
});
