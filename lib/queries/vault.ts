import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Vault reads (PRD 7.5). The employee table shows everything filed; the
 *  portal sharing helper is the leak-proof scope for the client panel. */

export interface VaultRow {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  sizeKb: number | null;
  isSharedSocial: boolean;
  jobId: string | null;
  jobTitle: string | null;
  uploadedById: string;
  uploaderName: string;
  createdAt: string;
}

const rowInclude = {
  job: { select: { id: true, title: true, departmentId: true } },
  uploadedBy: { select: { id: true, name: true } },
} satisfies Prisma.VaultAssetInclude;

type RowData = Prisma.VaultAssetGetPayload<{ include: typeof rowInclude }>;

function toRow(a: RowData): VaultRow {
  return {
    id: a.id,
    title: a.title,
    fileType: a.fileType,
    fileUrl: a.fileUrl,
    sizeKb: a.sizeKb,
    isSharedSocial: a.isSharedSocial,
    jobId: a.job?.id ?? null,
    jobTitle: a.job?.title ?? null,
    uploadedById: a.uploadedBy.id,
    uploaderName: a.uploadedBy.name,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function vaultRows(filter: {
  type?: string;
  departmentId?: string;
  commonsOnly?: boolean;
}): Promise<VaultRow[]> {
  const assets = await prisma.vaultAsset.findMany({
    where: {
      ...(filter.type ? { fileType: filter.type } : {}),
      ...(filter.commonsOnly ? { isSharedSocial: true } : {}),
      // Department filter is via the linked job (PRD 7.5); a job-less asset
      // never matches a department.
      ...(filter.departmentId ? { job: { departmentId: filter.departmentId } } : {}),
    },
    include: rowInclude,
    orderBy: { createdAt: "desc" },
  });
  return assets.map(toRow);
}

/** Jobs for the "Add asset" form's optional link, newest first. */
export async function jobOptions(): Promise<{ id: string; title: string }[]> {
  return prisma.job.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The portal sharing rule (PRD 7.5/7.8): an account's asset is visible to
 * its client when the asset belongs to one of the account's jobs and is
 * either in the Commons or its job has reached review or delivery. Restricted
 * job artifacts never leak to non-members — the scope is the account's own
 * jobs, nothing else. Returns plain rows (no hub links render in the portal).
 */
export async function sharedAssetsForAccount(accountId: string): Promise<VaultRow[]> {
  const assets = await prisma.vaultAsset.findMany({
    where: {
      job: {
        accountId,
        OR: [{ status: "REVIEW" }, { status: "COMPLETED" }],
      },
    },
    include: rowInclude,
    orderBy: { createdAt: "desc" },
  });
  // The OR above already covers "job is theirs and REVIEW/COMPLETED"; add
  // commons assets on the account's jobs regardless of status.
  const commons = await prisma.vaultAsset.findMany({
    where: { isSharedSocial: true, job: { accountId } },
    include: rowInclude,
    orderBy: { createdAt: "desc" },
  });
  const byId = new Map<string, VaultRow>();
  for (const a of [...assets, ...commons]) byId.set(a.id, toRow(a));
  return [...byId.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}
