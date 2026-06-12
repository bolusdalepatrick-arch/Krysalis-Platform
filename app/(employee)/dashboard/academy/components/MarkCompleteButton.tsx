"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { completeLesson } from "@/app/actions/academy";
import { useToast } from "@/components/toast/ToastProvider";
import { formatDate } from "@/lib/format";

/** "Mark lesson complete" (PRD 7.2): optimistic — the control becomes
 *  "Completed Jun 12" instantly and reconciles on the action result. The
 *  course bonus and tier-up surface as quiet toasts. */
export default function MarkCompleteButton({
  lessonId,
  completedAt,
  courseXp,
}: {
  lessonId: string;
  completedAt: string | null;
  courseXp: number;
}) {
  const [optimisticDone, markDone] = useOptimistic(
    completedAt,
    (_state, next: string) => next,
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { push } = useToast();

  if (optimisticDone) {
    return (
      <p className="figure flex items-center gap-1.5 text-sm text-muted">
        <Check size={16} strokeWidth={1.5} aria-hidden className="text-ok" />
        Completed {formatDate(optimisticDone)}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            markDone(new Date().toISOString());
            const result = await completeLesson({ lessonId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (result.data.courseCompleted) {
              push(`Course complete — ${courseXp} XP`);
            }
            if (result.data.tierChanged) {
              push(`Tier ${result.data.tier.level} — ${result.data.tier.name}`, "gold");
            }
          });
        }}
        className="h-9 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
      >
        Mark lesson complete
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
