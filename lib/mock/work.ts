import {
  ACCOUNTS as SEED_ACCOUNTS,
  BIDS as SEED_BIDS,
  BOOKING_CARDS as SEED_CARDS,
  DEALS as SEED_DEALS,
  EXTRA_JOB_DESCRIPTIONS,
  JOBS as SEED_JOBS,
} from "../../prisma/seed-data";
import type { MockAccount, MockBid, MockBookingCard, MockDeal, MockJob } from "./types";

/** CRM and marketplace rows, re-exported from the canonical seed narrative
 *  (prisma/seed-data.ts) with authored job descriptions merged. */
export const ACCOUNTS: MockAccount[] = SEED_ACCOUNTS;
export const JOBS: MockJob[] = SEED_JOBS.map((job) => ({
  ...job,
  description: job.description ?? EXTRA_JOB_DESCRIPTIONS[job.id],
}));
export const BIDS: MockBid[] = SEED_BIDS;
export const DEALS: MockDeal[] = SEED_DEALS;
export const BOOKING_CARDS: MockBookingCard[] = SEED_CARDS;

export function accountById(id: string): MockAccount | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}

export function jobById(id: string): MockJob | undefined {
  return JOBS.find((j) => j.id === id);
}

export function dealById(id: string): MockDeal | undefined {
  return DEALS.find((d) => d.id === id);
}
