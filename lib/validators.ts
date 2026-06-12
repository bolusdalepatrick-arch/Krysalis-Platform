import { z } from "zod";

/** Zod schemas for every Server Action input (PRD section 9). Error strings
 *  follow PRD 5.7 — they render verbatim in the UI. */

export const zId = z
  .string({ error: "Something was off about that request. Reload and retry." })
  .min(1)
  .max(64);

/** Money arrives as a string and stays decimal end to end (PRD 7.1). */
export const zMoney = z
  .string({ error: "Enter an amount." })
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount in dollars, up to two decimals.");

const zDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createJobSchema = z.object({
  title: z.string().trim().min(3, "Give the posting a title.").max(120, "Keep the title under 120 characters."),
  brief: z
    .string()
    .trim()
    .min(3, "Add the one-sentence brief the board card shows.")
    .max(240, "Keep the brief to one sentence."),
  description: z.string().trim().max(20000, "The description is too long.").default(""),
  accountId: zId,
  departmentId: zId,
  grossValue: zMoney,
  workerPool: zMoney,
  dueAt: zDateOnly,
  dealId: zId.optional(),
});

export const placeBidSchema = z.object({
  jobId: zId,
  proposedSplit: zMoney,
  pitchText: z.string().trim().max(500, "Keep the pitch under 500 characters.").optional(),
});

export const updateBidSchema = z.object({
  bidId: zId,
  proposedSplit: zMoney,
  pitchText: z.string().trim().max(500, "Keep the pitch under 500 characters.").optional(),
});

export const bidIdSchema = z.object({ bidId: zId });

export const jobIdSchema = z.object({ jobId: zId });

export const jobNoteSchema = z.object({
  jobId: zId,
  note: z.string().trim().max(2000, "Keep the note under 2,000 characters.").optional(),
});

export const requestChangesSchema = z.object({
  jobId: zId,
  note: z
    .string()
    .trim()
    .min(3, "Say what needs to change before sending it back.")
    .max(2000, "Keep the note under 2,000 characters."),
});

/** First zod issue as renderable copy. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and retry.";
}
