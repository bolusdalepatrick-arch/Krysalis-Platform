import clsx from "clsx";
import Eyebrow from "@/components/Eyebrow";
import { formatMoney } from "@/lib/format";

/** The economics strip (PRD 7.1): three mono figures under eyebrows.
 *  The transparency is the point — the margin is never hidden. */
export default function EconomicsStrip({
  job,
  className,
}: {
  job: { grossValue: string | number; workerPool: string | number; firmMargin: string | number };
  className?: string;
}) {
  const cells: [string, string | number][] = [
    ["Gross", job.grossValue],
    ["Worker pool", job.workerPool],
    ["Margin", job.firmMargin],
  ];
  return (
    <div className={clsx("grid grid-cols-3 gap-4", className)}>
      {cells.map(([label, value]) => (
        <div key={label}>
          <Eyebrow>{label}</Eyebrow>
          <p className="figure mt-0.5 text-sm text-primary">{formatMoney(value)}</p>
        </div>
      ))}
    </div>
  );
}
