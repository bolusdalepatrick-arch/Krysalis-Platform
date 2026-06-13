"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toggleAssetSharing } from "@/app/actions/vault";

/** The Commons toggle (PRD 7.5): flips an asset firm-wide. A checked,
 *  labelled control — never a bare icon — so it is operable by keyboard and
 *  its state is announced. */
export default function CommonsToggle({
  assetId,
  shared,
}: {
  assetId: string;
  shared: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    setError(false);
    startTransition(async () => {
      const result = await toggleAssetSharing({ assetId });
      if (!result.ok) setError(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={shared}
      title={error ? "Couldn't change sharing. Retry." : shared ? "In the commons — click to restrict" : "Restricted — click to share firm-wide"}
      className="inline-flex h-6 items-center gap-1 rounded-s border border-line px-1.5 text-2xs text-secondary hover:text-primary disabled:opacity-60"
    >
      {shared ? (
        <>
          <Check size={16} strokeWidth={1.5} className="text-ok" aria-hidden />
          <span className="figure uppercase tracking-[0.08em] text-ok">Shared</span>
        </>
      ) : (
        <span className="figure uppercase tracking-[0.08em] text-muted">Restricted</span>
      )}
    </button>
  );
}
