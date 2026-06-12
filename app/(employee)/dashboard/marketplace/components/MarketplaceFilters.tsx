import Eyebrow from "@/components/Eyebrow";
import LinkPill from "@/components/LinkPill";
import { DEPARTMENTS } from "@/lib/mock";
import { DEFAULT_DEPARTMENT, STATUS_FILTERS, marketplaceHref } from "./filters";

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
          <LinkPill
            key={f.value}
            href={marketplaceHref(f.value, department)}
            active={f.value === status}
          >
            {f.label}
          </LinkPill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Eyebrow as="span" className="w-24 shrink-0">
          Department
        </Eyebrow>
        <LinkPill
          href={marketplaceHref(status, DEFAULT_DEPARTMENT)}
          active={department === DEFAULT_DEPARTMENT}
        >
          All
        </LinkPill>
        {DEPARTMENTS.map((d) => (
          <LinkPill
            key={d.id}
            href={marketplaceHref(status, d.id)}
            active={d.id === department}
          >
            {d.name}
          </LinkPill>
        ))}
      </div>
    </div>
  );
}
