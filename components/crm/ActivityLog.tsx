import Link from "next/link";
import ActivityComposer from "@/components/crm/ActivityComposer";
import { formatDate } from "@/lib/format";
import type { ActivityView } from "@/lib/queries/crm";

/**
 * The deal activity log (PRD 7.11): composer on top, then reverse-chrono
 * entries — kind tag in a fixed mono column, author, body, date.
 * STAGE_CHANGE rows are written by setDealStage, never composed by hand.
 */
export default function ActivityLog({
  dealId,
  activities,
}: {
  dealId: string;
  activities: ActivityView[];
}) {
  return (
    <div>
      <ActivityComposer dealId={dealId} />
      <div className="mt-3 divide-y divide-line">
        {activities.length === 0 ? (
          <p className="py-3 text-sm text-secondary">
            No activity yet. Calls, emails, meetings, and stage moves build
            the deal&apos;s history here.
          </p>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="flex gap-4 py-3">
              <span className="figure w-28 shrink-0 pt-0.5 text-2xs uppercase tracking-[0.08em] text-muted">
                {a.kind.replace("_", " ")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <Link
                    href={`/dashboard/people/${a.authorId}`}
                    className="text-xs font-medium text-secondary hover:text-accent"
                  >
                    {a.authorName}
                  </Link>
                  <span className="figure shrink-0 text-xs text-muted">
                    {formatDate(a.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-primary">{a.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
