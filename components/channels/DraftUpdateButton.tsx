"use client";

import { useTransition } from "react";
import { requestShadowDraft } from "@/app/actions/chat";
import { useToast } from "@/components/toast/ToastProvider";

/** The "Draft update" affordance in a JOB channel (PRD 7.3): asks the
 *  deterministic Shadow for a progress draft built from the job's data. */
export default function DraftUpdateButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await requestShadowDraft({ jobId });
          push(result.ok ? "Draft requested — it lands in the thread for approval." : result.error);
        })
      }
      className="h-8 rounded-s border border-line px-3 text-sm font-medium text-secondary hover:text-primary disabled:opacity-60"
    >
      Draft update
    </button>
  );
}
