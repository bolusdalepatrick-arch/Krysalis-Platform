import PageHeader from "@/components/PageHeader";
import { DEPARTMENTS, JOBS } from "@/lib/mock";
import MarketplaceFilters from "./components/MarketplaceFilters";
import PostingCard from "./components/PostingCard";
import { DEFAULT_DEPARTMENT, DEFAULT_STATUS, STATUS_FILTERS } from "./components/filters";

/** The marketplace board (PRD 7.1): department and status filters as links,
 *  OPEN by default; posting cards with the economics strip in full view. */
export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>;
}) {
  const params = await searchParams;
  const statusFilter =
    STATUS_FILTERS.find((f) => f.value === (params.status ?? DEFAULT_STATUS)) ??
    STATUS_FILTERS.find((f) => f.value === DEFAULT_STATUS)!;
  const department =
    DEPARTMENTS.find((d) => d.id === params.department) ?? null;

  const jobs = JOBS.filter(
    (j) =>
      (statusFilter.status === null || j.status === statusFilter.status) &&
      (department === null || j.departmentId === department.id),
  );
  const openCount = JOBS.filter((j) => j.status === "OPEN").length;

  const emptyScope = department ? ` in ${department.name}` : "";

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Open postings"
        meta={<span className="figure">{`${openCount} open · ${JOBS.length} total`}</span>}
      />
      <MarketplaceFilters
        status={statusFilter.value}
        department={department?.id ?? DEFAULT_DEPARTMENT}
      />
      {jobs.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          {jobs.map((job) => (
            <PostingCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="px-6 py-10 text-sm text-secondary">
          {`No ${statusFilter.emptyNoun}${emptyScope}. New client work appears here as contracts are signed.`}
        </p>
      )}
    </div>
  );
}
