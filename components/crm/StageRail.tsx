import clsx from "clsx";
import { STAGE_ORDER } from "@/components/crm/stages";
import type { DealStage } from "@/lib/mock/types";

const WORKING_STAGES = 4; // INBOUND through VERBAL

/**
 * The stage rail (PRD 7.11): six stages as a horizontal track. Reached bars
 * fill in accent; the current label carries the accent. A LOST deal keeps its
 * traveled working stages, skips WON, and ends on a danger segment.
 */
export default function StageRail({ stage }: { stage: DealStage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  const isLost = stage === "LOST";

  function barClass(s: DealStage, i: number): string {
    if (isLost) {
      if (s === "LOST") return "bg-danger";
      return i < WORKING_STAGES ? "bg-accent" : "bg-line";
    }
    return i <= idx ? "bg-accent" : "bg-line";
  }

  function labelClass(s: DealStage): string {
    if (s !== stage) return "text-muted";
    return s === "LOST" ? "font-medium text-danger" : "font-medium text-accent";
  }

  return (
    <div className="flex gap-1.5">
      {STAGE_ORDER.map((s, i) => (
        <div key={s} className="min-w-0 flex-1">
          <p
            className={clsx(
              "figure truncate text-2xs uppercase tracking-[0.08em]",
              labelClass(s),
            )}
          >
            {s}
          </p>
          <div className={clsx("mt-1.5 h-0.5", barClass(s, i))} />
        </div>
      ))}
    </div>
  );
}
