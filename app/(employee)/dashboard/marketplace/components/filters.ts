import type { JobStatus } from "@/lib/mock";

/** Marketplace board filters (PRD 7.1): status defaults to OPEN, department
 *  to all. Both travel as search params so the board stays deep-linkable. */
export interface StatusFilter {
  value: string;
  label: string;
  status: JobStatus | null;
  /** Noun phrase for the empty state: "No open postings in Engineering." */
  emptyNoun: string;
}

export const STATUS_FILTERS: StatusFilter[] = [
  { value: "all", label: "All", status: null, emptyNoun: "postings" },
  { value: "open", label: "Open", status: "OPEN", emptyNoun: "open postings" },
  { value: "assigned", label: "Assigned", status: "ASSIGNED", emptyNoun: "assigned postings" },
  { value: "in-progress", label: "In progress", status: "IN_PROGRESS", emptyNoun: "postings in progress" },
  { value: "review", label: "Review", status: "REVIEW", emptyNoun: "postings in review" },
  { value: "completed", label: "Completed", status: "COMPLETED", emptyNoun: "completed postings" },
];

export const DEFAULT_STATUS = "open";
export const DEFAULT_DEPARTMENT = "all";

/** Builds a board href, omitting defaults so the canonical URL stays bare. */
export function marketplaceHref(status: string, department: string): string {
  const params = new URLSearchParams();
  if (status !== DEFAULT_STATUS) params.set("status", status);
  if (department !== DEFAULT_DEPARTMENT) params.set("department", department);
  const qs = params.toString();
  return qs ? `/dashboard/marketplace?${qs}` : "/dashboard/marketplace";
}
