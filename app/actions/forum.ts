"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { awardForumXp } from "@/lib/progression";
import { createForumPostSchema, firstIssue, replyToPostSchema } from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

class ActionError extends Error {}

const EMPLOYEE_SIDE: SystemRole[] = ["EMPLOYEE", "MODERATOR", "ADMIN"];

async function guarded<T>(
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole(...EMPLOYEE_SIDE);
  } catch {
    return fail("You don't have access to that action.");
  }
  // A Serializable transaction can abort on a write conflict; the FOR UPDATE
  // lock below raises it through $queryRaw, which Prisma reports as P2010
  // (raw-query) with PG code 40001, not P2034. Retry either, bounded — so
  // near-simultaneous same-user posts serialize instead of one dropping.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run(user);
    } catch (error) {
      if (error instanceof ActionError) return fail(error.message);
      if (isSerializationFailure(error) && attempt < 2) continue;
      console.error(error);
      return fail(GENERIC_ACTION_ERROR);
    }
  }
  return fail(GENERIC_ACTION_ERROR);
}

function isSerializationFailure(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034") return true;
  // Raw-query serialization abort: P2010 carrying PG SQLSTATE 40001.
  return error.code === "P2010" && (error.meta as { code?: string } | undefined)?.code === "40001";
}

export interface TierUp {
  level: number;
  name: string;
}

/** The forum XP cap is an aggregate guard (section 9): lock the contributor
 *  row first, then sum the day's forum events — two posts in the same
 *  instant serialize here instead of both seeing the pre-award total.
 *  Returns the tier the author crossed into, for the quiet toast (PRD 7.2). */
async function postWithCappedXp(
  user: User,
  create: (tx: Prisma.TransactionClient) => Promise<string>,
): Promise<TierUp | null> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
      const refId = await create(tx);
      const award = await awardForumXp(tx, user.id, refId, new Date());
      return award.awarded && award.tierChanged && award.tier
        ? { level: award.tier.level, name: award.tier.name }
        : null;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Create a forum post (PRD 7.4): optional title + department tag, plain
 *  body. Posting awards capped XP (PRD 7.2). */
export async function createForumPost(
  input: unknown,
): Promise<ActionResult<{ postId: string; tierUp: TierUp | null }>> {
  return guarded(async (user) => {
    const parsed = createForumPostSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { title, body, departmentId } = parsed.data;

    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });
      if (!dept) return fail("That department no longer exists. Post without a tag, or pick another.");
    }

    let postId = "";
    const tierUp = await postWithCappedXp(user, async (tx) => {
      const post = await tx.forumPost.create({
        data: { authorId: user.id, title: title ?? null, body, departmentId: departmentId ?? null },
      });
      postId = post.id;
      return post.id;
    });
    revalidatePath("/dashboard/forum");
    revalidatePath(`/dashboard/people/${user.id}`);
    if (tierUp) revalidatePath("/dashboard", "layout");
    return ok({ postId, tierUp });
  });
}

/** Reply to a post (PRD 7.4): one level deep — a reply to a reply attaches
 *  to the same top-level post. Awards capped XP. */
export async function replyToPost(
  input: unknown,
): Promise<ActionResult<{ tierUp: TierUp | null }>> {
  return guarded(async (user) => {
    const parsed = replyToPostSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { parentId, body } = parsed.data;

    const parent = await prisma.forumPost.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true },
    });
    if (!parent) return fail("That post no longer exists.");
    // Replies are one level deep (PRD 7.4): a reply targeting a reply hangs
    // off its top-level post instead.
    const topLevelId = parent.parentId ?? parent.id;

    const tierUp = await postWithCappedXp(user, async (tx) => {
      const reply = await tx.forumPost.create({
        data: { authorId: user.id, body, parentId: topLevelId },
      });
      return reply.id;
    });
    revalidatePath("/dashboard/forum");
    revalidatePath(`/dashboard/people/${user.id}`);
    if (tierUp) revalidatePath("/dashboard", "layout");
    return ok({ tierUp });
  });
}
