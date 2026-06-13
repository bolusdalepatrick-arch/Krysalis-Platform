import Eyebrow from "@/components/Eyebrow";
import Markdown from "@/components/Markdown";
import SetupStrip, { type SetupState } from "@/components/portal/SetupStrip";
import { formatDate, formatMoney } from "@/lib/format";
import type { ClientJobView } from "@/lib/queries/portal";
import type { VaultRow } from "@/lib/queries/vault";

/**
 * The individual composition (PRD 7.8): the setup strip, one engagement card
 * with its brief and delivered files inline, then the thread — for a client of
 * one, the thread is the relationship. No figures row, no contact card.
 */
export default function IndividualPortal({
  jobs,
  assets,
  thread,
  setup,
}: {
  jobs: ClientJobView[];
  assets: VaultRow[];
  thread: React.ReactNode;
  /** Null hides the strip (admin preview); otherwise the client's stamps. */
  setup: SetupState | null;
}) {
  const job = jobs[0];
  const delivered = job ? assets.filter((a) => a.jobId === job.id) : [];

  return (
    <div className="space-y-10">
      {setup ? <SetupStrip state={setup} /> : null}

      {job ? (
        <section id="engagement" className="rounded-m border border-line bg-surface p-6">
          <Eyebrow as="h2">Your engagement</Eyebrow>
          <h3 className="mt-2 text-base font-bold tracking-[-0.01em] text-primary">{job.title}</h3>
          <p className="mt-1 text-base text-secondary">{job.statusLabel}</p>
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
          {job.description ? (
            <div className="mt-5 border-t border-line pt-4">
              <Eyebrow as="h3">The brief</Eyebrow>
              <Markdown className="mt-2">{job.description}</Markdown>
            </div>
          ) : null}
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
                      target="_blank"
                      rel="noreferrer"
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
