"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resendClaimWebhook } from "@/app/actions/crm";
import { useToast } from "@/components/toast/ToastProvider";

/** Admin retry for a failed claim notification (PRD 7.12). The failure
 *  never rolled back the claim; this just replays the signed call. */
export default function ResendWebhookButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resend() {
    setError(null);
    startTransition(async () => {
      const result = await resendClaimWebhook({ cardId });
      if (result.ok) {
        push("Claim notification sent to n8n.");
      } else {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary disabled:opacity-60"
      >
        {pending ? "Sending" : "Resend to n8n"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
