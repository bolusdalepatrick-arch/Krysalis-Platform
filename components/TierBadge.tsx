import { tierName } from "@/lib/xp";

/** The inline tier mark (PRD 7.2): the tier name in small mono gold next to
 *  a person's name. Clients and system users never wear one — they are not
 *  in the tier system. */
export default function TierBadge({ level }: { level: number }) {
  return (
    <span className="figure text-2xs text-gold" title={`Tier ${level}`}>
      {tierName(level)}
    </span>
  );
}
