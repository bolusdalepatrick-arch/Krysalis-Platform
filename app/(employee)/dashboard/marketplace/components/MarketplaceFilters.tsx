import Link from "next/link";
import clsx from "clsx";
import Eyebrow from "@/components/Eyebrow";
import { DEPARTMENTS } from "@/lib/mock";
import { DEFAULT_DEPARTMENT, STATUS_FILTERS, marketplaceHref } from "./filters";

function pillClass(active: boolean): string {
  return clsx(
    "rounded-s border px-2 py-0.5 text-xs",
    active
      ? "border-line-strong bg-accent-soft text-accent"
      : "border-line text-secondary hover:border-line-strong hover:text-primary",
  );
}

/** Server-rendered filter rows: links, not client state, so every filtered
 *  view of the board is a shareable URL (PRD section 6). */
export default function MarketplaceFilters({
  status,
  department,
}: {
  status: string;
  department: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line px-6 py-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Eyebrow as="span" className="w-24 shrink-0">
          Status
        </Eyebrow>
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={marketplaceHref(f.value, department)}
            aria-current={f.value === status ? "page" : undefined}
            className={pillClass(f.value === status)}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Eyebrow as="span" className="w-24 shrink-0">
          Department
        </Eyebrow>
        <Link
          href={marketplaceHref(status, DEFAULT_DEPARTMENT)}
          aria-current={department === DEFAULT_DEPARTMENT ? "page" : undefined}
          className={pillClass(department === DEFAULT_DEPARTMENT)}
        >
          All
        </Link>
        {DEPARTMENTS.map((d) => (
          <Link
            key={d.id}
            href={marketplaceHref(status, d.id)}
            aria-current={d.id === department ? "page" : undefined}
            className={pillClass(d.id === department)}
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
