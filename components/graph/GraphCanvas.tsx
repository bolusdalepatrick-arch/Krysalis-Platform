"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import type { GraphData, GraphNode } from "@/lib/graph/build";
import GraphInspector from "@/components/graph/GraphInspector";
import { TONE_VAR } from "@/components/graph/tones";

const WIDTH = 900;
const HEIGHT = 620;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

type SimNode = GraphNode & SimulationNodeDatum;
interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The force-directed map (PRD 7.6): d3-force layout, plain React SVG. Pan
 *  by dragging the canvas, wheel-zoom 0.5–2.5x, hover highlights the 1-hop
 *  neighborhood, click opens the inspector. The simulation settles and
 *  stops; under reduced motion it ticks to rest before the first paint. */
export default function GraphCanvas({ graph }: { graph: GraphData }) {
  const nodesRef = useRef<SimNode[]>([]);
  const [, render] = useReducer((n: number) => n + 1, 0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // 1-hop adjacency, for hover highlighting.
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const n of graph.nodes) map.set(n.id, new Set([n.id]));
    for (const e of graph.edges) {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    }
    return map;
  }, [graph]);

  /** Frame the settled layout into the viewport with padding, so the whole
   *  graph is visible before any pan or zoom. */
  function fitToView() {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const r = n.size / 2 + 16;
      minX = Math.min(minX, (n.x ?? 0) - r);
      minY = Math.min(minY, (n.y ?? 0) - r);
      maxX = Math.max(maxX, (n.x ?? 0) + r);
      maxY = Math.max(maxY, (n.y ?? 0) + r);
    }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(WIDTH / w, HEIGHT / h)));
    setView({
      k,
      x: WIDTH / 2 - ((minX + maxX) / 2) * k,
      y: HEIGHT / 2 - ((minY + maxY) / 2) * k,
    });
  }

  useEffect(() => {
    const nodes: SimNode[] = graph.nodes.map((n, i) => ({
      ...n,
      x: WIDTH / 2 + Math.cos(i) * 40,
      y: HEIGHT / 2 + Math.sin(i) * 40,
    }));
    nodesRef.current = nodes;
    const links: SimLink[] = graph.edges.map((e) => ({ source: e.source, target: e.target }));

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(58)
          .strength(0.5),
      )
      .force("charge", forceManyBody().strength(-150))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      // Gentle gravity toward the middle keeps the map compact, so the
      // initial fit lands above the zoom floor and labels stay legible.
      .force("x", forceX(WIDTH / 2).strength(0.06))
      .force("y", forceY(HEIGHT / 2).strength(0.08))
      .force("collide", forceCollide<SimNode>((d) => d.size / 2 + 8));

    if (prefersReducedMotion()) {
      sim.stop();
      for (let i = 0; i < 300; i++) sim.tick();
      fitToView();
      render();
    } else {
      sim.on("tick", render);
      sim.on("end", fitToView);
    }
    return () => {
      sim.on("tick", null);
      sim.on("end", null);
      sim.stop();
    };
    // fitToView reads refs and setView only; re-running on graph change is
    // the intended dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const edgePos = (end: string | SimNode): SimNode | undefined =>
    typeof end === "string" ? nodesRef.current.find((n) => n.id === end) : end;

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Zoom toward the cursor: keep the point under it fixed.
    setView((v) => ({
      k,
      x: px - ((px - v.x) / v.k) * k,
      y: py - ((py - v.y) / v.k) * k,
    }));
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as Element).closest("[data-node]")) return; // node clicks handled separately
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const p = panRef.current;
    if (!p) return;
    setView((v) => ({ ...v, x: p.vx + (e.clientX - p.x), y: p.vy + (e.clientY - p.y) }));
  }
  function onPointerUp(e: React.PointerEvent) {
    panRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  }

  const lit = hovered ? neighbors.get(hovered) : null;
  const dim = (id: string) => (lit && !lit.has(id) ? 0.25 : 1);
  const selectedNode = graph.nodes.find((n) => n.id === selected) ?? null;

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 overflow-hidden rounded-m border border-line bg-inset">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[620px] w-full touch-none select-none"
          role="img"
          aria-label="Knowledge graph of departments, people, jobs, accounts, and delivered assets"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {graph.edges.map((e, i) => {
              const a = edgePos(e.source);
              const b = edgePos(e.target);
              if (!a || !b) return null;
              const opacity = Math.min(dim(e.source), dim(e.target)) * 0.7;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  style={{ stroke: "var(--color-line-strong)", opacity }}
                  strokeWidth={1}
                />
              );
            })}
            {nodesRef.current.map((n) => (
              <g
                key={n.id}
                data-node
                transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
                className="cursor-pointer"
                style={{ opacity: dim(n.id) }}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(n.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(n.id);
                  }
                }}
                role="button"
                aria-label={`${n.type}: ${n.label}`}
              >
                <circle
                  r={n.size / 2}
                  style={{
                    stroke: TONE_VAR[n.tone],
                    fill: "var(--color-bg-surface)",
                  }}
                  strokeWidth={selected === n.id ? 3 : 1.5}
                />
                {n.size >= 16 || hovered === n.id || selected === n.id ? (
                  <text
                    y={n.size / 2 + 12}
                    textAnchor="middle"
                    className="figure"
                    style={{ fill: "var(--color-text-secondary)", fontSize: 9 }}
                  >
                    {n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        </svg>
      </div>
      <GraphInspector node={selectedNode} onClose={() => setSelected(null)} />
    </div>
  );
}
