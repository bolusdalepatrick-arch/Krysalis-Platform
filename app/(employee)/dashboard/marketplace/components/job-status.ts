import type { JobStatus } from "@/lib/mock";
import type { StatusTone } from "@/components/StatusBadge";

/** Display labels for the job status machine (PRD 7.1). Sentence case in
 *  JSX; StatusBadge uppercases. */
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

export const JOB_STATUS_TONE: Record<JobStatus, StatusTone> = {
  OPEN: "accent",
  ASSIGNED: "neutral",
  IN_PROGRESS: "info",
  REVIEW: "warn",
  COMPLETED: "ok",
};
