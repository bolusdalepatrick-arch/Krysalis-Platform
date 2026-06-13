import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import type { GraphNode } from "@/lib/graph/build";

const TYPE_LABEL: Record<GraphNode["type"], string> = {
  department: "Department",
  person: "Person",
  job: "Job",
  account: "Client account",
  asset: "Asset",
};

/** The graph inspector (PRD 7.6): the clicked node's facts and a link back
 *  into the app. Closed state prompts the interaction. */
export default function GraphInspector({
  node,
  onClose,
}: {
  node: GraphNode | null;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <aside className="w-64 shrink-0 rounded-m border border-line bg-surface p-4">
        <Eyebrow as="h2">Inspector</Eyebrow>
        <p className="mt-2 text-sm text-secondary">
          Select a node to see what it is and follow it into the app. Hover to
          trace its immediate connections.
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 rounded-m border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Eyebrow as="h2">{TYPE_LABEL[node.type]}</Eyebrow>
        <button
          type="button"
          onClick={onClose}
          className="text-2xs text-muted hover:text-primary"
        >
          Clear
        </button>
      </div>
      <p className="mt-2 text-md font-medium text-primary">{node.label}</p>
      <dl className="mt-3 space-y-2">
        {node.facts.map((fact) => (
          <div key={fact.label} className="flex justify-between gap-3 text-xs">
            <dt className="text-muted">{fact.label}</dt>
            <dd className="figure text-right text-secondary">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {node.href ? (
        node.external ? (
          <a
            href={node.href}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-accent underline-offset-2 hover:underline"
          >
            Open asset
          </a>
        ) : (
          <Link
            href={node.href}
            className="mt-4 inline-block text-sm text-accent underline-offset-2 hover:underline"
          >
            Open in the app
          </Link>
        )
      ) : null}
    </aside>
  );
}
