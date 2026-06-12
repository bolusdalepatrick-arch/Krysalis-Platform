import ChrysalisGlyph from "@/components/ChrysalisGlyph";
import type { MockMessage } from "@/lib/mock";

/** A Shadow progress draft (PRD 7.3): inset panel wearing the chrysalis
 *  glyph, visible to job workers and admins until approved or discarded.
 *  The actions mutate messages and land with the database (M2+). */
export default function ShadowDraftPanel({ message }: { message: MockMessage }) {
  return (
    <div className="rounded-m border border-line bg-raised p-3">
      <div className="figure flex items-center gap-1.5 text-2xs text-muted">
        <ChrysalisGlyph />
        <span>Shadow · draft awaiting approval</span>
      </div>
      <p className="mt-2 text-sm text-primary">{message.body}</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled
          className="h-7 rounded-s bg-accent px-2.5 text-xs font-medium text-accent-ink disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled
          className="h-7 rounded-s border border-line px-2.5 text-xs font-medium text-secondary disabled:opacity-60"
        >
          Edit
        </button>
        <button
          type="button"
          disabled
          className="h-7 rounded-s border border-line px-2.5 text-xs font-medium text-secondary disabled:opacity-60"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
