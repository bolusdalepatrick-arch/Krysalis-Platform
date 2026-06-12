import PageHeader from "@/components/PageHeader";
import { getSessionUser } from "@/lib/auth";
import { boardJobs, marketplaceFormOptions } from "@/lib/queries/marketplace";
import { prisma } from "@/lib/db";
import MarketplaceFilters from "./components/MarketplaceFilters";
import NewPostingPanel from "./components/NewPostingPanel";
import PostingCard from "./components/PostingCard";
import { DEFAULT_DEPARTMENT, DEFAULT_STATUS, STATUS_FILTERS } from "./components/filters";

/** The marketplace board (PRD 7.1): department and status filters as links,
 *  OPEN by default; posting cards with the economics strip in full view. */
export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>;
}) {
  const [params, viewer, departments] = await Promise.all([
    searchParams,
    getSessionUser(),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const statusFilter =
    STATUS_FILTERS.find((f) => f.value === (params.status ?? DEFAULT_STATUS)) ??
    STATUS_FILTERS.find((f) => f.value === DEFAULT_STATUS)!;
  const department = departments.find((d) => d.id === params.department) ?? null;

  const { jobs, openCount, totalCount } = await boardJobs({
    status: statusFilter.status ?? undefined,
    departmentId: department?.id,
  });

  const isAdmin = viewer?.role === "ADMIN";
  const formOptions = isAdmin ? await marketplaceFormOptions() : null;

  const emptyScope = department ? ` in ${department.name}` : "";

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Open postings"
        meta={<span className="figure">{`${openCount} open · ${totalCount} total`}</span>}
      />
      {formOptions ? (
        <NewPostingPanel accounts={formOptions.accounts} departments={formOptions.departments} />
      ) : null}
      <MarketplaceFilters
        status={statusFilter.value}
        department={department?.id ?? DEFAULT_DEPARTMENT}
        departments={departments}
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
