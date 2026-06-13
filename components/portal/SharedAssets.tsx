import Eyebrow from "@/components/Eyebrow";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import type { VaultRow } from "@/lib/queries/vault";

/** The shared files panel (PRD 7.8): the account's delivered and commons
 *  assets, already scoped and leak-filtered by sharedAssetsForAccount.
 *  Uploader names are plain text — no hub links render in the portal. */
export default function SharedAssets({ assets }: { assets: VaultRow[] }) {
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
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {asset.title}
                  </a>
                </td>
                <td className="py-3.5 pr-4">
                  <StatusBadge>{asset.fileType}</StatusBadge>
                </td>
                <td className="py-3.5 pr-4 text-secondary">{asset.uploaderName}</td>
                <td className="figure py-3.5 text-secondary">{formatDate(asset.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
