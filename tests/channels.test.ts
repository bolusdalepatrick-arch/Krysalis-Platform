import { describe, expect, it } from "vitest";
import {
  canDecideShadowDraft,
  canPostChannel,
  canViewChannel,
  dmChannelId,
  type ChannelFacts,
  type ChannelViewer,
} from "@/lib/channels";

const facts = (overrides: Partial<ChannelFacts>): ChannelFacts => ({
  kind: "DEPARTMENT",
  departmentId: null,
  jobWorkerIds: [],
  accountUserIds: [],
  accountOwnerIds: [],
  accountWorkerIds: [],
  memberIds: [],
  ...overrides,
});

const admin: ChannelViewer = { id: "u-mara", role: "ADMIN", departmentId: "operations" };
const moderator: ChannelViewer = { id: "u-daniel", role: "MODERATOR", departmentId: "engineering" };
const worker: ChannelViewer = { id: "u-priya", role: "EMPLOYEE", departmentId: "engineering" };
const outsider: ChannelViewer = { id: "u-june", role: "EMPLOYEE", departmentId: "design" };
const client: ChannelViewer = { id: "u-ruth", role: "CLIENT", departmentId: null };

describe("channel visibility (PRD 7.3 as amended)", () => {
  it("keeps clients out of everything except their own account thread", () => {
    expect(canViewChannel(client, facts({ kind: "FIRM" }))).toBe(false);
    expect(canViewChannel(client, facts({ kind: "DEPARTMENT", departmentId: "design" }))).toBe(false);
    expect(canViewChannel(client, facts({ kind: "JOB", jobWorkerIds: ["u-june"] }))).toBe(false);
    expect(
      canViewChannel(client, facts({ kind: "ACCOUNT", accountUserIds: ["u-curtis"] })),
    ).toBe(false);
    expect(
      canViewChannel(client, facts({ kind: "ACCOUNT", accountUserIds: ["u-ruth"] })),
    ).toBe(true);
  });

  it("derives JOB visibility as workers, moderators, and admins", () => {
    const job = facts({ kind: "JOB", jobWorkerIds: ["u-priya"] });
    expect(canViewChannel(worker, job)).toBe(true);
    expect(canViewChannel(moderator, job)).toBe(true);
    expect(canViewChannel(admin, job)).toBe(true);
    expect(canViewChannel(outsider, job)).toBe(false);
  });

  it("derives ACCOUNT visibility from portal users, won-deal owners, active workers, and admins", () => {
    const account = facts({
      kind: "ACCOUNT",
      accountUserIds: ["u-ruth"],
      accountOwnerIds: ["u-lena"],
      accountWorkerIds: ["u-priya"],
    });
    expect(canViewChannel({ id: "u-lena", role: "EMPLOYEE", departmentId: "operations" }, account)).toBe(true);
    expect(canViewChannel(worker, account)).toBe(true);
    expect(canViewChannel(admin, account)).toBe(true);
    expect(canViewChannel(outsider, account)).toBe(false);
  });
});

describe("posting (PRD 7.3 / section 4)", () => {
  it("limits department posting to its members and admins", () => {
    const dept = facts({ kind: "DEPARTMENT", departmentId: "engineering" });
    expect(canPostChannel(worker, dept)).toBe(true);
    expect(canPostChannel(outsider, dept)).toBe(false);
    expect(canPostChannel(admin, dept)).toBe(true);
  });

  it("lets a client post only in their own thread", () => {
    expect(canPostChannel(client, facts({ kind: "ACCOUNT", accountUserIds: ["u-ruth"] }))).toBe(true);
    expect(canPostChannel(client, facts({ kind: "ACCOUNT", accountUserIds: ["u-mateo"] }))).toBe(false);
    expect(canPostChannel(client, facts({ kind: "FIRM" }))).toBe(false);
  });

  it("posts where it views for job channels and DMs", () => {
    const job = facts({ kind: "JOB", jobWorkerIds: ["u-priya"] });
    expect(canPostChannel(worker, job)).toBe(true);
    expect(canPostChannel(outsider, job)).toBe(false);
    const dm = facts({ kind: "DM", memberIds: ["u-priya", "u-june"] });
    expect(canPostChannel(worker, dm)).toBe(true);
    expect(canPostChannel(admin, dm)).toBe(false);
  });

  it("lets workers on the account's active jobs post in its thread (amended 7.3)", () => {
    const account = facts({
      kind: "ACCOUNT",
      accountUserIds: ["u-ruth"],
      accountOwnerIds: ["u-lena"],
      accountWorkerIds: ["u-priya"],
    });
    expect(canPostChannel(worker, account)).toBe(true);
    expect(canPostChannel(moderator, account)).toBe(false);
    expect(canPostChannel(outsider, account)).toBe(false);
  });

  it("never grants a DM to a client or parked user, even as an explicit member", () => {
    const dm = facts({ kind: "DM", memberIds: ["u-ruth", "u-robin", "u-priya"] });
    expect(canViewChannel({ id: "u-ruth", role: "CLIENT", departmentId: null }, dm)).toBe(false);
    expect(canViewChannel({ id: "u-robin", role: "USER", departmentId: null }, dm)).toBe(false);
    expect(canViewChannel(worker, dm)).toBe(true);
  });
});

describe("shadow draft rights (section 4 matrix)", () => {
  it("workers, moderators, and admins decide; outsiders never see the draft", () => {
    const job = facts({ kind: "JOB", jobWorkerIds: ["u-priya"] });
    expect(canDecideShadowDraft(worker, job)).toBe(true);
    expect(canDecideShadowDraft(moderator, job)).toBe(true);
    expect(canDecideShadowDraft(admin, job)).toBe(true);
    expect(canDecideShadowDraft(outsider, job)).toBe(false);
    expect(canDecideShadowDraft(admin, facts({ kind: "DEPARTMENT" }))).toBe(false);
  });
});

describe("dm pair id", () => {
  it("is order-independent and deterministic", () => {
    expect(dmChannelId("u-priya", "u-june")).toBe(dmChannelId("u-june", "u-priya"));
    expect(dmChannelId("u-priya", "u-june")).toBe("dm--u-june--u-priya");
  });
});
