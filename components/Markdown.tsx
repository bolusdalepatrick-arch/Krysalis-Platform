import { Fragment, type ReactNode } from "react";

/** Tiny dependency-free Markdown renderer for the Client Navigation Guide. */

function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em] text-glow">
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={key} href={link[2]} className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let k = 0;

  const flushList = () => {
    if (!list) return;
    const L = list;
    blocks.push(
      L.ordered ? (
        <ol key={`b${k++}`} className="list-decimal space-y-1.5 pl-5">
          {L.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {inline(it, `ol${k}-${i}`)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`b${k++}`} className="list-disc space-y-1.5 pl-5 marker:text-accent">
          {L.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {inline(it, `ul${k}-${i}`)}
            </li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ol || ul) {
      const ordered = Boolean(ol);
      const item = (ol ? ol[1] : ul![1]) ?? "";
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }
    flushList();

    if (!trimmed) continue;
    if (trimmed === "---" || trimmed === "***") {
      blocks.push(<hr key={`b${k++}`} className="border-ink/10" />);
    } else if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={`b${k++}`} className="font-display text-lg font-semibold text-ink">
          {inline(trimmed.slice(4), `h3${k}`)}
        </h3>,
      );
    } else if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={`b${k++}`} className="font-display text-xl font-semibold text-ink md:text-2xl">
          {inline(trimmed.slice(3), `h2${k}`)}
        </h2>,
      );
    } else if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1 key={`b${k++}`} className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {inline(trimmed.slice(2), `h1${k}`)}
        </h1>,
      );
    } else if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote key={`b${k++}`} className="border-l-2 border-accent pl-4 italic text-soft">
          {inline(trimmed.slice(2), `q${k}`)}
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={`b${k++}`} className="text-base leading-relaxed text-ink/90">
          {inline(trimmed, `p${k}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="space-y-4">{blocks}</div>;
}
