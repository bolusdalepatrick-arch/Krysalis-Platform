"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import {
  firstIssue,
  infoBarIdSchema,
  publishGuideSchema,
  reorderInfoBarSchema,
  upsertInfoBarSchema,
} from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

class ActionError extends Error {}

/** Portal content editing (PRD 7.9): the guide and the info bar, MODERATOR
 *  and ADMIN. */
const EDITORS: SystemRole[] = ["MODERATOR", "ADMIN"];

async function guarded<T>(
  run: (user: User) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let user: User;
  try {
    user = await requireRole(...EDITORS);
  } catch {
    return fail("You don't have access to that action.");
  }
  // A Serializable order-assignment can abort on a write conflict (P2034);
  // a bounded retry re-reads the new max and lands a distinct order.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run(user);
    } catch (error) {
      if (error instanceof ActionError) return fail(error.message);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }
      console.error(error);
      return fail(GENERIC_ACTION_ERROR);
    }
  }
  return fail(GENERIC_ACTION_ERROR);
}

function revalidatePortalContent() {
  revalidatePath("/client-portal");
  revalidatePath("/settings");
}

/** Publish the client guide (PRD 7.9): upsert the single "main" row,
 *  stamping the editor. */
export async function publishGuide(input: unknown): Promise<ActionResult<void>> {
  return guarded(async (user) => {
    const parsed = publishGuideSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    await prisma.portalGuide.upsert({
      where: { id: "main" },
      update: { markdown: parsed.data.markdown, updatedById: user.id },
      create: { id: "main", markdown: parsed.data.markdown, updatedById: user.id },
    });
    revalidatePortalContent();
    return ok(undefined);
  });
}

/** Create or edit an info-bar message (PRD 7.9). New rows append to the end
 *  of the order. */
export async function upsertInfoBarMessage(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    const parsed = upsertInfoBarSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { id, text, href, isActive } = parsed.data;

    if (id) {
      const existing = await prisma.infoBarMessage.findUnique({ where: { id } });
      if (!existing) return fail("That announcement no longer exists.");
      await prisma.infoBarMessage.update({
        where: { id },
        data: { text, href: href ?? null, isActive },
      });
    } else {
      // Append at the end. The max-read and the create run together under
      // Serializable so two concurrent creates can't both claim the same
      // order — the loser aborts (P2034) and the guarded retry re-reads the
      // new max (section 9).
      await prisma.$transaction(
        async (tx) => {
          const last = await tx.infoBarMessage.findFirst({ orderBy: { order: "desc" } });
          await tx.infoBarMessage.create({
            data: { text, href: href ?? null, isActive, order: (last?.order ?? 0) + 1 },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }
    revalidatePortalContent();
    return ok(undefined);
  });
}

/** Toggle an announcement active/inactive (PRD 7.9). Conditional write on
 *  the read value, so a racing toggle resolves to one flip. */
export async function toggleInfoBarMessage(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    const parsed = infoBarIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const row = await prisma.infoBarMessage.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, isActive: true },
    });
    if (!row) return fail("That announcement no longer exists.");
    const flipped = await prisma.infoBarMessage.updateMany({
      where: { id: row.id, isActive: row.isActive },
      data: { isActive: !row.isActive },
    });
    if (flipped.count === 0) return fail("That announcement just changed. Reload to see where it stands.");
    revalidatePortalContent();
    return ok(undefined);
  });
}

/** Move an announcement up or down (PRD 7.9): swap order values with the
 *  neighbor in one transaction, so the sequence stays a clean ordering. */
export async function reorderInfoBar(input: unknown): Promise<ActionResult<void>> {
  return guarded(async () => {
    const parsed = reorderInfoBarSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { id, direction } = parsed.data;

    await prisma.$transaction(
      async (tx) => {
        const row = await tx.infoBarMessage.findUnique({ where: { id } });
        if (!row) throw new ActionError("That announcement no longer exists.");
        const neighbor = await tx.infoBarMessage.findFirst({
          where:
            direction === "up"
              ? { order: { lt: row.order } }
              : { order: { gt: row.order } },
          orderBy: { order: direction === "up" ? "desc" : "asc" },
        });
        if (!neighbor) return; // already at the end in that direction — no-op
        await tx.infoBarMessage.update({ where: { id: row.id }, data: { order: neighbor.order } });
        await tx.infoBarMessage.update({ where: { id: neighbor.id }, data: { order: row.order } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidatePortalContent();
    return ok(undefined);
  });
}
