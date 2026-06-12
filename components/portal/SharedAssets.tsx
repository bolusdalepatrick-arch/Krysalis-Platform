import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { VAULT_ASSETS, personById } from "@/lib/mock";
import type { MockJob, MockVaultAsset } from "@/lib/mock";

/**
 * The portal sharing rule (PRD 7.5): an asset is visible to the client when
 * it belongs to one of the account's jobs and is either shared to the Commons
 * or its job has reached review or delivery.
 */
export function sharedAssetsFor(jobs: MockJob[]): MockVaultAsset[] {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  return VAULT_ASSETS.filter((asset) => {
    const job = asset.jobId ? byId.get(asset.jobId) : undefined;
    if (!job) return false;
    return asset.isSharedSocial || job.status === "REVIEW" || job.status === "COMPLETED";
  });
}

/** The shared files panel (PRD 7.8): uploader names are plain text — no hub
 *  links render in the portal. */
export default function SharedAssets({ jobs }: { jobs: MockJob[] }) {
  const assets = sharedAssetsFor(jobs);

  return (
    <section>
      <Eyebrow as="h2">Shared files</Eyebrow>
      {assets.length === 0 ? (
        <p className="mt-3 text-base text-secondary">
          Nothing here yet. Files we deliver land in this panel as engagements reach review and
          delivery.
        </p>
      ) : (
        <table className="mt-3 w-full border-collapse text-base">
          <thead>
            <tr className="border-b border-line-strong">
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">File</Eyebrow>
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">Type</Eyebrow>
              <Eyebrow as="th" className="py-2 pr-4 text-left font-normal">From</Eyebrow>
              <Eyebrow as="th" className="py-2 text-left font-normal">Date</Eyebrow>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-line">
                <td className="py-3.5 pr-4">
                  <a
                    href={asset.fileUrl}
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {asset.title}
                  </a>
                </td>
                <td className="py-3.5 pr-4">
                  <StatusBadge>{asset.fileType}</StatusBadge>
                </td>
                <td className="py-3.5 pr-4 text-secondary">
                  {personById(asset.uploadedById)?.name ?? "—"}
                </td>
                <td className="figure py-3.5 text-secondary">{formatDate(asset.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
