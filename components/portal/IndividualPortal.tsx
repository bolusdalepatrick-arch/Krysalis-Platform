import Eyebrow from "@/components/Eyebrow";
import SetupStrip from "@/components/portal/SetupStrip";
import { sharedAssetsFor } from "@/components/portal/SharedAssets";
import { formatDate, formatMoney } from "@/lib/format";
import { CLIENT_STATUS_LABEL } from "@/lib/mock";
import type { MockJob } from "@/lib/mock";

/**
 * The individual composition (PRD 7.8): the setup strip, one engagement card
 * with its delivered files inline, then the thread — for a client of one, the
 * thread is the relationship. No figures row, no contact card.
 */
export default function IndividualPortal({
  jobs,
  thread,
}: {
  jobs: MockJob[];
  thread: React.ReactNode;
}) {
  const job = jobs[0];
  const delivered = job ? sharedAssetsFor([job]) : [];

  return (
    <div className="space-y-10">
      <SetupStrip />

      {job ? (
        <section className="rounded-m border border-line bg-surface p-6">
          <Eyebrow as="h2">Your engagement</Eyebrow>
          <h3 className="mt-2 text-base font-bold tracking-[-0.01em] text-primary">{job.title}</h3>
          <p className="mt-1 text-base text-secondary">{CLIENT_STATUS_LABEL[job.status]}</p>
          <div className="mt-4 flex gap-10">
            <div>
              <Eyebrow>Due</Eyebrow>
              <p className="figure mt-1 text-base text-primary">
                {job.dueAt ? formatDate(job.dueAt) : "—"}
              </p>
            </div>
            <div>
              <Eyebrow>Value</Eyebrow>
              <p className="figure mt-1 text-base text-primary">{formatMoney(job.grossValue)}</p>
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <Eyebrow as="h3">Delivered files</Eyebrow>
            {delivered.length === 0 ? (
              <p className="mt-2 text-base text-secondary">
                Files we deliver will appear here as they&rsquo;re ready.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {delivered.map((asset) => (
                  <li key={asset.id} className="flex items-baseline justify-between gap-4 py-3.5">
                    <a
                      href={asset.fileUrl}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      {asset.title}
                    </a>
                    <span className="figure shrink-0 text-sm text-muted">
                      {formatDate(asset.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <p className="text-base text-secondary">
          No engagement yet. Work you commission with Krysalis appears here once it is signed.
        </p>
      )}

      {thread}
    </div>
  );
}
