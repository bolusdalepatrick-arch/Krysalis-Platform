import PageHeader from "@/components/PageHeader";
import Eyebrow from "@/components/Eyebrow";
import GraphCanvas from "@/components/graph/GraphCanvas";
import { LEGEND, TONE_VAR } from "@/components/graph/tones";
import { buildGraph } from "@/lib/graph/build";

/** The knowledge graph (PRD 7.6): derived at request time, no graph tables.
 *  The page fetches and derives on the server; the canvas runs the layout. */
export default async function GraphPage() {
  const graph = await buildGraph();
  const counts = graph.nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Graph"
        title="The second brain"
        meta="Who built what, with whom, for which client — derived from delivered work."
      />
      <div className="px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {LEGEND.map((node) => (
            <div key={node.label} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block shrink-0 rounded-full border"
                style={{
                  width: node.size,
                  height: node.size,
                  borderColor: TONE_VAR[node.tone],
                  borderWidth: 1.5,
                }}
              />
              <span className="figure text-2xs text-secondary">{node.label}</span>
            </div>
          ))}
          <span className="figure ml-auto text-2xs text-muted">
            {graph.nodes.length} nodes · {graph.edges.length} edges
            {graph.collapsedAssets > 0 ? ` · ${graph.collapsedAssets} assets collapsed` : ""}
          </span>
        </div>

        {graph.nodes.length === 0 ? (
          <div className="max-w-2xl rounded-m border border-line bg-surface p-6">
            <Eyebrow as="h2">Nothing to map yet</Eyebrow>
            <p className="mt-2 text-md text-secondary">
              The map draws itself from real relations — department membership,
              job assignments, commissioned accounts, delivered files. Complete a
              job or file a commons asset and it appears here.
            </p>
          </div>
        ) : (
          <GraphCanvas graph={graph} />
        )}
      </div>
    </>
  );
}
