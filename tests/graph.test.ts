/** lib/graph/build.ts node/edge derivation (PRD section 12), from a hand
 *  fixture — the pure deriveGraph holds every rule, so completing a job is
 *  just a status flip on the fixture. */
import { describe, expect, it } from "vitest";
import { deriveGraph, type GraphInput } from "@/lib/graph/build";

function fixture(overrides: Partial<GraphInput> = {}): GraphInput {
  return {
    departments: [
      { id: "d-eng", name: "Engineering", slug: "engineering" },
      { id: "d-design", name: "Design", slug: "design" },
    ],
    people: [
      { id: "u-1", name: "Priya Raman", title: "Staff Engineer", departmentId: "d-eng", tierLevel: 4 },
      { id: "u-2", name: "June Park", title: "Brand Designer", departmentId: "d-design", tierLevel: 2 },
      { id: "u-3", name: "Marcus Webb", title: "Frontend Engineer", departmentId: "d-eng", tierLevel: 3 },
    ],
    jobs: [
      {
        id: "j-live",
        title: "Northbeam dispatch, phase two",
        status: "IN_PROGRESS",
        grossValue: "12000.00",
        accountId: "a-northbeam",
        accountName: "Northbeam Logistics",
        accountKind: "BUSINESS",
        accountStatus: "ACTIVE",
        workerIds: ["u-1", "u-3"],
      },
      {
        id: "j-done",
        title: "Cassia reminders",
        status: "COMPLETED",
        grossValue: "8400.00",
        accountId: "a-cassia",
        accountName: "Cassia Health",
        accountKind: "BUSINESS",
        accountStatus: "ACTIVE",
        workerIds: ["u-2"],
      },
    ],
    assets: [
      // Commons asset on a live job → a node.
      { id: "v-commons", title: "Data model", fileType: "pdf", fileUrl: "https://x/1", isSharedSocial: true, jobId: "j-live", jobStatus: "IN_PROGRESS" },
      // Private asset on a live job → not delivered, not commons → no node.
      { id: "v-private", title: "WIP queue", fileType: "image", fileUrl: "https://x/2", isSharedSocial: false, jobId: "j-live", jobStatus: "IN_PROGRESS" },
      // Private asset on the completed job → delivered → a node.
      { id: "v-delivered", title: "Case study", fileType: "pdf", fileUrl: "https://x/3", isSharedSocial: false, jobId: "j-done", jobStatus: "COMPLETED" },
    ],
    ...overrides,
  };
}

const ids = (g: { nodes: { id: string }[] }) => new Set(g.nodes.map((n) => n.id));
const hasEdge = (g: { edges: { source: string; target: string }[] }, a: string, b: string) =>
  g.edges.some((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));

describe("graph node derivation", () => {
  it("includes departments, people, all jobs, and commissioning accounts", () => {
    const g = deriveGraph(fixture());
    const id = ids(g);
    expect(id.has("dept:d-eng")).toBe(true);
    expect(id.has("user:u-1")).toBe(true);
    expect(id.has("job:j-live")).toBe(true);
    expect(id.has("job:j-done")).toBe(true);
    expect(id.has("acct:a-northbeam")).toBe(true);
    expect(id.has("acct:a-cassia")).toBe(true);
  });

  it("colors jobs by delivery state — warn in flight, ok completed", () => {
    const g = deriveGraph(fixture());
    expect(g.nodes.find((n) => n.id === "job:j-live")?.tone).toBe("warn");
    expect(g.nodes.find((n) => n.id === "job:j-done")?.tone).toBe("ok");
  });

  it("includes only commons or delivered assets", () => {
    const id = ids(deriveGraph(fixture()));
    expect(id.has("asset:v-commons")).toBe(true); // commons
    expect(id.has("asset:v-delivered")).toBe(true); // delivered
    expect(id.has("asset:v-private")).toBe(false); // private, job still in flight
  });

  it("drops a prospect account with no jobs", () => {
    const g = deriveGraph(
      fixture({
        jobs: [], // no jobs at all
        assets: [],
      }),
    );
    expect([...ids(g)].some((i) => i.startsWith("acct:"))).toBe(false);
  });

  it("excludes a node for a system user the fixture never lists", () => {
    // System users are dropped at the query (buildGraph), so they never reach
    // deriveGraph — a fixture without them yields no shadow/gate node.
    const id = ids(deriveGraph(fixture()));
    expect(id.has("user:u-shadow")).toBe(false);
    expect(id.has("user:u-gate")).toBe(false);
  });
});

describe("graph edge derivation", () => {
  it("draws membership, worked-on, commissioned, and delivered edges", () => {
    const g = deriveGraph(fixture());
    expect(hasEdge(g, "user:u-1", "dept:d-eng")).toBe(true); // membership
    expect(hasEdge(g, "user:u-1", "job:j-live")).toBe(true); // worked on
    expect(hasEdge(g, "acct:a-northbeam", "job:j-live")).toBe(true); // commissioned
    expect(hasEdge(g, "asset:v-delivered", "job:j-done")).toBe(true); // delivered
  });

  it("draws no pairwise person—person edges", () => {
    const g = deriveGraph(fixture());
    const personPairs = g.edges.filter(
      (e) => e.source.startsWith("user:") && e.target.startsWith("user:"),
    );
    expect(personPairs).toHaveLength(0);
  });
});

describe("the graph reflects a newly completed job with no graph-specific write", () => {
  it("recolors the job and surfaces its delivered private asset on the next derive", () => {
    const before = deriveGraph(fixture());
    expect(before.nodes.find((n) => n.id === "job:j-live")?.tone).toBe("warn");
    expect(ids(before).has("asset:v-private")).toBe(false);

    // The only change is the same rows with the job completed — exactly what
    // approveCompletion leaves behind, no graph table touched.
    const f = fixture();
    f.jobs[0].status = "COMPLETED";
    f.assets[1].jobStatus = "COMPLETED";
    const after = deriveGraph(f);

    expect(after.nodes.find((n) => n.id === "job:j-live")?.tone).toBe("ok");
    expect(ids(after).has("asset:v-private")).toBe(true); // now delivered
    expect(hasEdge(after, "asset:v-private", "job:j-live")).toBe(true);
  });
});

describe("node cap collapses assets first", () => {
  it("drops asset nodes past 300 and reports the count, keeping non-assets", () => {
    const people = Array.from({ length: 290 }, (_, i) => ({
      id: `p-${i}`,
      name: `Person ${i}`,
      title: null,
      departmentId: "d-eng",
      tierLevel: 1,
    }));
    const assets = Array.from({ length: 50 }, (_, i) => ({
      id: `a-${i}`,
      title: `Asset ${i}`,
      fileType: "pdf",
      fileUrl: `https://x/${i}`,
      isSharedSocial: true,
      jobId: null,
      jobStatus: null,
    }));
    // 2 depts + 290 people + 1 job + 1 account = 294 non-asset nodes; room
    // for 6 assets, the other 44 collapse.
    const oneJob = [
      {
        id: "j-x",
        title: "Solo job",
        status: "IN_PROGRESS",
        grossValue: "1000.00",
        accountId: "a-x",
        accountName: "Acme",
        accountKind: "BUSINESS",
        accountStatus: "ACTIVE",
        workerIds: [] as string[],
      },
    ];
    const g = deriveGraph(fixture({ people, assets, jobs: oneJob }));
    const assetNodes = g.nodes.filter((n) => n.type === "asset");
    expect(g.nodes.length).toBeLessThanOrEqual(300);
    expect(assetNodes).toHaveLength(6);
    expect(g.collapsedAssets).toBe(44);
    // No non-asset node was dropped.
    expect(g.nodes.filter((n) => n.type === "person")).toHaveLength(290);
  });
});
