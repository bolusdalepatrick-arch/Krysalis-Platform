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

export const courseIdSchema = z.object({ courseId: zId });

export const lessonIdSchema = z.object({ lessonId: zId });

export const sendMessageSchema = z.object({
  channelId: zId,
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(4000, "Keep a message under 4,000 characters."),
});

export const fetchAfterSchema = z.object({
  channelId: zId,
  after: z.string().regex(/^\d{4}-\d{2}-\d{2}T/, "Reload the page and retry."),
});

export const draftDecisionSchema = z.object({
  messageId: zId,
  body: z
    .string()
    .trim()
    .min(1, "An edited draft can't be empty.")
    .max(4000, "Keep the update under 4,000 characters.")
    .optional(),
});

export const startDmSchema = z.object({ userId: zId });

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

// ── CRM & the gate (PRD 7.11–7.12) ──────────────────────────

const zOptionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** ISO timestamp from n8n — anything Date.parse can't read is a 422. */
const zIsoInstant = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Send an ISO 8601 timestamp.");

/** The inbound booking relay (PRD 7.12) — field-for-field the gate's
 *  contract. Parsed only after the signature verifies. */
export const bookingPayloadSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId is required.").max(64),
  slotStart: zIsoInstant,
  slotEnd: zIsoInstant,
  name: z.string().trim().min(1, "name is required.").max(120),
  email: z.email("email must be a valid address."),
  company: z.string().trim().min(1, "company is required.").max(160),
  companySize: z.string().trim().min(1, "companySize is required.").max(32),
  automationGoal: z.string().trim().min(1, "automationGoal is required.").max(2000),
  submittedAt: zIsoInstant,
});

export const cardIdSchema = z.object({ cardId: zId });

export const createDealSchema = z
  .object({
    accountId: zId.optional().or(z.literal("").transform(() => undefined)),
    newAccountName: zOptionalText(120, "Keep the account name under 120 characters."),
    contactName: zOptionalText(120, "Keep the contact name under 120 characters."),
    contactEmail: z
      .email("Enter the contact's email address.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    title: z.string().trim().min(3, "Give the deal a title.").max(120, "Keep the title under 120 characters."),
    source: z.enum(["REFERRAL", "OUTBOUND", "EVENT"], {
      error: "Pick where this deal came from.",
    }),
    value: zMoney.optional().or(z.literal("").transform(() => undefined)),
    expectedCloseAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((input) => input.accountId || input.newAccountName, {
    message: "Pick an account or name a new one.",
  })
  .refine(
    (input) => input.accountId || (input.contactName && input.contactEmail),
    { message: "A new account needs its contact's name and email." },
  );

export const updateDealSchema = z.object({
  dealId: zId,
  title: zOptionalText(120, "Keep the title under 120 characters."),
  value: zMoney.optional().or(z.literal("").transform(() => undefined)),
  expectedCloseAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  ownerId: zId.optional().or(z.literal("").transform(() => undefined)),
});

export const setDealStageSchema = z.object({
  dealId: zId,
  stage: z.enum(["INBOUND", "DISCOVERY", "PROPOSAL", "VERBAL", "WON", "LOST"], {
    error: "Pick a stage.",
  }),
  note: zOptionalText(500, "Keep the note under 500 characters."),
});

export const logDealActivitySchema = z.object({
  dealId: zId,
  kind: z.enum(["NOTE", "CALL", "EMAIL", "MEETING"], { error: "Pick an activity kind." }),
  body: z
    .string()
    .trim()
    .min(1, "Write the activity first.")
    .max(2000, "Keep the entry under 2,000 characters."),
});

export const convertWonDealSchema = z.object({
  dealId: zId,
  provisionPortalUser: z.boolean(),
  accountKind: z.enum(["INDIVIDUAL", "BUSINESS"]).optional(),
  draftJob: z
    .object({
      title: z.string().trim().min(3, "Give the engagement a title.").max(120, "Keep the title under 120 characters."),
      brief: z
        .string()
        .trim()
        .min(3, "Add the one-sentence brief the board card shows.")
        .max(240, "Keep the brief to one sentence."),
      description: z.string().trim().max(20000, "The description is too long.").default(""),
      departmentId: zId,
      workerPool: zMoney,
      dueAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
        .optional()
        .or(z.literal("").transform(() => undefined)),
    })
    .optional(),
});

// ── Vault (PRD 7.5) ─────────────────────────────────────────

const FILE_TYPES = ["pdf", "doc", "sheet", "image", "figma", "link"] as const;

export const addVaultAssetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give the asset a title.")
    .max(160, "Keep the title under 160 characters."),
  fileUrl: z.url("Enter the asset's URL (file storage lands in V3)."),
  fileType: z.enum(FILE_TYPES, { error: "Pick a file type." }),
  jobId: zId.optional().or(z.literal("").transform(() => undefined)),
  sizeKb: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Size is a whole number of kilobytes.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const assetIdSchema = z.object({ assetId: zId });

// ── Forum (PRD 7.4) ─────────────────────────────────────────

export const createForumPostSchema = z.object({
  title: z
    .string()
    .trim()
    .max(160, "Keep the title under 160 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  body: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(8000, "Keep a post under 8,000 characters."),
  departmentId: zId.optional().or(z.literal("").transform(() => undefined)),
});

export const replyToPostSchema = z.object({
  parentId: zId,
  body: z
    .string()
    .trim()
    .min(1, "Write a reply first.")
    .max(8000, "Keep a reply under 8,000 characters."),
});

/** First zod issue as renderable copy. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and retry.";
}
