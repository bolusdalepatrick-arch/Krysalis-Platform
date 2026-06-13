import type { DealStage } from "@prisma/client";
import type { StatusTone } from "@/components/StatusBadge";

/** Pipeline order (PRD 7.11): four working stages, then the two ends. */
export const STAGE_ORDER: DealStage[] = [
  "INBOUND",
  "DISCOVERY",
  "PROPOSAL",
  "VERBAL",
  "WON",
  "LOST",
];

export const STAGE_TONE: Record<DealStage, StatusTone> = {
  INBOUND: "neutral",
  DISCOVERY: "info",
  PROPOSAL: "warn",
  VERBAL: "accent",
  WON: "ok",
  LOST: "danger",
};

/** "INBOUND" → "Inbound" — sentence case for JSX; classes re-uppercase. */
export function stageLabel(stage: DealStage): string {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}
