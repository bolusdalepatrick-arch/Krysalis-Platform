/** lib/leaderboards.ts scoring (PRD section 12), against the seeded
 *  database. The expected figures are hand-computed from the canonical seed
 *  constants by an independent code path, then compared to the indexed
 *  queries — the M6 done-when ("figures match hand-computed seed values"). */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  contributorsBoard,
  grossValueWorkedBoard,
  jobsExecutedBoard,
} from "@/lib/leaderboards";
import { JOBS } from "@/lib/mock";
import { formatMoney } from "@/lib/format";

if (!process.env.DATABASE_URL) {
  process.loadEnvFile();
}

const prisma = new PrismaClient();
const DAY = 86_400_000;
// The seed's reference instant (prisma/seed-data.ts SEED_NOW).
const NOW = new Date("2026-06-12T12:00:00");

afterAll(async () => {
  await prisma.$disconnect();
});

/** Expected top-N {userId, figure} from the seed's completed jobs. */
function expectedJobs(since?: Date): { userId: string; figure: string }[] {
  const counts = new Map<string, number>();
  for (const job of JOBS) {
    if (job.status !== "COMPLETED") continue;
    if (since && !(job.completedAt && new Date(job.completedAt) >= since)) continue;
    for (const w of job.workerIds) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return topN(counts, String);
}

function expectedGross(): { userId: string; figure: string }[] {
  const sums = new Map<string, number>();
  for (const job of JOBS) {
    if (job.status !== "COMPLETED") continue;
    for (const w of job.workerIds) sums.set(w, (sums.get(w) ?? 0) + job.grossValue);
  }
  return topN(sums, formatMoney);
}

function topN(
  scores: Map<string, number>,
  format: (v: number) => string,
): { userId: string; figure: string }[] {
  return [...scores.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([userId, value]) => ({ userId, figure: format(value) }));
}

const pick = (rows: { userId: string; figure: string }[]) =>
  rows.map((r) => ({ userId: r.userId, figure: r.figure }));

describe("jobs executed board", () => {
  it("matches the seed all-time, ranked by count", async () => {
    const board = pick(await jobsExecutedBoard());
    const expected = expectedJobs();
    // Tie-break differs (board breaks ties by name, the check by id), so
    // compare as multisets of {userId, figure} plus the leading figure.
    expect(new Set(board.map((r) => `${r.userId}:${r.figure}`))).toEqual(
      new Set(expected.map((r) => `${r.userId}:${r.figure}`)),
    );
    expect(board[0].figure).toBe(expected.map((r) => Number(r.figure)).sort((a, b) => b - a)[0].toString());
  });

  it("narrows to the trailing 90 days", async () => {
    const since = new Date(NOW.getTime() - 90 * DAY);
    const board = pick(await jobsExecutedBoard({ since }));
    const expected = expectedJobs(since);
    expect(new Set(board.map((r) => `${r.userId}:${r.figure}`))).toEqual(
      new Set(expected.map((r) => `${r.userId}:${r.figure}`)),
    );
  });
});

describe("gross value worked board", () => {
  it("credits each worker the full gross of every completed job", async () => {
    const board = pick(await grossValueWorkedBoard({}, formatMoney));
    const expected = expectedGross();
    expect(new Set(board.map((r) => `${r.userId}:${r.figure}`))).toEqual(
      new Set(expected.map((r) => `${r.userId}:${r.figure}`)),
    );
  });
});

describe("contributors board (PRD 7.7, pre-M6 exclusion ruling)", () => {
  it("is ranked, positive, and free of system users", async () => {
    const board = await contributorsBoard(NOW);
    expect(board.length).toBeGreaterThan(0);
    for (let i = 1; i < board.length; i++) {
      expect(board[i - 1].value).toBeGreaterThanOrEqual(board[i].value);
    }
    expect(board.every((r) => r.value > 0)).toBe(true);
    expect(board.some((r) => r.userId === "u-shadow" || r.userId === "u-gate")).toBe(false);
  });

  it("excludes an approved Shadow message (approvedById set) from the author's score", async () => {
    const channelId = "ch-engineering";
    const recent = new Date(NOW.getTime() - DAY);
    const before = await contributorsBoard(NOW);
    const beforeScore = before.find((r) => r.userId === "u-priya")?.value ?? 0;

    // A message Priya "approved" must not count as Priya's contribution.
    await prisma.message.create({
      data: {
        id: "m-test-approved",
        channelId,
        senderId: "u-shadow",
        body: "Approved progress note.",
        approvedById: "u-priya",
        createdAt: recent,
      },
    });
    // A plain message from Priya in the same window must count, proving the
    // exclusion is specific to approvedById, not the window.
    await prisma.message.create({
      data: {
        id: "m-test-plain",
        channelId,
        senderId: "u-priya",
        body: "Real human note.",
        createdAt: recent,
      },
    });

    try {
      const after = await contributorsBoard(NOW);
      const afterScore = after.find((r) => r.userId === "u-priya")?.value ?? 0;
      // Exactly +1 for the plain message; the approved one added nothing.
      expect(afterScore).toBe(beforeScore + 1);
    } finally {
      await prisma.message.deleteMany({
        where: { id: { in: ["m-test-approved", "m-test-plain"] } },
      });
    }
  });
});
