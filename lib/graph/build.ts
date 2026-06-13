import { prisma } from "@/lib/db";

/** The knowledge graph (PRD 7.6), derived at request time from real
 *  relations — no graph tables, no cached rows. Complete a job or file a
 *  commons asset and the next build reflects it. The pure `deriveGraph`
 *  holds the derivation rules so they test against a fixture; `buildGraph`
 *  only fetches and serializes. */

export type GraphNodeType = "department" | "person" | "job" | "account" | "asset";

/** Tone names map to --color-* tokens in the client (no hex here). */
export type GraphTone = "line-strong" | "accent" | "info" | "secondary" | "warn" | "ok";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  /** Diameter in px (PRD 7.6: department 28, job 20, person 16, asset 12;
   *  account 24 — a commissioning hub, between job and department). */
  size: number;
  tone: GraphTone;
  /** In-app destination for the inspector, or an external asset URL. */
  href: string | null;
  external: boolean;
  facts: { label: string; value: string }[];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Assets dropped to honor the node cap, surfaced so the page can say so
   *  rather than silently truncating (PRD: collapse assets first). */
  collapsedAssets: number;
}

// ── The fixture-shaped input (serializable, Decimal already a string) ────

export interface RawDept {
  id: string;
  name: string;
  slug: string;
}
export interface RawPerson {
  id: string;
  name: string;
  title: string | null;
  departmentId: string | null;
  tierLevel: number;
}
export interface RawJob {
  id: string;
  title: string;
  status: string;
  grossValue: string;
  accountId: string;
  accountName: string;
  accountKind: string;
  accountStatus: string;
  workerIds: string[];
}
export interface RawAsset {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  isSharedSocial: boolean;
  jobId: string | null;
  /** The asset's job status, or null when it links no job. */
  jobStatus: string | null;
}
export interface GraphInput {
  departments: RawDept[];
  people: RawPerson[];
  jobs: RawJob[];
  assets: RawAsset[];
}

const NODE_CAP = 300;

const SIZE: Record<GraphNodeType, number> = {
  department: 28,
  account: 24,
  job: 20,
  person: 16,
  asset: 12,
};

function money(value: string): string {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const JOB_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  COMPLETED: "Completed",
};

const deptNodeId = (id: string) => `dept:${id}`;
const personNodeId = (id: string) => `user:${id}`;
const jobNodeId = (id: string) => `job:${id}`;
const acctNodeId = (id: string) => `acct:${id}`;
const assetNodeId = (id: string) => `asset:${id}`;

/** Pure derivation (PRD 7.6). Nodes: departments, employees, all jobs,
 *  the accounts those jobs commission, and commons-or-delivered assets.
 *  Edges: person—department, person—job, account—job, asset—job. No
 *  pairwise person—person edges. */
export function deriveGraph(input: GraphInput): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Departments.
  const deptIds = new Set(input.departments.map((d) => d.id));
  for (const d of input.departments) {
    const members = input.people.filter((p) => p.departmentId === d.id).length;
    nodes.push({
      id: deptNodeId(d.id),
      type: "department",
      label: d.name,
      size: SIZE.department,
      tone: "line-strong",
      href: `/dashboard/channels/ch-${d.slug}`,
      external: false,
      facts: [
        { label: "Department", value: d.name },
        { label: "Members", value: String(members) },
      ],
    });
  }

  // People, and the person—department membership edge.
  for (const p of input.people) {
    nodes.push({
      id: personNodeId(p.id),
      type: "person",
      label: p.name,
      size: SIZE.person,
      tone: "accent",
      href: `/dashboard/people/${p.id}`,
      external: false,
      facts: [
        { label: "Person", value: p.name },
        ...(p.title ? [{ label: "Title", value: p.title }] : []),
        { label: "Tier", value: String(p.tierLevel) },
      ],
    });
    if (p.departmentId && deptIds.has(p.departmentId)) {
      edges.push({ source: personNodeId(p.id), target: deptNodeId(p.departmentId) });
    }
  }

  // Jobs (all of them), the account—job and person—job edges, and the
  // accounts those jobs commission. Prospect accounts with no jobs never
  // surface — only accounts referenced by a job node appear.
  const peopleIds = new Set(input.people.map((p) => p.id));
  const accountSeen = new Map<string, { name: string; kind: string; status: string }>();
  for (const j of input.jobs) {
    const completed = j.status === "COMPLETED";
    nodes.push({
      id: jobNodeId(j.id),
      type: "job",
      label: j.title,
      size: SIZE.job,
      tone: completed ? "ok" : "warn",
      href: `/dashboard/marketplace/${j.id}`,
      external: false,
      facts: [
        { label: "Job", value: j.title },
        { label: "Status", value: JOB_STATUS_LABEL[j.status] ?? j.status },
        { label: "Account", value: j.accountName },
        { label: "Gross value", value: money(j.grossValue) },
      ],
    });
    if (!accountSeen.has(j.accountId)) {
      accountSeen.set(j.accountId, {
        name: j.accountName,
        kind: j.accountKind,
        status: j.accountStatus,
      });
    }
    edges.push({ source: acctNodeId(j.accountId), target: jobNodeId(j.id) });
    for (const memberId of j.workerIds) {
      // A worker who isn't a person node (e.g. a since-removed user) gets
      // no dangling edge.
      if (peopleIds.has(memberId)) {
        edges.push({ source: personNodeId(memberId), target: jobNodeId(j.id) });
      }
    }
  }
  for (const [accountId, a] of accountSeen) {
    nodes.push({
      id: acctNodeId(accountId),
      type: "account",
      label: a.name,
      size: SIZE.account,
      tone: "info",
      href: `/dashboard/crm/accounts/${accountId}`,
      external: false,
      facts: [
        { label: "Client account", value: a.name },
        { label: "Kind", value: a.kind === "INDIVIDUAL" ? "Individual" : "Business" },
        { label: "Status", value: a.status },
      ],
    });
  }

  // Assets: commons (isSharedSocial) OR delivered (job COMPLETED) only —
  // the graph is delivery topology. The asset—job edge draws when the
  // asset's job is a node.
  const jobIds = new Set(input.jobs.map((j) => j.id));
  const assetNodes: GraphNode[] = [];
  const assetEdges: GraphEdge[] = [];
  for (const a of input.assets) {
    const delivered = a.jobStatus === "COMPLETED";
    if (!a.isSharedSocial && !delivered) continue;
    assetNodes.push({
      id: assetNodeId(a.id),
      type: "asset",
      label: a.title,
      size: SIZE.asset,
      tone: "secondary",
      href: a.fileUrl,
      external: true,
      facts: [
        { label: "Asset", value: a.title },
        { label: "Type", value: a.fileType },
        { label: "In the commons", value: a.isSharedSocial ? "Yes" : "No" },
      ],
    });
    if (a.jobId && jobIds.has(a.jobId)) {
      assetEdges.push({ source: assetNodeId(a.id), target: jobNodeId(a.jobId) });
    }
  }

  // Node cap (PRD 7.6): collapse assets first. Keep the leading assets when
  // forced to drop; edges to dropped assets go with them.
  const room = Math.max(0, NODE_CAP - nodes.length);
  const keptAssets = assetNodes.slice(0, room);
  const keptAssetIds = new Set(keptAssets.map((n) => n.id));
  const collapsedAssets = assetNodes.length - keptAssets.length;

  nodes.push(...keptAssets);
  edges.push(...assetEdges.filter((e) => keptAssetIds.has(e.source)));

  return { nodes, edges, collapsedAssets };
}

/** Fetch the real rows and derive (PRD 7.6). System users are excluded at
 *  the query (ruling, pre-M6); Decimal and relations are flattened to the
 *  serializable fixture shape. */
export async function buildGraph(): Promise<GraphData> {
  const [departments, people, jobs, assets] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.user.findMany({
      where: { isSystem: false, role: { in: ["EMPLOYEE", "MODERATOR", "ADMIN"] } },
      select: { id: true, name: true, title: true, departmentId: true, currentTierLevel: true },
    }),
    prisma.job.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        grossValue: true,
        accountId: true,
        account: { select: { name: true, kind: true, status: true } },
        workers: { select: { memberId: true } },
      },
    }),
    prisma.vaultAsset.findMany({
      select: {
        id: true,
        title: true,
        fileType: true,
        fileUrl: true,
        isSharedSocial: true,
        jobId: true,
        job: { select: { status: true } },
      },
    }),
  ]);

  return deriveGraph({
    departments,
    people: people.map((p) => ({
      id: p.id,
      name: p.name,
      title: p.title,
      departmentId: p.departmentId,
      tierLevel: p.currentTierLevel,
    })),
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      grossValue: j.grossValue.toFixed(2),
      accountId: j.accountId,
      accountName: j.account.name,
      accountKind: j.account.kind,
      accountStatus: j.account.status,
      workerIds: j.workers.map((w) => w.memberId),
    })),
    assets: assets.map((a) => ({
      id: a.id,
      title: a.title,
      fileType: a.fileType,
      fileUrl: a.fileUrl,
      isSharedSocial: a.isSharedSocial,
      jobId: a.jobId,
      jobStatus: a.job?.status ?? null,
    })),
  });
}
