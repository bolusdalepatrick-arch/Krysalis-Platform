import Link from "next/link";
import { formatDate } from "@/lib/format";
import { personById } from "@/lib/mock";
import type { MockDeal } from "@/lib/mock";

type DealActivity = MockDeal["activities"][number];

/**
 * The deal activity log (PRD 7.11): composer on top, then reverse-chrono
 * entries — kind tag in a fixed mono column, author, body, date. Logging a
 * note is a database write; the composer ships disabled until M2.
 */
export default function ActivityLog({ activities }: { activities: DealActivity[] }) {
  const ordered = [...activities].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <div className="rounded-m border border-line bg-raised p-3">
        <textarea
          disabled
          rows={3}
          placeholder="Log a note"
          className="w-full resize-none rounded-s border border-line bg-inset px-3 py-2 text-sm text-primary placeholder:text-muted"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled
            className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-60"
          >
            Log note
          </button>
        </div>
      </div>
      <div className="mt-3 divide-y divide-line">
        {ordered.map((a, i) => {
          const author = personById(a.authorId);
          return (
            <div key={`${a.at}-${i}`} className="flex gap-4 py-3">
              <span className="figure w-28 shrink-0 pt-0.5 text-2xs uppercase tracking-[0.08em] text-muted">
                {a.kind.replace("_", " ")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  {author ? (
                    <Link
                      href={`/dashboard/people/${author.id}`}
                      className="text-xs font-medium text-secondary hover:text-accent"
                    >
                      {author.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                  <span className="figure shrink-0 text-xs text-muted">
                    {formatDate(a.at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-primary">{a.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
