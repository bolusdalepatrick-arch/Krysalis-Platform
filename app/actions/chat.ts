"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import {
  canDecideShadowDraft,
  canPostChannel,
  dmChannelId,
} from "@/lib/channels";
import {
  channelInclude,
  messagesAfter,
  toFacts,
  type MessageView,
} from "@/lib/queries/channels";
import { composeProgressUpdate } from "@/lib/shadow/deterministic";
import { loadShadowFacts } from "@/lib/shadow/load";
import {
  draftDecisionSchema,
  fetchAfterSchema,
  firstIssue,
  jobIdSchema,
  sendMessageSchema,
  startDmSchema,
} from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

class ActionError extends Error {}

const SHADOW_USER_ID = "u-shadow";
const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];
const CHAT_ROLES: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN", "CLIENT"];

async function guarded<T>(
  roles: SystemRole[],
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole(...roles);
  } catch {
    return fail("You don't have access to that action.");
  }
  try {
    return await run(user);
  } catch (error) {
    if (error instanceof ActionError) return fail(error.message);
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}

function revalidateChannel(channelId: string) {
  revalidatePath(`/dashboard/channels/${channelId}`);
  revalidatePath("/dashboard");
  revalidatePath("/client-portal");
}

/** Send a message (PRD 7.3). Posting rights derive from lib/channels.ts —
 *  this is the action that covers CLIENT users in their ACCOUNT thread. */
export async function sendMessage(input: unknown): Promise<ActionResult<MessageView>> {
  return guarded(CHAT_ROLES, async (user) => {
    const parsed = sendMessageSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { channelId, body } = parsed.data;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: channelInclude,
    });
    if (!channel) return fail("That channel no longer exists.");
    if (!canPostChannel(user, toFacts(channel))) {
      return fail("You can't post in this channel.");
    }

    const message = await prisma.message.create({
      data: { channelId, senderId: user.id, body },
    });
    revalidateChannel(channelId);
    return ok({
      id: message.id,
      senderId: user.id,
      senderName: user.name,
      senderIsSystem: false,
      senderTier:
        user.role !== "CLIENT" && user.role !== "USER" ? user.currentTierLevel : null,
      body: message.body,
      isShadowDraft: false,
      approvedById: null,
      approvedByName: null,
      createdAt: message.createdAt.toISOString(),
      bookingCard: null,
    });
  });
}

/** The 5-second poll's read action (PRD 7.3). Returns null data never —
 *  unknown or invisible channels read as an error sentence. */
export async function fetchMessagesAfter(
  input: unknown,
): Promise<ActionResult<MessageView[]>> {
  return guarded(CHAT_ROLES, async (user) => {
    const parsed = fetchAfterSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const messages = await messagesAfter(parsed.data.channelId, parsed.data.after, user);
    if (messages === null) return fail("That channel is out of reach.");
    return ok(messages);
  });
}

/** "Draft update" (PRD 7.3): runs the deterministic Shadow over the job's
 *  real figures and stores the draft from the Shadow system user. One
 *  pending draft per channel at a time. */
export async function requestShadowDraft(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = jobIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const channel = await prisma.channel.findFirst({
      where: { jobId: parsed.data.jobId },
      include: channelInclude,
    });
    if (!channel) return fail("This job has no channel yet. Staff it first.");
    const facts = toFacts(channel);
    if (!canDecideShadowDraft(user, facts)) {
      return fail("Only this job's workers, moderators, and admins can request a draft.");
    }
    if (channel.job?.status === "COMPLETED") {
      return fail("This job is complete; its channel is archived.");
    }

    await prisma.$transaction(async (tx) => {
      // Aggregate guard (section 9, post-M3 rule): lock the channel row
      // first, then count — two concurrent requests serialize here and the
      // second sees the first's draft.
      await tx.$queryRaw`SELECT id FROM "Channel" WHERE id = ${channel.id} FOR UPDATE`;
      const pending = await tx.message.count({
        where: { channelId: channel.id, isShadowDraft: true },
      });
      if (pending > 0) {
        throw new ActionError("A draft is already waiting. Approve or discard it first.");
      }
      const shadowFacts = await loadShadowFacts(tx, parsed.data.jobId);
      if (!shadowFacts) throw new ActionError("That job no longer exists.");
      await tx.message.create({
        data: {
          channelId: channel.id,
          senderId: SHADOW_USER_ID,
          body: composeProgressUpdate(shadowFacts),
          isShadowDraft: true,
        },
      });
    });
    revalidateChannel(channel.id);
    return ok(undefined);
  });
}

/** Approve a Shadow draft (PRD 7.3), optionally with an edited body: stamps
 *  the approver, clears the flag, and the message joins the channel as
 *  "Shadow · approved by {name}". Conditional write — a racing approve or
 *  discard loses cleanly. */
export async function approveShadowDraft(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = draftDecisionSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const message = await prisma.message.findUnique({
      where: { id: parsed.data.messageId },
      include: { channel: { include: channelInclude } },
    });
    if (!message) return fail("That draft no longer exists.");
    if (!canDecideShadowDraft(user, toFacts(message.channel))) {
      return fail("Only this job's workers, moderators, and admins can decide drafts.");
    }
    const approved = await prisma.message.updateMany({
      where: { id: message.id, isShadowDraft: true },
      data: {
        isShadowDraft: false,
        approvedById: user.id,
        // The channel sees the update when it is approved — the approval
        // moment is its place in the thread, and every open window's poll
        // cursor picks it up within one cycle.
        createdAt: new Date(),
        ...(parsed.data.body ? { body: parsed.data.body } : {}),
      },
    });
    if (approved.count === 0) return fail("This draft has already been decided.");
    revalidateChannel(message.channelId);
    return ok(undefined);
  });
}

export async function discardShadowDraft(input: unknown): Promise<ActionResult<void>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = draftDecisionSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const message = await prisma.message.findUnique({
      where: { id: parsed.data.messageId },
      include: { channel: { include: channelInclude } },
    });
    if (!message) return fail("That draft no longer exists.");
    if (!canDecideShadowDraft(user, toFacts(message.channel))) {
      return fail("Only this job's workers, moderators, and admins can decide drafts.");
    }
    const deleted = await prisma.message.deleteMany({
      where: { id: message.id, isShadowDraft: true },
    });
    if (deleted.count === 0) return fail("This draft has already been decided.");
    revalidateChannel(message.channelId);
    return ok(undefined);
  });
}

/** startDm (ruling, post-M3): find-or-create the unique employee pair
 *  channel. The deterministic id is the uniqueness guard — a concurrent
 *  second call conflicts on the primary key instead of duplicating. */
export async function startDm(input: unknown): Promise<ActionResult<{ channelId: string }>> {
  return guarded(EMPLOYEE_SIDE, async (user) => {
    const parsed = startDmSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const otherId = parsed.data.userId;
    if (otherId === user.id) return fail("A DM needs a second person.");

    const other = await prisma.user.findUnique({ where: { id: otherId } });
    if (!other || other.isSystem || !EMPLOYEE_SIDE.includes(other.role as SystemRole)) {
      return fail("DMs connect employees. Clients are reached through their account thread.");
    }

    const id = dmChannelId(user.id, otherId);
    try {
      await prisma.channel.create({
        data: {
          id,
          kind: "DM",
          name: "direct",
          members: {
            create: [{ userId: user.id }, { userId: otherId }],
          },
        },
      });
      revalidatePath("/dashboard", "layout");
    } catch (error) {
      const exists =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!exists) throw error;
    }
    return ok({ channelId: id });
  });
}
