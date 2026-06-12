import { Check, Circle } from "lucide-react";
import Eyebrow from "@/components/Eyebrow";

/**
 * The individual setup strip (PRD 7.13): three steps, each a verifiable stamp
 * on the user row. The first is stamped in the demo; the open steps' buttons
 * write timestamps (M2+) and render disabled with their real labels.
 */
export default function SetupStrip() {
  return (
    <section className="rounded-m border border-line bg-surface px-6 py-4">
      <Eyebrow as="h2">Setup</Eyebrow>
      <ul className="mt-1 divide-y divide-line">
        <li className="flex items-center gap-3 py-3.5">
          <Check size={16} strokeWidth={1.5} className="shrink-0 text-ok" aria-hidden />
          <span className="font-medium text-primary">Confirm your details</span>
          <span className="figure ml-auto shrink-0 text-sm text-muted">Confirmed Jun 8, 2026</span>
        </li>
        <li className="flex items-center gap-3 py-3.5">
          <Circle size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-primary">How this works</p>
            <p className="text-sm text-secondary">
              What this portal shows, how review and delivery work, and how to reach the team.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="ml-auto h-8 shrink-0 rounded-s border border-line-strong px-3 text-sm font-medium text-secondary disabled:opacity-60"
          >
            Got it
          </button>
        </li>
        <li className="flex items-center gap-3 py-3.5">
          <Circle size={16} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-primary">Review your engagement brief</p>
            <p className="text-sm text-secondary">
              The brief sets out the work as scoped, so we build from the same page.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="ml-auto h-8 shrink-0 rounded-s border border-line-strong px-3 text-sm font-medium text-secondary disabled:opacity-60"
          >
            Mark as reviewed
          </button>
        </li>
      </ul>
    </section>
  );
}
