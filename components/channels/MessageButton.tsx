"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDm } from "@/app/actions/chat";

/** The profile's "Message" affordance (PRD 7.3, post-M3 ruling): find or
 *  create the DM pair and land in it. */
export default function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startDm({ userId });
            if (result.ok) router.push(`/dashboard/channels/${result.data.channelId}`);
            else setError(result.error);
          });
        }}
        className="h-8 rounded-s border border-line px-3 text-sm font-medium text-secondary hover:text-primary disabled:opacity-60"
      >
        Message
      </button>
    </div>
  );
}
