"use client";

import type { DealStage } from "@prisma/client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDealStage } from "@/app/actions/crm";
import { stageLabel } from "@/components/crm/stages";
import { useToast } from "@/components/toast/ToastProvider";

const WORKING: DealStage[] = ["INBOUND", "DISCOVERY", "PROPOSAL", "VERBAL"];

/** Stage moves on the deal page (PRD 7.11): free movement between the four
 *  working stages; WON needs a value, LOST needs a reason. Decided deals
 *  render no controls — they don't move. */
export default function StageControls({
  dealId,
  stage,
  hasValue,
}: {
  dealId: string;
  stage: DealStage;
  hasValue: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [losing, setLosing] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (stage === "WON" || stage === "LOST") return null;

  function move(to: DealStage, note?: string) {
    setError(null);
    startTransition(async () => {
      const result = await setDealStage({ dealId, stage: to, note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (to === "WON") push("Marked won.");
      else if (to === "LOST") push("Marked lost.");
      else push(`Stage moved to ${stageLabel(to)}.`);
      if (result.data.tierUp) {
        push(`Tier ${result.data.tierUp.level} — ${result.data.tierUp.name}`, "gold");
      }
      setLosing(false);
      setReason("");
      router.refresh();
    });
  }

  const quiet =
    "h-8 rounded-s border border-line px-2.5 text-sm text-secondary hover:text-primary disabled:opacity-60";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {WORKING.filter((s) => s !== stage).map((s) => (
          <button key={s} type="button" disabled={pending} onClick={() => move(s)} className={quiet}>
            {stageLabel(s)}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          disabled={pending || !hasValue}
          onClick={() => move("WON")}
          className="h-8 rounded-s bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          Mark won
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setLosing((v) => !v)}
          className={quiet}
        >
          Mark lost
        </button>
      </div>
      {!hasValue ? (
        <p className="text-xs text-muted">Set a value first — a deal can&apos;t be won without a number.</p>
      ) : null}
      {losing ? (
        <form
          action={() => move("LOST", reason)}
          className="flex max-w-xl items-center gap-2"
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Why it was lost</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Why it was lost, in one plain sentence"
              className="h-8 w-full rounded-s border border-line bg-inset px-3 text-sm text-primary placeholder:text-muted"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-8 shrink-0 rounded-s border border-line px-2.5 text-sm text-danger disabled:opacity-60"
          >
            {pending ? "Marking" : "Confirm lost"}
          </button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
