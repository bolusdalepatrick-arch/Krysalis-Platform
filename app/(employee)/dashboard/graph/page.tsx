import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";

/** Node types and sizes per PRD 7.6 — typed diameters, token colors only.
 *  Inline style carries the diameter; everything else is a token utility. */
const NODE_TYPES: { label: string; size: number; className: string }[] = [
  { label: "Department", size: 28, className: "border-line-strong" },
  { label: "Job — in flight", size: 20, className: "border-current text-warn" },
  { label: "Job — completed", size: 20, className: "border-current text-ok" },
  { label: "Person", size: 16, className: "border-accent" },
  { label: "Asset", size: 12, className: "border-line" },
];

export default function GraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="Graph"
        title="The second brain"
        meta="Who built what, with whom, for which client — derived from delivered work."
      />
      <div className="px-6 py-6">
        <div className="max-w-2xl rounded-m border border-line bg-surface p-6">
          <p className="text-md text-secondary">
            The map draws itself from real relations — department membership,
            job assignments, commissioned accounts, delivered files. Nothing
            is curated by hand: complete a job or file an asset and the graph
            reflects it. Delivered work appears here as it accumulates.
          </p>
          <Eyebrow as="h2" className="mt-6">
            Legend
          </Eyebrow>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            {NODE_TYPES.map((node) => (
              <div key={node.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-block shrink-0 rounded-full border ${node.className}`}
                  style={{ width: node.size, height: node.size }}
                />
                <span className="figure text-2xs text-secondary">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
