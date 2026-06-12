import Link from "next/link";
import { Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LinkPill from "@/components/LinkPill";
import { formatDate } from "@/lib/format";
import { DEPARTMENTS, VAULT_ASSETS, jobById, personById } from "@/lib/mock";
import type { DepartmentSlug, VaultFileType } from "@/lib/mock";

const FILE_TYPES: VaultFileType[] = ["pdf", "doc", "sheet", "image", "figma", "link"];

interface VaultFilters {
  type?: VaultFileType;
  department?: DepartmentSlug;
  commons?: boolean;
}

function vaultHref(f: VaultFilters): string {
  const q = new URLSearchParams();
  if (f.type) q.set("type", f.type);
  if (f.department) q.set("department", f.department);
  if (f.commons) q.set("commons", "1");
  const s = q.toString();
  return s ? `/dashboard/vault?${s}` : "/dashboard/vault";
}

/** Vault (PRD 7.5): the real table of everything delivered or filed, with
 *  type / department / commons filters carried in the query string. */
export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; department?: string; commons?: string }>;
}) {
  const sp = await searchParams;
  const type = FILE_TYPES.find((t) => t === sp.type);
  const department = DEPARTMENTS.find((d) => d.id === sp.department)?.id;
  const commons = sp.commons === "1";
  const current: VaultFilters = { type, department, commons };

  const assets = VAULT_ASSETS.filter((a) => {
    if (type && a.fileType !== type) return false;
    if (department) {
      const job = a.jobId ? jobById(a.jobId) : undefined;
      if (!job || job.departmentId !== department) return false;
    }
    if (commons && !a.isSharedSocial) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        eyebrow="Vault"
        title="The record"
        meta="Everything delivered or worth keeping, filed by job."
        actions={
          <button
            type="button"
            disabled
            className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
          >
            Add asset
          </button>
        }
      />

      <div className="flex flex-col gap-2 border-b border-line px-6 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow w-24">Type</span>
          <LinkPill href={vaultHref({ ...current, type: undefined })} active={!type}>
            All
          </LinkPill>
          {FILE_TYPES.map((t) => (
            <LinkPill key={t} href={vaultHref({ ...current, type: t })} active={type === t}>
              {t}
            </LinkPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow w-24">Department</span>
          <LinkPill href={vaultHref({ ...current, department: undefined })} active={!department}>
            All
          </LinkPill>
          {DEPARTMENTS.map((d) => (
            <LinkPill
              key={d.id}
              href={vaultHref({ ...current, department: d.id })}
              active={department === d.id}
            >
              {d.name}
            </LinkPill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="eyebrow w-24">Commons</span>
          <LinkPill href={vaultHref({ ...current, commons: !commons })} active={commons}>
            Commons only
          </LinkPill>
        </div>
      </div>

      <div className="px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong">
              <th className="eyebrow h-9 px-3 text-left font-normal">Title</th>
              <th className="eyebrow h-9 px-3 text-left font-normal">Type</th>
              <th className="eyebrow h-9 px-3 text-left font-normal">Job</th>
              <th className="eyebrow h-9 px-3 text-left font-normal">Uploaded by</th>
              <th className="eyebrow h-9 px-3 text-left font-normal">Date</th>
              <th className="eyebrow h-9 px-3 text-right font-normal">Size</th>
              <th className="eyebrow h-9 px-3 text-left font-normal">Commons</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-secondary">
                  No assets match these filters. Delivered files land here as jobs progress; clear
                  a filter to widen the view.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const job = asset.jobId ? jobById(asset.jobId) : undefined;
                const uploader = personById(asset.uploadedById);
                return (
                  <tr key={asset.id} className="h-9 border-b border-line">
                    <td className="px-3 font-medium text-primary">{asset.title}</td>
                    <td className="px-3">
                      <span className="figure rounded-s border border-line px-1.5 py-px text-2xs uppercase tracking-[0.08em] text-secondary">
                        {asset.fileType}
                      </span>
                    </td>
                    <td className="px-3 text-secondary">
                      {job ? (
                        <Link href={`/dashboard/marketplace/${job.id}`} className="hover:text-accent">
                          {job.title}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 text-secondary">
                      <Link
                        href={`/dashboard/people/${asset.uploadedById}`}
                        className="hover:text-accent"
                      >
                        {uploader?.name ?? "Unknown"}
                      </Link>
                    </td>
                    <td className="figure px-3 text-secondary">{formatDate(asset.createdAt)}</td>
                    <td className="figure px-3 text-right text-secondary">
                      {asset.sizeKb != null ? `${asset.sizeKb} KB` : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-3">
                      {asset.isSharedSocial ? (
                        <Check size={16} strokeWidth={1.5} className="text-ok" aria-label="In the commons" />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
