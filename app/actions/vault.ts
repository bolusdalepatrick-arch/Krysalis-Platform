"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { GENERIC_ACTION_ERROR, fail, ok, type ActionResult } from "@/lib/actions";
import { addVaultAssetSchema, assetIdSchema, firstIssue } from "@/lib/validators";
import type { SystemRole } from "@/lib/personas";

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
  try {
    return await run(user);
  } catch (error) {
    console.error(error);
    return fail(GENERIC_ACTION_ERROR);
  }
}

/** Add a vault asset (PRD 7.5): metadata + an external URL. File storage is
 *  V3 — the form says so plainly; this stores the link and its facts. */
export async function addVaultAsset(input: unknown): Promise<ActionResult<{ assetId: string }>> {
  return guarded(async (user) => {
    const parsed = addVaultAssetSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));
    const { title, fileUrl, fileType, jobId, sizeKb } = parsed.data;

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
      if (!job) return fail("That job no longer exists. File the asset without a job, or pick another.");
    }

    const asset = await prisma.vaultAsset.create({
      data: {
        title,
        fileUrl,
        fileType,
        sizeKb: sizeKb ? Number(sizeKb) : null,
        jobId: jobId ?? null,
        uploadedById: user.id,
      },
    });
    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/graph");
    return ok({ assetId: asset.id });
  });
}

/** Toggle an asset into or out of the Commons (PRD 7.5). Conditional write
 *  on the value we read, so a racing toggle resolves to one flip, not a
 *  read-then-write that loses an update. */
export async function toggleAssetSharing(input: unknown): Promise<ActionResult<{ shared: boolean }>> {
  return guarded(async () => {
    const parsed = assetIdSchema.safeParse(input);
    if (!parsed.success) return fail(firstIssue(parsed.error));

    const asset = await prisma.vaultAsset.findUnique({
      where: { id: parsed.data.assetId },
      select: { id: true, isSharedSocial: true },
    });
    if (!asset) return fail("That asset no longer exists.");

    const next = !asset.isSharedSocial;
    const flipped = await prisma.vaultAsset.updateMany({
      where: { id: asset.id, isSharedSocial: asset.isSharedSocial },
      data: { isSharedSocial: next },
    });
    if (flipped.count === 0) return fail("That asset's sharing just changed. Reload to see where it stands.");

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/graph");
    revalidatePath("/client-portal");
    return ok({ shared: next });
  });
}
