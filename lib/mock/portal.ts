import { INFO_BAR, PORTAL_GUIDE_MD } from "../../prisma/seed-data";

/** Client-portal content (PRD 7.8), re-exported from the canonical seed
 *  narrative. Editable by moderators from M7. */
export const INFO_BAR_MESSAGES = INFO_BAR;
export { PORTAL_GUIDE_MD };

/** Job status in client language (PRD 7.8) — no internal vocabulary. */
export const CLIENT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Being scheduled with our team",
  ASSIGNED: "Team assigned, starting soon",
  IN_PROGRESS: "In progress",
  REVIEW: "In review with our team",
  COMPLETED: "Delivered",
};
