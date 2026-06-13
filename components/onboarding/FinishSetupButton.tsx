"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { useToast } from "@/components/toast/ToastProvider";
import { XP_AMOUNTS } from "@/lib/xp";

/** "Finish setup" (PRD 7.13): enabled when all three checks pass; the action
 *  re-verifies server-side and awards the one-time 50 XP. The quiet
 *  tier-style toast, no confetti. */
export default function FinishSetupButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding();
      if (result.ok) {
        // Toast the award only when this call actually wrote it — a stale
        // client re-invoking an already-complete setup gets no reward toast.
        if (result.data.awarded) {
          push(`Setup complete — ${XP_AMOUNTS.ONBOARDING_COMPLETED} XP`, "gold");
          if (result.data.tierUp) {
            push(`Tier ${result.data.tierUp.level} — ${result.data.tierUp.name}`, "gold");
          }
        }
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={finish}
        disabled={!enabled || pending}
        className="h-9 rounded-s bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Finishing" : "Finish setup"}
      </button>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <p className="text-xs text-muted">Enables when all three checks pass.</p>
      )}
    </div>
  );
}
