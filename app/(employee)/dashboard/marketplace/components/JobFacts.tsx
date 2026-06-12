import Link from "next/link";
import AvatarBadge from "@/components/AvatarBadge";
import Eyebrow from "@/components/Eyebrow";
import { formatDate } from "@/lib/format";
import { CHANNELS, VAULT_ASSETS, personById } from "@/lib/mock";
import type { MockJob, MockPerson } from "@/lib/mock";

const EM_DASH = "—";

/** Right-rail facts for a job (PRD 7.1): workers, channel link, dates, and
 *  delivered vault assets, each under a specimen-label eyebrow. */
export default function JobFacts({ job }: { job: MockJob }) {
  const workers = job.workerIds
    .map((id) => personById(id))
    .filter((p): p is MockPerson => p !== undefined);
  const channel = CHANNELS.find((c) => c.kind === "JOB" && c.jobId === job.id);
  const files = VAULT_ASSETS.filter((a) => a.jobId === job.id);

  return (
    <aside className="w-72 shrink-0">
      <div className="space-y-5 rounded-m border border-line bg-surface p-4">
        <section>
          <Eyebrow as="h2">Workers</Eyebrow>
          {workers.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {workers.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/people/${p.id}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-accent"
                  >
                    <AvatarBadge id={p.id} name={p.name} size={22} />
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-muted">{EM_DASH}</p>
          )}
        </section>

        <section>
          <Eyebrow as="h2">Channel</Eyebrow>
          {channel ? (
            <Link
              href={`/dashboard/channels/${channel.id}`}
              className="figure mt-1.5 block text-sm text-accent underline-offset-2 hover:underline"
            >
              {channel.name}
            </Link>
          ) : (
            <p className="mt-1.5 text-sm text-muted">{EM_DASH}</p>
          )}
        </section>

        {job.dueAt || !job.completedAt ? (
          <section>
            <Eyebrow as="h2">Due</Eyebrow>
            <p className="figure mt-1.5 text-sm text-primary">
              {job.dueAt ? formatDate(job.dueAt) : EM_DASH}
            </p>
          </section>
        ) : null}

        {job.completedAt ? (
          <section>
            <Eyebrow as="h2">Completed</Eyebrow>
            <p className="figure mt-1.5 text-sm text-primary">
              {formatDate(job.completedAt)}
            </p>
          </section>
        ) : null}

        <section>
          <Eyebrow as="h2">Delivered files</Eyebrow>
          {files.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-primary">{f.title}</span>
                  <span className="figure shrink-0 rounded-s border border-line px-1 text-2xs uppercase text-muted">
                    {f.fileType}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-muted">{EM_DASH}</p>
          )}
        </section>
      </div>
    </aside>
  );
}
