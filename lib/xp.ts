/** XP and tiers (PRD 7.2) — the single source of truth for award amounts,
 *  the forum daily cap, and tier thresholds. Pure; no database access. */

export const XP_AMOUNTS = {
  LESSON_COMPLETED: 15,
  COURSE_COMPLETED: 100,
  BID_ACCEPTED: 40,
  JOB_COMPLETED: 120,
  DEAL_WON: 150,
  ONBOARDING_COMPLETED: 50,
  FORUM_POST: 5,
} as const;

export type XpReasonKey = keyof typeof XP_AMOUNTS;

/** Forum posts and replies award XP up to this much per day (PRD 7.2). */
export const FORUM_XP_DAILY_CAP = 25;

export interface Tier {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  threshold: number;
}

export const TIERS: Tier[] = [
  { level: 1, name: "Larva", threshold: 0 },
  { level: 2, name: "Instar", threshold: 250 },
  { level: 3, name: "Chrysalis", threshold: 750 },
  { level: 4, name: "Eclosion", threshold: 1500 },
  { level: 5, name: "Imago", threshold: 3000 },
];

export function tierForXp(xp: number): Tier {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (xp >= tier.threshold) current = tier;
  }
  return current;
}

export function tierName(level: number): string {
  return TIERS.find((t) => t.level === level)?.name ?? TIERS[0].name;
}

/** How much forum XP a new post may still earn today, given XP already
 *  awarded for forum activity since midnight. */
export function remainingForumXpToday(awardedToday: number): number {
  return Math.max(0, Math.min(XP_AMOUNTS.FORUM_POST, FORUM_XP_DAILY_CAP - awardedToday));
}
