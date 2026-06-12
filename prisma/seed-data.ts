/**
 * The seed narrative (PRD section 10) — hand-authored, deterministic, stable
 * ids. This file is the canonical source: prisma/seed.ts writes it to the
 * database, and lib/mock re-exports it for the M0 surfaces until each feature
 * milestone moves to Prisma reads. No faker, same data every run.
 */
import { composeProgressUpdate } from "../lib/shadow/deterministic";
import type { ShadowFacts } from "../lib/shadow/types";
import type {
  MockAccount,
  MockBid,
  MockBookingCard,
  MockChannel,
  MockCourse,
  MockDeal,
  MockDepartment,
  MockForumPost,
  MockJob,
  MockMessage,
  MockPerson,
  MockVaultAsset,
} from "../lib/mock/types";

/** "Today" for every derived figure in the seed. */
export const SEED_NOW = "2026-06-12T12:00:00";

// ── Departments ─────────────────────────────────────────────

export interface SeedDepartment extends MockDepartment {
  onboardingCourseId: string;
}

export const DEPARTMENTS: SeedDepartment[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Builds and ships the automation work clients sign for.",
    onboardingCourseId: "c-typescript",
  },
  {
    id: "design",
    name: "Design",
    description: "Brand systems, product surfaces, and everything clients see.",
    onboardingCourseId: "c-brand-fieldwork",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "The firm's voice: campaigns, content, and the public site.",
    onboardingCourseId: "c-voice",
  },
  {
    id: "operations",
    name: "Operations",
    description: "Keeps engagements, accounts, and the books moving on time.",
    onboardingCourseId: "c-handover",
  },
];

// ── People ──────────────────────────────────────────────────

/** Ledger history from before the visible five months of jobs (the firm has
 *  run on its own platform since early 2025). Expanded deterministically by
 *  seed.ts into XpEvents with refId null; `earnings` joins in-database
 *  completed splits to form totalEarnings. */
export interface SeedHistory {
  jobs: number;
  courses: number;
  lessons: number;
  earnings: number;
}

export interface SeedUser extends MockPerson {
  createdAt: string;
  onboardingCompletedAt?: string;
  portalStartDismissedAt?: string;
  detailsConfirmedAt?: string;
  history: SeedHistory;
}

const NO_HISTORY: SeedHistory = { jobs: 0, courses: 0, lessons: 0, earnings: 0 };

/** xp/tier/earnings on these rows are M0 display approximations; the seed
 *  recomputes the real figures from the ledger it writes. */
export const USERS: SeedUser[] = [
  { id: "u-mara", name: "Mara Voss", title: "Managing Director", role: "ADMIN", departmentId: "operations", email: "mara@krysalis.studio", xp: 2210, tier: 4, earnings: 0, createdAt: "2025-01-06T09:00:00", onboardingCompletedAt: "2025-01-06T17:00:00", history: { jobs: 9, courses: 4, lessons: 32, earnings: 0 } },

  { id: "u-daniel", name: "Daniel Okafor", title: "Engineering Lead", role: "MODERATOR", departmentId: "engineering", email: "daniel@krysalis.studio", xp: 3185, tier: 5, earnings: 41250, createdAt: "2025-01-06T09:00:00", onboardingCompletedAt: "2025-01-07T16:00:00", history: { jobs: 19, courses: 4, lessons: 26, earnings: 37650 } },
  { id: "u-priya", name: "Priya Raman", title: "Staff Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "priya@krysalis.studio", xp: 2640, tier: 4, earnings: 38900, createdAt: "2025-02-03T09:00:00", onboardingCompletedAt: "2025-02-05T15:00:00", history: { jobs: 13, courses: 2, lessons: 18, earnings: 33700 } },
  { id: "u-marcus", name: "Marcus Webb", title: "Frontend Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "marcus@krysalis.studio", xp: 1480, tier: 3, earnings: 21600, createdAt: "2025-04-14T09:00:00", onboardingCompletedAt: "2025-04-16T14:00:00", history: { jobs: 8, courses: 1, lessons: 12, earnings: 21600 } },
  { id: "u-owen", name: "Owen Gallagher", title: "Backend Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "owen@krysalis.studio", xp: 1130, tier: 3, earnings: 17800, createdAt: "2025-05-12T09:00:00", onboardingCompletedAt: "2025-05-14T11:00:00", history: { jobs: 6, courses: 1, lessons: 8, earnings: 14000 } },
  { id: "u-fatima", name: "Fatima El-Sayed", title: "Data Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "fatima@krysalis.studio", xp: 940, tier: 3, earnings: 12400, createdAt: "2025-06-09T09:00:00", onboardingCompletedAt: "2025-06-11T10:00:00", history: { jobs: 4, courses: 1, lessons: 6, earnings: 12400 } },
  { id: "u-viktor", name: "Viktor Hansen", title: "Automation Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "viktor@krysalis.studio", xp: 705, tier: 2, earnings: 9100, createdAt: "2025-08-04T09:00:00", onboardingCompletedAt: "2025-08-06T13:00:00", history: { jobs: 2, courses: 1, lessons: 6, earnings: 6500 } },
  { id: "u-grace", name: "Grace Ndlovu", title: "QA Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "grace@krysalis.studio", xp: 410, tier: 2, earnings: 5200, createdAt: "2025-10-06T09:00:00", onboardingCompletedAt: "2025-10-08T12:00:00", history: { jobs: 1, courses: 0, lessons: 1, earnings: 5200 } },

  { id: "u-aiko", name: "Aiko Tanaka", title: "Design Lead", role: "EMPLOYEE", departmentId: "design", email: "aiko@krysalis.studio", xp: 2380, tier: 4, earnings: 30150, createdAt: "2025-01-20T09:00:00", onboardingCompletedAt: "2025-01-22T15:00:00", history: { jobs: 12, courses: 3, lessons: 20, earnings: 27450 } },
  { id: "u-june", name: "June Park", title: "Brand Designer", role: "EMPLOYEE", departmentId: "design", email: "june@krysalis.studio", xp: 1820, tier: 4, earnings: 24700, createdAt: "2025-03-10T09:00:00", onboardingCompletedAt: "2025-03-12T16:00:00", history: { jobs: 9, courses: 2, lessons: 14, earnings: 24700 } },
  { id: "u-theo", name: "Theo Marchetti", title: "Product Designer", role: "EMPLOYEE", departmentId: "design", email: "theo@krysalis.studio", xp: 980, tier: 3, earnings: 13900, createdAt: "2025-06-23T09:00:00", onboardingCompletedAt: "2025-06-25T11:00:00", history: { jobs: 5, courses: 1, lessons: 8, earnings: 13900 } },
  { id: "u-ines", name: "Ines Castel", title: "UX Researcher", role: "EMPLOYEE", departmentId: "design", email: "ines@krysalis.studio", xp: 560, tier: 2, earnings: 6800, createdAt: "2025-09-01T09:00:00", onboardingCompletedAt: "2025-09-03T14:00:00", history: { jobs: 3, courses: 1, lessons: 4, earnings: 6800 } },
  { id: "u-caleb", name: "Caleb Foster", title: "Motion Designer", role: "EMPLOYEE", departmentId: "design", email: "caleb@krysalis.studio", xp: 330, tier: 2, earnings: 4100, createdAt: "2025-11-17T09:00:00", onboardingCompletedAt: "2025-11-19T10:00:00", history: { jobs: 1, courses: 1, lessons: 3, earnings: 4100 } },
  { id: "u-noor", name: "Noor Haddad", title: "Junior Designer", role: "EMPLOYEE", departmentId: "design", email: "noor@krysalis.studio", xp: 15, tier: 1, earnings: 0, createdAt: "2026-05-22T09:00:00", history: NO_HISTORY },

  { id: "u-sara", name: "Sara Lindqvist", title: "Content Strategist", role: "MODERATOR", departmentId: "marketing", email: "sara@krysalis.studio", xp: 1675, tier: 4, earnings: 19800, createdAt: "2025-02-17T09:00:00", onboardingCompletedAt: "2025-02-19T15:00:00", history: { jobs: 8, courses: 3, lessons: 16, earnings: 19800 } },
  { id: "u-hana", name: "Hana Suzuki", title: "Marketing Lead", role: "EMPLOYEE", departmentId: "marketing", email: "hana@krysalis.studio", xp: 1390, tier: 3, earnings: 16500, createdAt: "2025-03-03T09:00:00", onboardingCompletedAt: "2025-03-05T13:00:00", history: { jobs: 7, courses: 2, lessons: 12, earnings: 16500 } },
  { id: "u-dmitri", name: "Dmitri Volkov", title: "SEO Specialist", role: "EMPLOYEE", departmentId: "marketing", email: "dmitri@krysalis.studio", xp: 620, tier: 2, earnings: 7300, createdAt: "2025-07-21T09:00:00", onboardingCompletedAt: "2025-07-23T12:00:00", history: { jobs: 3, courses: 1, lessons: 5, earnings: 7300 } },
  { id: "u-jonas", name: "Jonas Weber", title: "Performance Marketer", role: "EMPLOYEE", departmentId: "marketing", email: "jonas@krysalis.studio", xp: 540, tier: 2, earnings: 6200, createdAt: "2025-08-18T09:00:00", onboardingCompletedAt: "2025-08-20T14:00:00", history: { jobs: 2, courses: 1, lessons: 6, earnings: 6200 } },
  { id: "u-camille", name: "Camille Roux", title: "Copywriter", role: "EMPLOYEE", departmentId: "marketing", email: "camille@krysalis.studio", xp: 760, tier: 3, earnings: 8900, createdAt: "2025-05-26T09:00:00", onboardingCompletedAt: "2025-05-28T11:00:00", history: { jobs: 4, courses: 1, lessons: 6, earnings: 8900 } },
  { id: "u-rebecca", name: "Rebecca Otieno", title: "Lifecycle Marketer", role: "EMPLOYEE", departmentId: "marketing", email: "rebecca@krysalis.studio", xp: 480, tier: 2, earnings: 5400, createdAt: "2025-09-15T09:00:00", onboardingCompletedAt: "2025-09-17T10:00:00", history: { jobs: 2, courses: 1, lessons: 4, earnings: 5400 } },

  { id: "u-lena", name: "Lena Borowski", title: "Account Manager", role: "EMPLOYEE", departmentId: "operations", email: "lena@krysalis.studio", xp: 1950, tier: 4, earnings: 14200, createdAt: "2025-02-03T09:00:00", onboardingCompletedAt: "2025-02-05T16:00:00", history: { jobs: 7, courses: 3, lessons: 18, earnings: 14200 } },
  { id: "u-tomas", name: "Tomás Herrera", title: "Ops Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "tomas@krysalis.studio", xp: 870, tier: 3, earnings: 9800, createdAt: "2025-04-28T09:00:00", onboardingCompletedAt: "2025-04-30T12:00:00", history: { jobs: 4, courses: 1, lessons: 10, earnings: 9800 } },
  { id: "u-elias", name: "Elias Vance", title: "Operations Lead", role: "EMPLOYEE", departmentId: "operations", email: "elias@krysalis.studio", xp: 1240, tier: 3, earnings: 11600, createdAt: "2025-01-20T09:00:00", onboardingCompletedAt: "2025-01-22T14:00:00", history: { jobs: 6, courses: 2, lessons: 12, earnings: 11600 } },
  { id: "u-martina", name: "Martina Silva", title: "Project Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "martina@krysalis.studio", xp: 690, tier: 2, earnings: 7700, createdAt: "2025-07-07T09:00:00", onboardingCompletedAt: "2025-07-09T13:00:00", history: { jobs: 3, courses: 1, lessons: 7, earnings: 7700 } },
  { id: "u-andre", name: "Andre Boateng", title: "Billing Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "andre@krysalis.studio", xp: 230, tier: 1, earnings: 2400, createdAt: "2025-12-01T09:00:00", onboardingCompletedAt: "2025-12-03T11:00:00", history: { jobs: 1, courses: 0, lessons: 3, earnings: 2400 } },

  { id: "u-shadow", name: "Shadow", title: "Draft agent", role: "USER", departmentId: null, email: "shadow@krysalis.studio", isSystem: true, xp: 0, tier: 1, earnings: 0, createdAt: "2025-01-06T09:00:00", history: NO_HISTORY },
  { id: "u-gate", name: "Gate", title: "Website relay", role: "USER", departmentId: null, email: "gate@krysalis.studio", isSystem: true, xp: 0, tier: 1, earnings: 0, createdAt: "2025-01-06T09:00:00", history: NO_HISTORY },

  { id: "u-robin", name: "Robin Vale", title: "", role: "USER", departmentId: null, email: "robin@krysalis.studio", xp: 0, tier: 1, earnings: 0, createdAt: "2026-06-10T09:00:00", history: NO_HISTORY },

  { id: "u-curtis", name: "Curtis Hale", title: "Operations Director, Northbeam Logistics", role: "CLIENT", accountId: "a-northbeam", departmentId: null, email: "curtis@northbeamlogistics.com", xp: 0, tier: 1, earnings: 0, createdAt: "2025-11-03T09:00:00", portalStartDismissedAt: "2025-11-04T10:12:00", history: NO_HISTORY },
  { id: "u-alana", name: "Alana Reyes", title: "Practice Manager, Cassia Health", role: "CLIENT", accountId: "a-cassia", departmentId: null, email: "alana@cassiahealth.com", xp: 0, tier: 1, earnings: 0, createdAt: "2025-12-15T09:00:00", portalStartDismissedAt: "2025-12-15T15:40:00", history: NO_HISTORY },
  { id: "u-margaret", name: "Margaret Ellison", title: "Partner, Fernwell & Co.", role: "CLIENT", accountId: "a-fernwell", departmentId: null, email: "margaret@fernwellco.com", xp: 0, tier: 1, earnings: 0, createdAt: "2026-02-09T09:00:00", portalStartDismissedAt: "2026-02-10T09:05:00", history: NO_HISTORY },
  { id: "u-felix", name: "Felix Grant", title: "Wholesale Manager, Ratio Coffee Roasters", role: "CLIENT", accountId: "a-ratio", departmentId: null, email: "felix@ratiocoffee.com", xp: 0, tier: 1, earnings: 0, createdAt: "2026-03-23T09:00:00", portalStartDismissedAt: "2026-03-23T16:22:00", history: NO_HISTORY },
  { id: "u-ruth", name: "Ruth Calder", title: "Claims Operations Director, Tidegate Insurance", role: "CLIENT", accountId: "a-tidegate", departmentId: null, email: "ruth@tidegateinsurance.com", xp: 0, tier: 1, earnings: 0, createdAt: "2026-05-26T09:30:00", history: NO_HISTORY },
  { id: "u-mateo", name: "Mateo Vargas", title: "Independent Financial Planner", role: "CLIENT", accountId: "a-vargas", departmentId: null, email: "mateo@vargasplanning.com", xp: 0, tier: 1, earnings: 0, createdAt: "2026-05-28T09:00:00", detailsConfirmedAt: "2026-06-08T12:30:00", history: NO_HISTORY },
];

// ── Accounts & contacts ─────────────────────────────────────

export const ACCOUNTS: MockAccount[] = [
  {
    id: "a-northbeam",
    name: "Northbeam Logistics",
    kind: "BUSINESS",
    status: "ACTIVE",
    website: "northbeamlogistics.com",
    notes: "Regional carrier out of Spokane; the dispatch desk still runs on spreadsheets and phone calls.",
    contacts: [
      { name: "Curtis Hale", email: "curtis@northbeamlogistics.com", title: "Operations Director", isPrimary: true },
      { name: "Irene Walsh", email: "irene@northbeamlogistics.com", title: "Dispatch Supervisor" },
    ],
  },
  {
    id: "a-cassia",
    name: "Cassia Health",
    kind: "BUSINESS",
    status: "ACTIVE",
    website: "cassiahealth.com",
    notes: "Three-clinic family practice group; intake and referral paperwork are the recurring complaints.",
    contacts: [{ name: "Alana Reyes", email: "alana@cassiahealth.com", title: "Practice Manager", isPrimary: true }],
  },
  {
    id: "a-fernwell",
    name: "Fernwell & Co.",
    kind: "BUSINESS",
    status: "ACTIVE",
    website: "fernwellco.com",
    notes: "Boutique accounting firm; quarterly reporting season doubles their workload.",
    contacts: [
      { name: "Margaret Ellison", email: "margaret@fernwellco.com", title: "Partner", isPrimary: true },
      { name: "Paul Iverson", email: "paul@fernwellco.com", title: "Senior Accountant" },
    ],
  },
  {
    id: "a-ratio",
    name: "Ratio Coffee Roasters",
    kind: "BUSINESS",
    status: "ACTIVE",
    website: "ratiocoffee.com",
    notes: "Roaster with forty wholesale accounts; ordering happens over email and memory.",
    contacts: [{ name: "Felix Grant", email: "felix@ratiocoffee.com", title: "Wholesale Manager", isPrimary: true }],
  },
  {
    id: "a-tidegate",
    name: "Tidegate Insurance",
    kind: "BUSINESS",
    status: "ACTIVE",
    website: "tidegateinsurance.com",
    notes: "Mid-size claims shop; intake automation signed in May, kickoff under way.",
    contacts: [
      { name: "Ruth Calder", email: "ruth@tidegateinsurance.com", title: "Claims Operations Director", isPrimary: true },
      { name: "Sam Okada", email: "sam@tidegateinsurance.com", title: "Claims Team Lead" },
    ],
  },
  {
    id: "a-vargas",
    name: "Mateo Vargas",
    kind: "INDIVIDUAL",
    status: "ACTIVE",
    website: "vargasplanning.com",
    notes: "Independent financial planner; needs a credible site and a structured intake form.",
    contacts: [{ name: "Mateo Vargas", email: "mateo@vargasplanning.com", isPrimary: true }],
  },
  {
    id: "a-halcyon",
    name: "Halcyon Dental Partners",
    kind: "BUSINESS",
    status: "PROSPECT",
    website: "halcyondental.com",
    notes: "Two-clinic dental group in Tacoma; front-desk automation is the wedge.",
    contacts: [{ name: "Rosa Calloway", email: "rosa@halcyondental.com", title: "Office Manager", isPrimary: true }],
  },
  {
    id: "a-westerly",
    name: "Westerly Charter Co.",
    kind: "BUSINESS",
    status: "PROSPECT",
    website: "westerlycharter.com",
    notes: "Coastal charter operator; crew scheduling and maintenance logs live on paper.",
    contacts: [{ name: "Tom Beckett", email: "tom@westerlycharter.com", title: "Owner", isPrimary: true }],
  },
  {
    id: "a-bellhaven",
    name: "Bellhaven Property Group",
    kind: "BUSINESS",
    status: "PROSPECT",
    website: "bellhavenproperty.com",
    notes: "Manages ninety rental units with two office staff; tenant communications eat the week.",
    contacts: [{ name: "Yusuf Rahman", email: "yusuf@bellhavenproperty.com", title: "Property Manager", isPrimary: true }],
  },
];

// ── Jobs, bids ──────────────────────────────────────────────

/** Full descriptions for jobs not written inline live in
 *  EXTRA_JOB_DESCRIPTIONS below and are merged by jobDescription(). */
export const JOBS: MockJob[] = [
  {
    id: "j-northbeam-dispatch-2",
    title: "Northbeam dispatch dashboard, phase two",
    brief: "Live load board, driver status, and depot reporting on top of the phase-one data model.",
    description: `Phase one put Northbeam's dispatch data in one place. Phase two puts it to work: a live load board the dispatch desk can run the morning from, driver status that updates without a phone call, and depot-level reporting that the Spokane and Boise managers can pull themselves.

The phase-one ingest and schema carry over unchanged. The work is the dashboard surfaces, a realtime feed off the existing event stream, and three report views the depot managers signed off on in the scoping call. Irene Walsh is the day-to-day contact; she has agreed to a weekly review on Thursdays.`,
    status: "OPEN",
    grossValue: 18400,
    workerPool: 12000,
    firmMargin: 6400,
    accountId: "a-northbeam",
    departmentId: "engineering",
    dueAt: "2026-07-10",
    workerIds: [],
  },
  {
    id: "j-cassia-intake-redesign",
    title: "Cassia patient-intake redesign",
    brief: "Replace the three-clinic paper intake packet with one structured digital flow.",
    status: "OPEN",
    grossValue: 12800,
    workerPool: 8320,
    firmMargin: 4480,
    accountId: "a-cassia",
    departmentId: "design",
    dueAt: "2026-07-24",
    workerIds: [],
  },
  {
    id: "j-ratio-spring-campaign",
    title: "Ratio spring campaign system",
    brief: "A reusable campaign kit — landing template, email set, and wholesale one-pager.",
    status: "OPEN",
    grossValue: 9600,
    workerPool: 6240,
    firmMargin: 3360,
    accountId: "a-ratio",
    departmentId: "marketing",
    dueAt: "2026-08-14",
    workerIds: [],
  },
  {
    id: "j-fernwell-reporting",
    title: "Fernwell quarterly reporting automation",
    brief: "Generate the quarterly client report packets Fernwell currently assembles by hand.",
    status: "OPEN",
    grossValue: 7400,
    workerPool: 4800,
    firmMargin: 2600,
    accountId: "a-fernwell",
    departmentId: "engineering",
    dueAt: "2026-07-31",
    workerIds: [],
  },
  {
    id: "j-ratio-wholesale-list",
    title: "Ratio wholesale price-list refresh",
    brief: "Redesign the wholesale price list and templates so updates take minutes, not a morning.",
    status: "ASSIGNED",
    grossValue: 3200,
    workerPool: 2080,
    firmMargin: 1120,
    accountId: "a-ratio",
    departmentId: "design",
    dueAt: "2026-06-26",
    workerIds: ["u-caleb"],
  },
  {
    id: "j-northbeam-driver-onboarding",
    title: "Northbeam driver onboarding packet",
    brief: "Standardize the new-driver paperwork into one checklist-driven packet.",
    status: "ASSIGNED",
    grossValue: 4800,
    workerPool: 2900,
    firmMargin: 1900,
    accountId: "a-northbeam",
    departmentId: "operations",
    dueAt: "2026-07-03",
    workerIds: ["u-martina"],
  },
  {
    id: "j-tidegate-claims-intake",
    title: "Tidegate claims-intake automation",
    brief: "Parse inbound claim notices, sync them to the claims system, and queue the exceptions.",
    description: `Tidegate's claims team re-keys the same first-notice-of-loss data into three systems, and the backlog grows every renewal season. This engagement replaces the manual chain with an intake parser for the two highest-volume carrier formats, a claim-record sync into their existing system of record, and an exception queue for anything the parser cannot classify with confidence.

Scope was fixed in the May proposal: parser, sync, queue, and a four-week shadow period where the team verifies the automated records against hand-keyed ones. Ruth Calder owns acceptance on the Tidegate side; the shadow period ends with the July review.`,
    status: "IN_PROGRESS",
    grossValue: 21500,
    workerPool: 13975,
    firmMargin: 7525,
    accountId: "a-tidegate",
    departmentId: "engineering",
    dueAt: "2026-07-17",
    workerIds: ["u-priya", "u-marcus"],
    dealId: "d-tidegate-won",
  },
  {
    id: "j-vargas-site",
    title: "Vargas advisory site and intake form",
    brief: "A one-page advisory site and a structured intake form that books real consultations.",
    status: "IN_PROGRESS",
    grossValue: 1800,
    workerPool: 1170,
    firmMargin: 630,
    accountId: "a-vargas",
    departmentId: "design",
    dueAt: "2026-06-30",
    workerIds: ["u-june"],
  },
  {
    id: "j-cassia-referral-fax",
    title: "Cassia referral-fax triage pilot",
    brief: "Classify inbound referral faxes and route them to the right clinic queue.",
    status: "IN_PROGRESS",
    grossValue: 6400,
    workerPool: 4200,
    firmMargin: 2200,
    accountId: "a-cassia",
    departmentId: "engineering",
    dueAt: "2026-07-08",
    workerIds: ["u-viktor", "u-fatima"],
  },
  {
    id: "j-fernwell-brand-refresh",
    title: "Fernwell brand refresh, collateral set",
    brief: "Letterhead, proposal template, and report covers in the refreshed Fernwell system.",
    status: "REVIEW",
    grossValue: 8900,
    workerPool: 5600,
    firmMargin: 3300,
    accountId: "a-fernwell",
    departmentId: "design",
    dueAt: "2026-06-13",
    workerIds: ["u-june", "u-theo"],
  },
  {
    id: "j-ratio-subscription-emails",
    title: "Ratio subscription email flows",
    brief: "Welcome, dunning, and win-back flows for the home-subscriber program.",
    status: "REVIEW",
    grossValue: 5600,
    workerPool: 3500,
    firmMargin: 2100,
    accountId: "a-ratio",
    departmentId: "marketing",
    dueAt: "2026-06-20",
    workerIds: ["u-rebecca", "u-camille"],
  },
  {
    id: "j-northbeam-dispatch-1",
    title: "Northbeam dispatch dashboard, phase one",
    brief: "Consolidate dispatch data from spreadsheets and TMS exports into one model.",
    status: "COMPLETED",
    grossValue: 14200,
    workerPool: 9200,
    firmMargin: 5000,
    accountId: "a-northbeam",
    departmentId: "engineering",
    completedAt: "2026-04-17",
    workerIds: ["u-priya", "u-owen"],
  },
  {
    id: "j-cassia-booking-reminders",
    title: "Cassia appointment reminder pipeline",
    brief: "Automated reminder and reschedule flow across the three clinics.",
    status: "COMPLETED",
    grossValue: 9800,
    workerPool: 6300,
    firmMargin: 3500,
    accountId: "a-cassia",
    departmentId: "engineering",
    completedAt: "2026-02-20",
    workerIds: ["u-daniel", "u-viktor"],
  },
  {
    id: "j-tidegate-quote-letters",
    title: "Tidegate quote-letter templates",
    brief: "Rebuild the quote-letter set in the claims team's document system.",
    status: "COMPLETED",
    grossValue: 4400,
    workerPool: 2700,
    firmMargin: 1700,
    accountId: "a-tidegate",
    departmentId: "design",
    completedAt: "2026-06-05",
    workerIds: ["u-aiko"],
  },
];

/** Spliced from the seed-content authoring pass; merged by jobDescription(). */
export const EXTRA_JOB_DESCRIPTIONS: Record<string, string> = {
  "j-cassia-intake-redesign": "Every new patient at Cassia's three clinics starts with an eleven-page paper packet that has drifted into three clinic-specific versions nobody chose on purpose. Patients skip pages, front desks chase the gaps by phone, and intake routinely takes longer than the appointment it precedes. This engagement replaces the packet with one structured digital flow — one path per visit type, asking only the questions that visit needs.\n\nScope runs research first: clinic visits and front-desk interviews at all three locations, then a field-by-field cut of the packet, then build-ready screens for each visit type. Alana Reyes is the contact and arranges front-desk time; review checkpoints land at the end of research and at first screens, with the build itself scoped separately once the flow is approved.",
  "j-ratio-spring-campaign": "Ratio's spring wholesale push gets rebuilt from nothing every year — last spring's landing page is gone, the email copy lives in someone's drafts, and the one-pager exists in three versions with two prices. This engagement builds the spring 2027 push as a kit instead: a landing template, an email set, and a wholesale one-pager made to be reused, not recreated.\n\nScope is the three kit pieces plus a short usage note so the kit survives the year between campaigns. What the subscription flows proved carries over — plain copy beat designed copy in every segment — and the kit is built on that finding. Felix Grant is the contact; pieces go to him for review as they finish, with the assembled kit handed over in August, well ahead of the season.",
  "j-fernwell-reporting": "Quarterly reporting season doubles Fernwell's workload, and most of the added hours are assembly, not accounting: export the ledger, paste into the template, check the numbers, repeat for every client. This engagement generates the packets instead — ledger export in, finished packet out, with anything that fails a check flagged for a person rather than passed through.\n\nScope is an export normalizer so malformed quarters get caught before generation, packet output built on the refreshed report covers, and a scheduled run ahead of each close. Paul Iverson supplies export samples and reviews the technical side; Margaret Ellison approves the packet format. The target is live before the Q3 close.",
  "j-ratio-wholesale-list": "Ratio's wholesale price list goes out to forty accounts, and every price change costs Felix a morning: nudge the table, fix the line wraps, re-export, find the typo after sending. The list reads fine; the file behind it fights every edit. This engagement rebuilds the price list and its templates so an update takes minutes and is right the first time.\n\nScope is the redesigned list, the matching templates, and an update procedure Felix can run without design help. Felix Grant supplies current pricing and is the only reviewer; one pass on the rebuilt list, then handover in June ahead of the next price change.",
  "j-northbeam-driver-onboarding": "A new Northbeam driver's first week starts with paperwork assembled from whichever depot has the most recent versions — some forms duplicated, some outdated, never in the same order twice. Dispatch then spends weeks chasing the signatures that fell through. This engagement standardizes new-driver paperwork into one checklist-driven packet a depot lead can walk a hire through in a single sitting.\n\nScope covers the consolidated packet, the checklist that fronts it, and a one-page guide for depot leads. Source documents come from the Spokane and Boise depots; Irene Walsh is the day-to-day contact, and Curtis Hale signs off on the final packet ahead of the summer hiring round.",
  "j-vargas-site": "Mateo Vargas plans retirements for a living, and his current site doesn't make the case — a dated template, no clear way to book, and an intake questionnaire long enough that prospects quit halfway through. This engagement replaces it with a one-page advisory site and a structured intake form short enough to finish, so an inquiry ends in a booked consultation rather than an abandoned form.\n\nScope is the page, the form, and the copy for both. The form rebuilds Mateo's existing questionnaire down to the questions clients actually answer, keeping the items his compliance review requires. Mateo reviews everything himself — a client of one — and approvals run direct and same-day, against a June handover.",
  "j-cassia-referral-fax": "Referrals still reach Cassia by fax — dozens of pages a day across three clinics, sorted by whoever is free at the desk, and a misrouted referral can sit unread for days. This pilot classifies inbound referral faxes and routes each one to the right clinic queue, with anything ambiguous going to a person instead of a guess.\n\nPilot scope stays deliberately narrow: classification for the common referral types, routing rules per clinic, and the audit trail the clinics asked for so any misroute can be traced. Alana Reyes is the contact; reviews run every two weeks against real misclassification counts, and those numbers decide whether a full rollout gets scoped.",
  "j-fernwell-brand-refresh": "Fernwell's refreshed identity currently stops at the logo. Everything a client actually touches — letterhead, proposals, quarterly report covers — still carries the old marks, and years of per-partner template drift make one firm look like three. This engagement builds out the collateral set in the refreshed system: letterhead, a proposal template, and report covers that hold together as one voice.\n\nScope is the three collateral pieces, delivered as Word templates the firm can edit without breaking, not design files they can't open. Margaret Ellison reviews for the partners; the set needs to land before the quarterly packets go out, which is the date that matters on their side.",
  "j-ratio-subscription-emails": "Ratio's home-subscriber program grew faster than the email behind it. New subscribers get a payment receipt and nothing else, failed payments cancel quietly, and lapsed subscribers never hear from the roastery again. This engagement builds the three flows the program is missing — welcome, dunning, and win-back — written in Ratio's own dry voice rather than subscription boilerplate.\n\nScope is six emails across the three flows plus the trigger logic behind each. Dunning ships first, since failed payments are where the program loses the most. Felix Grant is the contact and approves copy; the flows are measured against recovered subscriptions from the first live window before review closes.",
  "j-northbeam-dispatch-1": "Northbeam's dispatch desk runs on spreadsheets, phone calls, and TMS exports, and by midday no two sources tell the same story. Before any dashboard can exist, the data has to mean one thing. Phase one consolidates dispatch data into a single model — loads, drivers, and depot assignments from every source, reconciled on a schedule the desk can trust.\n\nScope is the ingest from spreadsheets and TMS exports, built as replayable batches so one bad file never poisons the model, plus the data-model document and a handover note for the phases that follow. Irene Walsh is the day-to-day contact; the model goes to Curtis Hale for review before phase two is scoped.",
  "j-cassia-booking-reminders": "Each of Cassia's three clinics ran its own reminder routine — a front desk calling down the day sheet between patients — and the no-show numbers tracked whichever desk fell behind that week. This engagement automates reminders and rescheduling across all three clinics as one pipeline: confirmations on schedule, reschedule requests landing back in the calendar, no per-clinic variants to maintain.\n\nScope is the reminder schedule, the reschedule flow, and quiet-hours rules so no patient hears from a clinic at dinner. Alana Reyes is the contact for all three locations; rollout goes one clinic at a time, each watched for a week of no-show numbers before the next goes live.",
  "j-tidegate-quote-letters": "Tidegate's quote letters had drifted into a folder of personal copies — every adjuster keeping a version with their own fixes, the formatting breaking a little more with each reuse. This engagement rebuilds the letter set as locked masters in the claims team's document system: one current version of each letter, with fill-in fields where edits belong and protected layout everywhere else.\n\nScope is the full letter set rebuilt as masters, plus a short note routing future changes through one owner instead of local edits. Sam Okada's team uses the letters daily and reviews the masters in working drafts; Ruth Calder signs off on the final set.",
};

export function jobDescription(job: MockJob): string {
  return job.description ?? EXTRA_JOB_DESCRIPTIONS[job.id] ?? job.brief;
}

export const BIDS: MockBid[] = [
  { id: "b-nd2-priya", jobId: "j-northbeam-dispatch-2", memberId: "u-priya", proposedSplit: 6800, pitchText: "Phase one's data model holds; most of this is charting and the dispatcher views. I scoped both.", status: "PENDING", createdAt: "2026-06-10T09:20:00" },
  { id: "b-nd2-owen", jobId: "j-northbeam-dispatch-2", memberId: "u-owen", proposedSplit: 5400, pitchText: "I built the ingest. I can carry the realtime feed end to end and keep the event schema stable.", status: "PENDING", createdAt: "2026-06-10T11:05:00" },
  { id: "b-nd2-marcus", jobId: "j-northbeam-dispatch-2", memberId: "u-marcus", proposedSplit: 4900, pitchText: "The dashboard surfaces are the bulk of the estimate. I'll take the load board and driver views.", status: "PENDING", createdAt: "2026-06-11T08:42:00" },
  { id: "b-nd2-fatima", jobId: "j-northbeam-dispatch-2", memberId: "u-fatima", proposedSplit: 3800, pitchText: "Depot reporting needs a proper aggregate layer, not another cron. I'd build that first.", status: "PENDING", createdAt: "2026-06-11T14:18:00" },
  { id: "b-cir-aiko", jobId: "j-cassia-intake-redesign", memberId: "u-aiko", proposedSplit: 4400, pitchText: "I led the reminder pipeline rollout with this team; I know their front-desk constraints firsthand.", status: "PENDING", createdAt: "2026-06-09T10:11:00" },
  { id: "b-cir-theo", jobId: "j-cassia-intake-redesign", memberId: "u-theo", proposedSplit: 3600, pitchText: "Forms are my lane. I'd start from the paper packet and cut it to one flow per visit type.", status: "PENDING", createdAt: "2026-06-09T15:47:00" },
  { id: "b-cir-ines", jobId: "j-cassia-intake-redesign", memberId: "u-ines", proposedSplit: 2200, pitchText: "Two clinic visits and front-desk interviews before any screens — I'll own the research half.", status: "PENDING", createdAt: "2026-06-10T09:55:00" },
  { id: "b-rsc-hana", jobId: "j-ratio-spring-campaign", memberId: "u-hana", proposedSplit: 3200, pitchText: "I ran the subscription launch; the wholesale angle reuses most of that audience work.", status: "PENDING", createdAt: "2026-06-08T13:02:00" },
  { id: "b-rsc-camille", jobId: "j-ratio-spring-campaign", memberId: "u-camille", proposedSplit: 2400, pitchText: "Their voice is dry and confident and I can keep it that way across the whole kit.", status: "PENDING", createdAt: "2026-06-09T09:31:00" },
  { id: "b-fr-viktor", jobId: "j-fernwell-reporting", memberId: "u-viktor", proposedSplit: 2800, pitchText: "Their ledger exports are clean CSV; this is a templating problem with a scheduler on top.", status: "PENDING", createdAt: "2026-06-10T16:24:00" },
  { id: "b-fr-fatima", jobId: "j-fernwell-reporting", memberId: "u-fatima", proposedSplit: 2400, pitchText: "I'd normalize the export first so the packet generator never sees a malformed quarter.", status: "PENDING", createdAt: "2026-06-11T10:09:00" },
  { id: "b-rwl-caleb", jobId: "j-ratio-wholesale-list", memberId: "u-caleb", proposedSplit: 1400, pitchText: "Price tables are layout discipline. I'll set it up so Felix edits one sheet and exports.", status: "ACCEPTED", createdAt: "2026-06-02T11:30:00" },
  { id: "b-rwl-june", jobId: "j-ratio-wholesale-list", memberId: "u-june", proposedSplit: 1500, pitchText: "I did their bag labels; happy to keep the system consistent.", status: "REJECTED", createdAt: "2026-06-02T14:12:00" },
  { id: "b-ndo-martina", jobId: "j-northbeam-driver-onboarding", memberId: "u-martina", proposedSplit: 1900, pitchText: "I wrote our own onboarding packet; same shape, different forms.", status: "ACCEPTED", createdAt: "2026-06-04T09:18:00" },
  { id: "b-ndo-tomas", jobId: "j-northbeam-driver-onboarding", memberId: "u-tomas", proposedSplit: 2000, pitchText: "I know their depot leads from phase one and can collect the source docs fast.", status: "REJECTED", createdAt: "2026-06-04T10:40:00" },
  { id: "b-tci-priya", jobId: "j-tidegate-claims-intake", memberId: "u-priya", proposedSplit: 7400, pitchText: "Parser plus sync is the same pattern as Cassia's pipeline, with a harder exception story. I want it.", status: "ACCEPTED", createdAt: "2026-05-25T09:05:00" },
  { id: "b-tci-marcus", jobId: "j-tidegate-claims-intake", memberId: "u-marcus", proposedSplit: 5200, pitchText: "The exception queue needs a real interface, not a spreadsheet. I'll build it alongside Priya's parser.", status: "ACCEPTED", createdAt: "2026-05-25T11:38:00" },
  { id: "b-tci-owen", jobId: "j-tidegate-claims-intake", memberId: "u-owen", proposedSplit: 6000, pitchText: "I can take the sync layer; their system of record has a workable API.", status: "REJECTED", createdAt: "2026-05-25T13:21:00" },
  { id: "b-vs-june", jobId: "j-vargas-site", memberId: "u-june", proposedSplit: 1170, pitchText: "One page, one form, done properly. I'll bring two directions to the first call.", status: "ACCEPTED", createdAt: "2026-05-28T10:02:00" },
  { id: "b-crf-viktor", jobId: "j-cassia-referral-fax", memberId: "u-viktor", proposedSplit: 2300, pitchText: "Fax classification is mostly normalization; the pilot scope is honest about that.", status: "ACCEPTED", createdAt: "2026-05-19T08:51:00" },
  { id: "b-crf-fatima", jobId: "j-cassia-referral-fax", memberId: "u-fatima", proposedSplit: 1800, pitchText: "I'll own the routing rules and the audit trail the clinics asked for.", status: "ACCEPTED", createdAt: "2026-05-19T09:33:00" },
  { id: "b-fbr-june", jobId: "j-fernwell-brand-refresh", memberId: "u-june", proposedSplit: 3000, pitchText: "The refresh holds together if one hand draws the collateral. Mine's up.", status: "ACCEPTED", createdAt: "2026-05-12T10:44:00" },
  { id: "b-fbr-theo", jobId: "j-fernwell-brand-refresh", memberId: "u-theo", proposedSplit: 2400, pitchText: "I'll take the templates and make them survivable in Word, which is where they'll live.", status: "ACCEPTED", createdAt: "2026-05-12T13:09:00" },
  { id: "b-rse-rebecca", jobId: "j-ratio-subscription-emails", memberId: "u-rebecca", proposedSplit: 2000, pitchText: "Dunning is where subscription revenue leaks; I'll start there, not at welcome.", status: "ACCEPTED", createdAt: "2026-05-15T09:27:00" },
  { id: "b-rse-camille", jobId: "j-ratio-subscription-emails", memberId: "u-camille", proposedSplit: 1400, pitchText: "Six emails, one voice. I'll draft against their bag copy so it reads like them.", status: "ACCEPTED", createdAt: "2026-05-15T11:53:00" },
  { id: "b-nd1-priya", jobId: "j-northbeam-dispatch-1", memberId: "u-priya", proposedSplit: 5200, pitchText: "I'll own the data model; everything later phases need hangs off getting this right.", status: "ACCEPTED", createdAt: "2026-03-02T09:14:00" },
  { id: "b-nd1-owen", jobId: "j-northbeam-dispatch-1", memberId: "u-owen", proposedSplit: 3800, pitchText: "TMS exports are ugly but consistent. I'll build the ingest with replayable batches.", status: "ACCEPTED", createdAt: "2026-03-02T10:47:00" },
  { id: "b-cbr-daniel", jobId: "j-cassia-booking-reminders", memberId: "u-daniel", proposedSplit: 3600, pitchText: "Three clinics, one pipeline, no per-clinic forks. I'll keep it that way.", status: "ACCEPTED", createdAt: "2026-01-12T11:21:00" },
  { id: "b-cbr-viktor", jobId: "j-cassia-booking-reminders", memberId: "u-viktor", proposedSplit: 2600, pitchText: "I'll take the reschedule flow and the quiet-hours rules.", status: "ACCEPTED", createdAt: "2026-01-12T14:36:00" },
  { id: "b-tql-aiko", jobId: "j-tidegate-quote-letters", memberId: "u-aiko", proposedSplit: 2700, pitchText: "Letter systems are about constraints. I'll deliver templates their team can't break.", status: "ACCEPTED", createdAt: "2026-05-26T10:15:00" },
];

// ── Pipeline ────────────────────────────────────────────────

export const DEALS: MockDeal[] = [
  {
    id: "d-ratio-wholesale-portal",
    title: "Ratio wholesale ordering portal",
    accountId: "a-ratio",
    ownerId: "u-lena",
    stage: "INBOUND",
    source: "REFERRAL",
    createdAt: "2026-06-10",
    lastActivityAt: "2026-06-11",
    activities: [
      { kind: "NOTE", authorId: "u-lena", body: "Felix asked during the email-flow review whether we could replace wholesale order emails with a portal. Worth a real scope.", at: "2026-06-10T15:20:00" },
      { kind: "CALL", authorId: "u-lena", body: "Walked Felix through what a portal scope needs from their side. Price-list cleanup ships first either way.", at: "2026-06-11T10:30:00" },
    ],
  },
  {
    id: "d-fernwell-payroll",
    title: "Fernwell payroll integrations",
    accountId: "a-fernwell",
    ownerId: "u-hana",
    stage: "INBOUND",
    source: "OUTBOUND",
    createdAt: "2026-06-11",
    lastActivityAt: "2026-06-12",
    activities: [
      { kind: "EMAIL", authorId: "u-hana", body: "Margaret replied to the quarterly check-in: payroll data entry is their next bottleneck. Asked for a call next week.", at: "2026-06-11T09:48:00" },
      { kind: "NOTE", authorId: "u-hana", body: "Pulled the vendor list from Margaret's reply: two payroll systems, one CSV bridge between them. Scope call set for Tuesday.", at: "2026-06-12T09:05:00" },
    ],
  },
  {
    id: "d-westerly-disc",
    title: "Westerly Charter Co. — discovery",
    accountId: "a-westerly",
    ownerId: "u-marcus",
    stage: "DISCOVERY",
    source: "WEBSITE",
    createdAt: "2026-06-09",
    lastActivityAt: "2026-06-10",
    activities: [
      { kind: "NOTE", authorId: "u-marcus", body: "Claimed from the bounty board. Summer season starts in three weeks — they want scheduling pain gone before it.", at: "2026-06-09T08:41:00" },
      { kind: "STAGE_CHANGE", authorId: "u-marcus", body: "Stage set to DISCOVERY on claim.", at: "2026-06-09T08:41:00" },
      { kind: "EMAIL", authorId: "u-marcus", body: "Sent Tom a short agenda for Tuesday: season calendar, crew roster shape, and where the maintenance log lives today.", at: "2026-06-10T11:20:00" },
    ],
  },
  {
    id: "d-bellhaven-disc",
    title: "Bellhaven Property Group — discovery",
    accountId: "a-bellhaven",
    ownerId: "u-sara",
    stage: "DISCOVERY",
    source: "WEBSITE",
    createdAt: "2026-06-05",
    lastActivityAt: "2026-06-12",
    activities: [
      { kind: "STAGE_CHANGE", authorId: "u-sara", body: "Stage set to DISCOVERY on claim.", at: "2026-06-05T12:03:00" },
      { kind: "CALL", authorId: "u-sara", body: "Call w/ Yusuf. Ninety units, two office staff. Rent reminders and maintenance triage are most of the inbox. Send the Northbeam case study.", at: "2026-06-11T16:10:00" },
      { kind: "EMAIL", authorId: "u-sara", body: "Northbeam case study sent. Yusuf wants his office manager on the next call.", at: "2026-06-12T08:50:00" },
    ],
  },
  {
    id: "d-northbeam-customs",
    title: "Northbeam customs paperwork automation",
    accountId: "a-northbeam",
    ownerId: "u-lena",
    stage: "PROPOSAL",
    source: "REFERRAL",
    value: 16000,
    expectedCloseAt: "2026-07-15",
    createdAt: "2026-05-14",
    lastActivityAt: "2026-06-08",
    activities: [
      { kind: "CALL", authorId: "u-lena", body: "Curtis wants the cross-border paperwork chain looked at before peak season. Two brokers involved, both slow.", at: "2026-05-14T10:30:00" },
      { kind: "MEETING", authorId: "u-lena", body: "Walked the customs desk with Irene. Eleven documents per crossing; eight are derivable from the load record.", at: "2026-05-27T14:00:00" },
      { kind: "STAGE_CHANGE", authorId: "u-lena", body: "Stage: DISCOVERY to PROPOSAL.", at: "2026-06-08T09:12:00" },
      { kind: "EMAIL", authorId: "u-lena", body: "Proposal sent: document generation plus broker handoff queue, 16,000.00 fixed. Curtis reviewing with their compliance lead.", at: "2026-06-08T09:15:00" },
    ],
  },
  {
    id: "d-fernwell-onboarding",
    title: "Fernwell client onboarding portal",
    accountId: "a-fernwell",
    ownerId: "u-daniel",
    stage: "PROPOSAL",
    source: "EVENT",
    value: 11200,
    expectedCloseAt: "2026-07-01",
    createdAt: "2026-05-02",
    lastActivityAt: "2026-06-09",
    activities: [
      { kind: "MEETING", authorId: "u-daniel", body: "Met Margaret at the regional accounting meetup. New-client document collection takes them three weeks of chasing.", at: "2026-05-02T18:30:00" },
      { kind: "STAGE_CHANGE", authorId: "u-daniel", body: "Stage: DISCOVERY to PROPOSAL.", at: "2026-06-02T11:05:00" },
      { kind: "EMAIL", authorId: "u-daniel", body: "Proposal out: secure document portal with checklist tracking, 11,200.00. Paul is the technical reviewer.", at: "2026-06-09T08:55:00" },
    ],
  },
  {
    id: "d-cassia-recall",
    title: "Cassia patient recall campaigns",
    accountId: "a-cassia",
    ownerId: "u-sara",
    stage: "VERBAL",
    source: "REFERRAL",
    value: 8400,
    expectedCloseAt: "2026-06-19",
    createdAt: "2026-04-28",
    lastActivityAt: "2026-06-10",
    activities: [
      { kind: "CALL", authorId: "u-sara", body: "Alana wants recall outreach for lapsed patients now that reminders run themselves. Scope builds on the reminder pipeline.", at: "2026-04-28T11:40:00" },
      { kind: "STAGE_CHANGE", authorId: "u-sara", body: "Stage: PROPOSAL to VERBAL.", at: "2026-06-10T15:32:00" },
      { kind: "NOTE", authorId: "u-sara", body: "Verbal yes from Alana on 8,400.00. Paperwork goes to their practice owners Friday.", at: "2026-06-10T15:35:00" },
    ],
  },
  {
    id: "d-tidegate-won",
    title: "Tidegate claims-intake automation",
    accountId: "a-tidegate",
    ownerId: "u-lena",
    stage: "WON",
    source: "REFERRAL",
    value: 21500,
    wonAt: "2026-05-22",
    createdAt: "2026-04-07",
    lastActivityAt: "2026-05-22",
    activities: [
      { kind: "CALL", authorId: "u-lena", body: "First call w/ Ruth. Claims team keys the same first-notice data into three systems; she wants it gone by Q3.", at: "2026-04-07T10:15:00" },
      { kind: "MEETING", authorId: "u-lena", body: "Walkthrough at the Renton office. Counted eleven manual steps from carrier email to claim record.", at: "2026-04-21T13:30:00" },
      { kind: "STAGE_CHANGE", authorId: "u-lena", body: "Stage: DISCOVERY to PROPOSAL.", at: "2026-05-06T09:02:00" },
      { kind: "EMAIL", authorId: "u-lena", body: "Proposal sent: intake parser, claim-record sync, exception queue, four-week shadow period. 21,500.00 fixed.", at: "2026-05-06T09:06:00" },
      { kind: "CALL", authorId: "u-lena", body: "Ruth has finance sign-off. Verbal yes; contract with their counsel.", at: "2026-05-19T16:20:00" },
      { kind: "STAGE_CHANGE", authorId: "u-lena", body: "Stage: PROPOSAL to VERBAL.", at: "2026-05-19T16:25:00" },
      { kind: "STAGE_CHANGE", authorId: "u-lena", body: "Stage: VERBAL to WON. Signed engagement returned.", at: "2026-05-22T10:08:00" },
    ],
  },
  {
    id: "d-fernwell-archive",
    title: "Fernwell archive digitization",
    accountId: "a-fernwell",
    ownerId: "u-daniel",
    stage: "LOST",
    source: "OUTBOUND",
    value: 5200,
    lostAt: "2026-05-08",
    lostReason: "Chose to hire in-house; revisit Q4.",
    createdAt: "2026-03-30",
    lastActivityAt: "2026-05-08",
    activities: [
      { kind: "CALL", authorId: "u-daniel", body: "Margaret asked about scanning and indexing fifteen years of client files. Scoped a phased approach.", at: "2026-03-30T14:05:00" },
      { kind: "STAGE_CHANGE", authorId: "u-daniel", body: "Stage: DISCOVERY to PROPOSAL.", at: "2026-04-17T10:00:00" },
      { kind: "EMAIL", authorId: "u-daniel", body: "Proposal sent: phased scanning, index-first. Margaret weighing it against a part-time hire.", at: "2026-04-20T09:30:00" },
      { kind: "STAGE_CHANGE", authorId: "u-daniel", body: "Stage: PROPOSAL to LOST. Chose to hire in-house; revisit Q4.", at: "2026-05-08T11:42:00" },
    ],
  },
];

export const BOOKING_CARDS: MockBookingCard[] = [
  {
    id: "bk-halcyon",
    externalRef: "bk_7d20aa",
    name: "Rosa Calloway",
    email: "rosa@halcyondental.com",
    company: "Halcyon Dental Partners",
    companySize: "11-50",
    automationGoal: "Front desk spends two hours a day on appointment reminders and reschedules.",
    slotStart: "2026-06-18T15:00:00",
    slotEnd: "2026-06-18T15:30:00",
    status: "UNCLAIMED",
    submittedAt: "2026-06-12T09:14:00",
  },
  {
    id: "bk-westerly",
    externalRef: "bk_3e88fc",
    name: "Tom Beckett",
    email: "tom@westerlycharter.com",
    company: "Westerly Charter Co.",
    companySize: "11-50",
    automationGoal: "Booking confirmations, crew rosters, and maintenance logs are all manual; summer season starts in three weeks.",
    slotStart: "2026-06-16T17:00:00",
    slotEnd: "2026-06-16T17:30:00",
    status: "CLAIMED",
    claimedById: "u-marcus",
    claimedAt: "2026-06-09T08:41:00",
    dealId: "d-westerly-disc",
    submittedAt: "2026-06-09T08:02:00",
  },
  {
    id: "bk-bellhaven",
    externalRef: "bk_1c52ab",
    name: "Yusuf Rahman",
    email: "yusuf@bellhavenproperty.com",
    company: "Bellhaven Property Group",
    companySize: "2-10",
    automationGoal: "Ninety units, two office staff. Rent reminders and maintenance requests are most of our inbox.",
    slotStart: "2026-06-11T16:00:00",
    slotEnd: "2026-06-11T16:30:00",
    status: "CLAIMED",
    claimedById: "u-sara",
    claimedAt: "2026-06-05T12:03:00",
    dealId: "d-bellhaven-disc",
    submittedAt: "2026-06-05T11:27:00",
  },
];

// ── Channels & messages ─────────────────────────────────────

export const CHANNELS: MockChannel[] = [
  { id: "ch-engineering", kind: "DEPARTMENT", name: "engineering", departmentId: "engineering" },
  { id: "ch-design", kind: "DEPARTMENT", name: "design", departmentId: "design" },
  { id: "ch-marketing", kind: "DEPARTMENT", name: "marketing", departmentId: "marketing" },
  { id: "ch-operations", kind: "DEPARTMENT", name: "operations", departmentId: "operations" },
  { id: "ch-new-business", kind: "FIRM", name: "new-business" },
  { id: "ch-job-tidegate", kind: "JOB", name: "job-tidegate-claims-intake", jobId: "j-tidegate-claims-intake" },
  { id: "ch-job-fernwell-brand", kind: "JOB", name: "job-fernwell-brand-refresh", jobId: "j-fernwell-brand-refresh" },
  { id: "ch-job-vargas", kind: "JOB", name: "job-vargas-site", jobId: "j-vargas-site" },
  { id: "ch-job-ratio-wholesale", kind: "JOB", name: "job-ratio-wholesale-list", jobId: "j-ratio-wholesale-list" },
  { id: "ch-job-northbeam-driver", kind: "JOB", name: "job-northbeam-driver-onboarding", jobId: "j-northbeam-driver-onboarding" },
  { id: "ch-job-cassia-fax", kind: "JOB", name: "job-cassia-referral-fax", jobId: "j-cassia-referral-fax" },
  { id: "ch-job-ratio-emails", kind: "JOB", name: "job-ratio-subscription-emails", jobId: "j-ratio-subscription-emails" },
  { id: "ch-job-northbeam-d1", kind: "JOB", name: "job-northbeam-dispatch-1", jobId: "j-northbeam-dispatch-1" },
  { id: "ch-job-cassia-reminders", kind: "JOB", name: "job-cassia-booking-reminders", jobId: "j-cassia-booking-reminders" },
  { id: "ch-job-tidegate-letters", kind: "JOB", name: "job-tidegate-quote-letters", jobId: "j-tidegate-quote-letters" },
  { id: "ch-acct-northbeam", kind: "ACCOUNT", name: "Northbeam Logistics", accountId: "a-northbeam" },
  { id: "ch-acct-cassia", kind: "ACCOUNT", name: "Cassia Health", accountId: "a-cassia" },
  { id: "ch-acct-fernwell", kind: "ACCOUNT", name: "Fernwell & Co.", accountId: "a-fernwell" },
  { id: "ch-acct-ratio", kind: "ACCOUNT", name: "Ratio Coffee Roasters", accountId: "a-ratio" },
  { id: "ch-acct-tidegate", kind: "ACCOUNT", name: "Tidegate Insurance", accountId: "a-tidegate" },
  { id: "ch-acct-vargas", kind: "ACCOUNT", name: "Mateo Vargas", accountId: "a-vargas" },
];

/** Raw message rows; ids assigned by buildMessages() in document order after
 *  the extra authored rows are merged and the thread sorts by timestamp. */
export interface RawMessage {
  channelId: string;
  senderId: string;
  at: string;
  body: string;
  bookingCardId?: string;
}

const CORE_MESSAGES: RawMessage[] = [
  // engineering
  { channelId: "ch-engineering", senderId: "u-daniel", at: "2026-06-11T09:05:00", body: "Review queue is empty for the first time since April. If you have a posting you've been sitting on, today's the day to bid." },
  { channelId: "ch-engineering", senderId: "u-owen", at: "2026-06-11T09:22:00", body: "Northbeam phase two is up on the board. Pool looks right this time." },
  { channelId: "ch-engineering", senderId: "u-priya", at: "2026-06-11T09:31:00", body: "I posted a bid. If we split it like phase one we can keep the same review cadence with Irene." },
  { channelId: "ch-engineering", senderId: "u-fatima", at: "2026-06-12T08:47:00", body: "Reminder: the Cassia fax pilot review is Tuesday. Bring real misclassification numbers, not vibes." },

  // design
  { channelId: "ch-design", senderId: "u-aiko", at: "2026-06-10T10:12:00", body: "Fernwell collateral went to review yesterday. Margaret's first pass comes back Friday." },
  { channelId: "ch-design", senderId: "u-june", at: "2026-06-10T10:25:00", body: "Vargas wireframes are with Mateo. He picked direction B inside an hour — shortest approval of my year." },
  { channelId: "ch-design", senderId: "u-theo", at: "2026-06-11T14:03:00", body: "Cassia intake posting is worth a look. The paper packet is eleven pages; the flow should be one." },
  { channelId: "ch-design", senderId: "u-ines", at: "2026-06-12T09:02:00", body: "Recommending the brand systems primer's third lesson to anyone scoping client collateral — that checklist keeps paying for itself." },

  // marketing
  { channelId: "ch-marketing", senderId: "u-hana", at: "2026-06-09T11:18:00", body: "Ratio email flows go up for review today. Dunning numbers from the test window: 38 recovered subscriptions." },
  { channelId: "ch-marketing", senderId: "u-camille", at: "2026-06-09T11:30:00", body: "The win-back subject lines that worked are the plain ones. Filing that away for the spring kit." },
  { channelId: "ch-marketing", senderId: "u-dmitri", at: "2026-06-11T15:44:00", body: "Site audit for the gate refresh is in the vault under Gate content audit, June. Three pages carry most of the traffic." },

  // operations
  { channelId: "ch-operations", senderId: "u-lena", at: "2026-06-10T09:40:00", body: "Tidegate kickoff went clean. Shadow period starts after the parser handles both carrier formats." },
  { channelId: "ch-operations", senderId: "u-martina", at: "2026-06-10T09:52:00", body: "Northbeam driver packet: source docs are in. Drafting the checklist version this week." },
  { channelId: "ch-operations", senderId: "u-elias", at: "2026-06-12T08:30:00", body: "Quarterly review packets go out June 20. Account owners, get your engagement summaries to me by Wednesday." },

  // #new-business — the bounty board (PRD 7.12)
  { channelId: "ch-new-business", senderId: "u-gate", at: "2026-06-05T11:27:00", body: "Discovery call booked from the website.", bookingCardId: "bk-bellhaven" },
  { channelId: "ch-new-business", senderId: "u-sara", at: "2026-06-05T12:03:00", body: "Claimed — deal opened under Bellhaven Property Group." },
  { channelId: "ch-new-business", senderId: "u-gate", at: "2026-06-09T08:02:00", body: "Discovery call booked from the website.", bookingCardId: "bk-westerly" },
  { channelId: "ch-new-business", senderId: "u-marcus", at: "2026-06-09T08:41:00", body: "Claimed — the discovery call is mine. Deal opened under Westerly Charter Co." },
  { channelId: "ch-new-business", senderId: "u-gate", at: "2026-06-12T09:14:00", body: "Discovery call booked from the website.", bookingCardId: "bk-halcyon" },
  { channelId: "ch-new-business", senderId: "u-lena", at: "2026-06-12T09:26:00", body: "Tacoma dental group, front-desk pain. The Cassia reminder work is the obvious case study." },
  { channelId: "ch-new-business", senderId: "u-hana", at: "2026-06-12T09:33:00", body: "I can take the Thursday slot if nobody with clinic experience claims it by lunch." },

  // Tidegate job channel — the flagship thread
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-02T09:10:00", body: "Kickoff notes are in the vault as Tidegate intake, kickoff summary. Short version: two carrier formats cover 84 percent of volume; we parse those and queue the rest." },
  { channelId: "ch-job-tidegate", senderId: "u-marcus", at: "2026-06-02T09:24:00", body: "Starting the exception queue this week. Plan is a single review list with claim preview and a one-click accept into the record." },
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-03T11:02:00", body: "First carrier format parses clean on 312 of 320 sample notices. The eight failures are scanned PDFs, which go to the queue by design." },
  { channelId: "ch-job-tidegate", senderId: "u-marcus", at: "2026-06-04T15:48:00", body: "Question on sync: do we write to their staging table or straight to the claim record? Their API docs say staging, Sam said records." },
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-04T16:05:00", body: "Staging. If we write records directly during the shadow period we can't diff against the hand-keyed ones, which is the whole point of the shadow period." },
  { channelId: "ch-job-tidegate", senderId: "u-marcus", at: "2026-06-04T16:11:00", body: "Disagree — staging doubles the mapping work and Sam's team reads records, not staging rows." },
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-04T16:30:00", body: "Called Sam to settle it. Staging during shadow, records after acceptance. He'll give the team a staging view so they can read along." },
  { channelId: "ch-job-tidegate", senderId: "u-marcus", at: "2026-06-04T16:33:00", body: "Settled then. I'll build the mapper against staging and keep the record writer behind a flag." },
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-09T10:20:00", body: "Second carrier format is harder — their field names changed in March and the sample set mixes both versions. Normalizing first." },
  { channelId: "ch-job-tidegate", senderId: "u-marcus", at: "2026-06-10T14:12:00", body: "Exception queue interface is up on staging. Screenshots in the vault under Exception queue, first cut." },
  { channelId: "ch-job-tidegate", senderId: "u-priya", at: "2026-06-11T09:15:00", body: "Lena passed along Ruth's ask: a written progress note for her steering meeting Monday, a paragraph at most. Drafting it for review." },

  // Fernwell brand job channel — recent turns (earlier turns are authored extras)
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-06-09T10:30:00", body: "Full collateral set is in the vault: letterhead, proposal template, report covers. Submitting for review." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-theo", at: "2026-06-09T10:41:00", body: "Word templates survived a round trip through Margaret's machine. Calling that the real acceptance test." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-mara", at: "2026-06-10T09:05:00", body: "Reviewing Thursday. If Margaret's pass is clean we close this one out before the quarterly packets." },

  // Vargas job channel — recent turns
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-08T09:45:00", body: "Direction B approved. Building the intake form fields from Mateo's current questionnaire, minus the four questions nobody answers." },
  { channelId: "ch-design", senderId: "u-aiko", at: "2026-06-08T10:02:00", body: "June — keep the Vargas form under ten fields. His clients are retirees; every extra field costs him a booking." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-11T16:20:00", body: "Staging link is in the vault. Copy review is the last open item before client review." },

  // Lighter job channels
  { channelId: "ch-job-ratio-wholesale", senderId: "u-caleb", at: "2026-06-03T10:05:00", body: "Source price sheet is in. The current list has three conflicting versions in circulation, which explains the wrong-invoice complaints." },
  { channelId: "ch-design", senderId: "u-aiko", at: "2026-06-03T10:18:00", body: "Caleb — make the exported Ratio PDF the only artifact that leaves the building. One sheet, one export, no copies." },
  { channelId: "ch-job-ratio-wholesale", senderId: "u-caleb", at: "2026-06-10T15:40:00", body: "Layout draft is done; testing the edit-and-export flow with Felix's real data on Friday." },
  { channelId: "ch-job-northbeam-driver", senderId: "u-martina", at: "2026-06-05T09:30:00", body: "Collected all nine current forms from the depot leads. Four ask for the same address block; the packet collapses them to one." },
  { channelId: "ch-operations", senderId: "u-tomas", at: "2026-06-05T09:44:00", body: "Martina — check the CDL verification step on the driver packet. Spokane and Boise run it differently and someone should pick a winner." },
  { channelId: "ch-job-northbeam-driver", senderId: "u-martina", at: "2026-06-09T11:12:00", body: "CDL verification: Curtis picked Spokane's version. Drafting the checklist around it." },
  { channelId: "ch-job-cassia-fax", senderId: "u-viktor", at: "2026-06-05T10:15:00", body: "Classifier handles the two big referral sources at 91 percent on the sample set. The long tail goes to manual routing as scoped." },
  { channelId: "ch-job-cassia-fax", senderId: "u-fatima", at: "2026-06-05T10:31:00", body: "Audit trail is writing per-fax decisions now. Misclassification log lands in the vault before Tuesday's review." },
  { channelId: "ch-job-cassia-fax", senderId: "u-viktor", at: "2026-06-11T14:20:00", body: "Alana flagged that orthopedics faxes were landing in the wrong queue. Traced it to a cover-sheet variant; fix is in." },
  { channelId: "ch-job-ratio-emails", senderId: "u-rebecca", at: "2026-06-04T09:10:00", body: "Dunning flow has been live two weeks: 38 recovered of 61 failed payments. Win-back starts sending Thursday." },
  { channelId: "ch-job-ratio-emails", senderId: "u-camille", at: "2026-06-04T09:25:00", body: "Win-back copy is final in the vault, Ratio email flows, copy deck. Plain text beat the designed version everywhere, so plain text it is." },
  { channelId: "ch-job-ratio-emails", senderId: "u-rebecca", at: "2026-06-09T16:02:00", body: "First-window results sheet is filed. Submitting the set for review." },
  { channelId: "ch-job-northbeam-d1", senderId: "u-priya", at: "2026-04-15T10:00:00", body: "Data model is frozen and documented in the vault. Phase two can build on it without a migration." },
  { channelId: "ch-job-northbeam-d1", senderId: "u-owen", at: "2026-04-17T09:30:00", body: "Final ingest run replayed clean. Handover note is filed; calling this done." },
  { channelId: "ch-job-cassia-reminders", senderId: "u-daniel", at: "2026-02-18T11:00:00", body: "Flow diagram for all three clinics is in the vault. Quiet-hours rules differ per clinic and the pipeline respects each." },
  { channelId: "ch-job-cassia-reminders", senderId: "u-viktor", at: "2026-02-20T09:15:00", body: "Reschedule flow shipped. Front desk reports the morning call block is gone — that was the whole point." },
  { channelId: "ch-job-tidegate-letters", senderId: "u-aiko", at: "2026-06-02T10:30:00", body: "All eight letter templates rebuilt in their document system. Locked regions hold; their team can edit copy but not break layout." },
  { channelId: "ch-job-tidegate-letters", senderId: "u-aiko", at: "2026-06-05T09:45:00", body: "Sam's team round-tripped every template without damage. Masters are in the vault; closing out." },

  // Account threads
  { channelId: "ch-acct-tidegate", senderId: "u-lena", at: "2026-05-26T10:00:00", body: "Ruth — your portal is live; the intake engagement kicks off Monday. You'll see the engagement listed below with its current status, and anything we deliver lands in the shared files panel." },
  { channelId: "ch-acct-tidegate", senderId: "u-ruth", at: "2026-05-26T11:42:00", body: "Found it, thank you. I'll have Sam look at the staging view when it's ready." },
  { channelId: "ch-acct-tidegate", senderId: "u-lena", at: "2026-06-11T09:30:00", body: "Progress note ahead of your Monday steering meeting is coming by Friday." },
  { channelId: "ch-acct-northbeam", senderId: "u-curtis", at: "2026-06-09T14:10:00", body: "We'd like to schedule a review call." },
  { channelId: "ch-acct-northbeam", senderId: "u-lena", at: "2026-06-09T15:02:00", body: "Of course. Thursday 10:00 or Friday 14:00 work on our side — pick whichever suits Irene too and I'll send the invite." },
  { channelId: "ch-acct-northbeam", senderId: "u-curtis", at: "2026-06-09T15:30:00", body: "Thursday 10:00. Irene will join for the dispatch items." },
  { channelId: "ch-acct-vargas", senderId: "u-june", at: "2026-06-08T12:00:00", body: "Mateo — direction B it is. Next thing you'll see from me is the intake form with your questionnaire folded in." },
  { channelId: "ch-acct-vargas", senderId: "u-mateo", at: "2026-06-08T12:35:00", body: "Great. One ask: keep the risk-tolerance question, my compliance person insists." },
  { channelId: "ch-acct-vargas", senderId: "u-june", at: "2026-06-08T12:41:00", body: "It stays. Everything else nonessential goes." },
];

/** Spliced from the seed-content authoring pass (thread backfill, account
 *  exchanges, department filler). */
export const EXTRA_MESSAGES: RawMessage[] = [
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-05-13T09:20:00", body: "Kickoff. The refreshed Fernwell system is locked — wordmark, type, primary plus a second accent. This engagement is the collateral: letterhead, proposal template, report covers. I draw the set; Theo owns the Word templates." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-theo", at: "2026-05-13T09:48:00", body: "Confirmed. I build templates against your masters as they land. One ground rule: nothing in the design file Word can't reproduce. Fernwell lives in Word, not in our tools." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-05-18T14:05:00", body: "Letterhead and proposal cover are drafted. Open call on report covers: I want the second accent on the cover band. It's the only piece of the set where the refresh gets room." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-theo", at: "2026-05-18T14:22:00", body: "Against it. Margaret prints everything grayscale — the second accent lands as a mid-gray smear and every report on a Fernwell desk looks misprinted." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-05-18T14:37:00", body: "Report covers are the one thing their clients keep. If the refresh doesn't show up there, it doesn't show up anywhere." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-05-19T10:12:00", body: "Settled it the boring way: printed both covers grayscale on the office laser. Theo's right — the accent flattens to mud at that weight. Covers keep the primary and a heavier rule; the second accent stays on digital pieces." },
  { channelId: "ch-operations", senderId: "u-lena", at: "2026-05-26T09:30:00", body: "Tidegate portal is live; Ruth was in within the hour, no walkthrough needed. The intake engagement kicks off Monday — Priya and Marcus take it from there." },
  { channelId: "ch-engineering", senderId: "u-viktor", at: "2026-05-26T10:05:00", body: "Cassia fax pilot, first hundred test faxes: 91 routed clean. The misses are handwritten cover sheets, which go to manual review regardless. Logging every one for the June review." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-mara", at: "2026-05-26T11:40:00", body: "Scope check while it's cheap: letterhead, proposal template, report covers, due June 13. If the accent debate grew the set, say so now, not at review." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-june", at: "2026-05-26T12:02:00", body: "Scope holds — those three, nothing added. Masters go to the vault as Fernwell collateral set, final when we submit." },
  { channelId: "ch-design", senderId: "u-aiko", at: "2026-05-27T09:45:00", body: "Tidegate quote letters: their document system strips embedded fonts, so the masters are built on system stacks. Constraint first, styling second — they should survive any machine in that office." },
  { channelId: "ch-marketing", senderId: "u-rebecca", at: "2026-05-28T10:40:00", body: "Ratio dunning flow has been live a week. Early pattern: recoveries cluster on the second email, not the first. Full window numbers in two weeks." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-05-29T10:15:00", body: "Kickoff. One page, one intake form, due June 30, just me on this one. First call with Mateo is Monday; I'm bringing two directions, as bid." },
  { channelId: "ch-engineering", senderId: "u-daniel", at: "2026-06-01T08:45:00", body: "Tidegate kicks off today — Priya and Marcus are on it through mid-July. Review coverage shifts to me and Owen meanwhile; route anything urgent to either of us." },
  { channelId: "ch-operations", senderId: "u-andre", at: "2026-06-01T10:20:00", body: "Tidegate deposit invoice went out this morning, net 15. Their AP runs through a portal, not email — noted on the account so nobody chases the wrong inbox." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-01T13:40:00", body: "Call notes: Mateo wants credible over clever. His clients are retirees moving real savings; his line was that the site should make the money feel boring. Two directions by Wednesday." },
  { channelId: "ch-design", senderId: "u-caleb", at: "2026-06-02T11:48:00", body: "Picked up the Ratio price-list refresh. Building it so Felix edits one sheet and the layout takes care of itself — if he can break it, I've built it wrong." },
  { channelId: "ch-marketing", senderId: "u-camille", at: "2026-06-02T14:30:00", body: "Win-back drafts are done, written against Ratio's bag copy. Same rule as the dunning set: plain text, one ask per email." },
  { channelId: "ch-acct-ratio", senderId: "u-felix", at: "2026-06-03T08:50:00", body: "Three SKUs changed this week and rebuilding the price-list PDF ate my morning again. Sharing as a live example of the thing the refresh needs to fix." },
  { channelId: "ch-acct-cassia", senderId: "u-alana", at: "2026-06-03T09:35:00", body: "Two referral faxes landed in the wrong clinic queue this week. The front desk caught both before anything was missed. Is that expected at this point in the pilot?" },
  { channelId: "ch-marketing", senderId: "u-jonas", at: "2026-06-03T09:55:00", body: "May paid-search wrap: spend flat, discovery bookings up two. The Cassia case-study page keeps outconverting the services page, so June budget shifts toward case studies." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-03T11:05:00", body: "Both directions are in the design file. A is a quiet serif on an ivory ground — reads like a well-set letter. B is a confident grotesk with a firmer grid, closer to the bigger advisory shops. Honest about it: I lean B." },
  { channelId: "ch-acct-cassia", senderId: "u-fatima", at: "2026-06-03T11:10:00", body: "Expected at pilot stage, and exactly what we want flagged. Both came from the same sender, whose cover sheet the classifier hasn't seen before — a routing rule for it goes in this week. Every flag feeds the misclassification review on the sixteenth." },
  { channelId: "ch-design", senderId: "u-aiko", at: "2026-06-03T11:34:00", body: "June — looked at both. B, but keep A's pacing — the grotesk earns trust at small sizes, the generous spacing keeps it from feeling like a bank. Don't make Mateo choose between warm and credible." },
  { channelId: "ch-engineering", senderId: "u-grace", at: "2026-06-03T14:10:00", body: "Trying snapshot fixtures for the fax-pilot parser tests instead of assertion lists. Early verdict: regressions show up as readable diffs. If it holds through the week I'll write it up properly." },
  { channelId: "ch-job-fernwell-brand", senderId: "u-theo", at: "2026-06-03T15:20:00", body: "Round-trip test is booked on Margaret's machine Thursday: open, save, print, reopen, restyle. If the styles survive, the pack goes up as Fernwell Word templates, round-trip tested — it doesn't earn the name otherwise." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-04T09:50:00", body: "Intake next. His current questionnaire is nineteen questions and he admits four of them never get answered. Trimming to what he actually uses in a first consultation." },
  { channelId: "ch-acct-ratio", senderId: "u-caleb", at: "2026-06-04T10:15:00", body: "That's the exact case it's built around. You edit one sheet — SKUs and prices only — and export; the layout never gets touched. First version comes to you the week of June 22." },
  { channelId: "ch-acct-ratio", senderId: "u-felix", at: "2026-06-04T10:40:00", body: "Week of the 22nd works. I'll hold the next price change until the new sheet is in." },
  { channelId: "ch-operations", senderId: "u-tomas", at: "2026-06-04T13:25:00", body: "Sent Martina the depot contacts from Northbeam phase one for the driver packet. Source docs should be complete by Friday — better to start from a full folder." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-04T15:10:00", body: "Constraint from Mateo's side: a compliance reviewer signs off on anything client-facing, and the risk-tolerance question is non-negotiable whatever else gets cut. Building the review pass into the timeline." },
  { channelId: "ch-design", senderId: "u-theo", at: "2026-06-04T16:15:00", body: "Field note from the Fernwell templates: Word style inheritance breaks the moment someone pastes from Outlook. The templates now lock body styles against it. Writing it down for the next template job." },
  { channelId: "ch-job-vargas", senderId: "u-june", at: "2026-06-05T16:05:00", body: "Both directions go to Mateo Monday morning with a recommendation on B, pacing per Aiko. If he decides fast we hold June 30 with room." },
  { channelId: "ch-acct-fernwell", senderId: "u-margaret", at: "2026-06-09T13:05:00", body: "When do the refreshed templates reach us? Quarterly letters start the week of the 22nd and I want the new letterhead on them." },
  { channelId: "ch-acct-fernwell", senderId: "u-june", at: "2026-06-10T09:30:00", body: "Internal review wraps Thursday, then the set comes to you for a pass. If your notes are light you'll have final files by the 13th — ahead of the quarterly letters either way." },
  { channelId: "ch-acct-fernwell", senderId: "u-margaret", at: "2026-06-10T10:05:00", body: "That works. Send the set to Paul as well when it lands; he keeps our template folder." },
  { channelId: "ch-acct-cassia", senderId: "u-alana", at: "2026-06-10T14:20:00", body: "One more from the same sender yesterday — forwarded it to the queue as before. Otherwise routing has been right all week, which the front desk has noticed." },
];

export interface SeedMessage extends MockMessage {
  bookingCardId?: string;
}

/** The pending Shadow draft for the Tidegate job, generated by the
 *  deterministic agent from the same facts the database will hold
 *  (PRD section 10: "generated by the deterministic agent at seed time"). */
export function tidegateShadowFacts(): ShadowFacts {
  const job = JOBS.find((j) => j.id === "j-tidegate-claims-intake");
  if (!job) throw new Error("Seed data is missing the Tidegate job.");
  const accepted = BIDS.filter((b) => b.jobId === job.id && b.status === "ACCEPTED");
  const allocated = accepted.reduce((sum, b) => sum + b.proposedSplit, 0);
  const due = new Date(`${job.dueAt}T00:00:00`);
  const now = new Date(SEED_NOW);
  const daysToDue = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  const assets = allVaultAssets()
    .filter((a) => a.jobId === job.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => a.title);
  const userName = (id: string) => USERS.find((u) => u.id === id)?.name ?? id;
  const recent = CORE_MESSAGES.filter((m) => m.channelId === "ch-job-tidegate")
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-10)
    .map((m) => ({ sender: userName(m.senderId), body: m.body }));
  return {
    jobId: job.id,
    jobTitle: job.title,
    status: job.status,
    poolAllocatedPct: (allocated / job.workerPool) * 100,
    daysToDue,
    dueLabel: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    latestAssets: assets,
    recentMessages: recent,
  };
}

/** All messages with stable ids, the Shadow draft included, sorted per
 *  channel by timestamp. */
export function buildMessages(): SeedMessage[] {
  const raw: (RawMessage & { isShadowDraft?: boolean })[] = [
    ...CORE_MESSAGES,
    ...EXTRA_MESSAGES,
    {
      channelId: "ch-job-tidegate",
      senderId: "u-shadow",
      at: "2026-06-12T08:00:00",
      body: composeProgressUpdate(tidegateShadowFacts()),
      isShadowDraft: true,
    },
  ];
  return raw
    .slice()
    .sort((a, b) => a.channelId.localeCompare(b.channelId) || a.at.localeCompare(b.at))
    .map((m, i) => ({ id: `m-${String(i + 1).padStart(3, "0")}`, ...m }));
}

// ── Forum ───────────────────────────────────────────────────

export const CORE_FORUM_POSTS: MockForumPost[] = [
  {
    id: "f-handover-question",
    authorId: "u-martina",
    departmentId: "operations",
    title: "What belongs in a handover note?",
    body: "Closing out the driver packet soon and I want the handover to be the kind we wish every job had. What do people actually reread later — decisions, contacts, file locations? The Running a Handover course covers structure, but I want the lived answer.",
    at: "2026-06-10T11:00:00",
    replies: [
      { id: "fr-1", authorId: "u-priya", body: "Decisions with dates. Six months later nobody needs the file list — they need why we chose staging-first.", at: "2026-06-10T12:14:00" },
      { id: "fr-2", authorId: "u-lena", body: "The client's reading habits. Who actually opens what you send. That never makes it into notes and always matters.", at: "2026-06-10T13:02:00" },
    ],
  },
  {
    id: "f-ratio-win",
    authorId: "u-rebecca",
    departmentId: "marketing",
    title: "Dunning flow recovered 38 subscriptions in its first window",
    body: "The Ratio dunning emails have been live for three weeks: 38 recovered subscriptions against 61 failed payments. The plain-text version outperformed the designed one in every segment. Camille called it during drafting; noting it here so we stop re-litigating plain versus designed each kit.",
    at: "2026-06-09T16:20:00",
    replies: [
      { id: "fr-3", authorId: "u-camille", body: "For transactional email, design is a tax. Happy to be the broken record.", at: "2026-06-09T16:48:00" },
    ],
  },
  {
    id: "f-fixture-tool",
    authorId: "u-grace",
    departmentId: "engineering",
    title: "Recommendation: snapshot fixtures for parser tests",
    body: "For the Cassia fax pilot I started checking parser output against committed snapshot fixtures instead of hand-written assertions. Catching regressions has been faster and review diffs are readable. If you're testing anything that transforms documents, try it before writing another forty assertions.",
    at: "2026-06-08T10:35:00",
    replies: [
      { id: "fr-4", authorId: "u-viktor", body: "Adopting this for the fax classifier on the Cassia pilot. The cover-sheet variant we hit last week would have shown up as a one-line diff.", at: "2026-06-08T11:20:00" },
    ],
  },
  {
    id: "f-hiring-note",
    authorId: "u-mara",
    title: "Hiring: one more automation engineer this summer",
    body: "The pipeline says we'll need a second automation engineer by August. Referrals first, as always — send people to me directly with a line on what you've seen them build. Same bar as ever: ships carefully, writes things down.",
    at: "2026-06-05T09:10:00",
    replies: [
      { id: "fr-5", authorId: "u-viktor", body: "Sending you someone from my last team. She rebuilt their billing jobs solo and documented every decision.", at: "2026-06-05T10:25:00" },
    ],
  },
  {
    id: "f-vault-naming",
    authorId: "u-aiko",
    departmentId: "design",
    title: "Vault naming: put the account first",
    body: "Half the vault sorts by account and half by project word. Proposal: account first, then the thing — Fernwell letterhead, final. Cheap to adopt, makes the table scannable, and the graph view will thank us later.",
    at: "2026-06-04T14:50:00",
    replies: [
      { id: "fr-6", authorId: "u-june", body: "Adopted for everything I touch from today.", at: "2026-06-04T15:12:00" },
      { id: "fr-7", authorId: "u-tomas", body: "Renaming the ops templates this week to match.", at: "2026-06-05T09:30:00" },
    ],
  },
  {
    id: "f-shadow-drafts",
    authorId: "u-daniel",
    departmentId: "engineering",
    title: "Use the Shadow drafts, edit them hard",
    body: "The progress drafts are good scaffolding and bad final copy. The Tidegate one this morning had every fact right and the emphasis wrong — it led with pool allocation when Ruth cares about the shadow period. Approve nothing you wouldn't have written.",
    at: "2026-06-12T09:40:00",
    replies: [],
  },
];

/** Spliced from the seed-content authoring pass. */
export const EXTRA_FORUM_POSTS: MockForumPost[] = [
  {
    id: "f-recording-before-scope",
    authorId: "u-ines", departmentId: "design",
    title: "Recommendation: a short recording before you scope",
    body: "Before scoping anything now I ask the client for a five-minute recording of the task the way they actually do it — screen capture for desk work, a phone propped wherever for the rest. No call, no narration. Every recording so far has shown a workaround that never made the brief, and you can rewatch it at the decision point instead of trusting your notes. Costs the client nothing and it beats a second discovery call.",
    at: "2026-05-27T10:40:00",
    replies: [
      { id: "fr-8", authorId: "u-theo", body: "Did this before the Cassia intake bid — the front desk propped a phone over the counter for one check-in. Four of the packet's eleven pages never got touched.", at: "2026-06-10T09:25:00" },
    ],
  },
  {
    id: "f-june-invoicing",
    authorId: "u-andre",
    title: "June invoicing: dates and what I need",
    body: "Invoices go out June 25. Before the 18th: job owners confirm accepted splits on anything reaching review or completed this month — Fernwell collateral and the Ratio email flows are both on that path — and account owners tell me if a billing contact changed. Anything unconfirmed by the 18th rolls to July's run, payouts included. Questions to me directly.",
    at: "2026-06-02T09:10:00",
    replies: [

    ],
  },
  {
    id: "f-bid-pitch-detail",
    authorId: "u-jonas",
    title: "How much detail belongs in a bid pitch?",
    body: "Drafting my first marketing-kit bid (Ratio spring campaign) and the pitch keeps growing — a plan, a timeline, a defense of the split. The accepted bids I can see are two sentences. Is the short pitch the convention, or do leads actually read the long ones? Related: on the bounty board, is a longer claim message useful, or is speed the whole etiquette?",
    at: "2026-06-09T14:20:00",
    replies: [
      { id: "fr-9", authorId: "u-priya", body: "Two sentences, but the right two. The pitch proves you've located the actual work; the plan is what you write after acceptance. My Tidegate pitch was one sentence of pattern-matching and one of wanting it — the scoping happened in the channel afterward.", at: "2026-06-09T15:05:00" },
      { id: "fr-10", authorId: "u-sara", body: "Bounty board is the opposite problem: speed wins the claim, so keep the message to a line and put your reasoning in the deal note. The note is what helps whoever works the deal after you; the claim message is just the flag.", at: "2026-06-09T16:35:00" },
    ],
  },
  {
    id: "f-northbeam-quiet-win",
    authorId: "u-owen", departmentId: "engineering",
    title: "Northbeam phase one: eight weeks, no support tickets",
    body: "Phase one closed April 17. Since then the ingest has run every TMS export without a manual replay, and the support thread for the dashboards is empty — not quiet, empty. Two decisions paid for it: replayable batches, and the week we spent normalizing the exports before building anything on them. Phase two is on the board now; worth keeping both habits.",
    at: "2026-06-11T11:35:00",
    replies: [

    ],
  },
];

export function allForumPosts(): MockForumPost[] {
  return [...CORE_FORUM_POSTS, ...EXTRA_FORUM_POSTS].sort((a, b) =>
    a.at.localeCompare(b.at),
  );
}

// ── Vault ───────────────────────────────────────────────────

export const CORE_VAULT_ASSETS: MockVaultAsset[] = [
  { id: "v-tidegate-kickoff", title: "Tidegate intake, kickoff summary", fileType: "doc", fileUrl: "https://files.krysalis.studio/tidegate/kickoff-summary.docx", sizeKb: 84, isSharedSocial: true, uploadedById: "u-priya", jobId: "j-tidegate-claims-intake", createdAt: "2026-06-02" },
  { id: "v-tidegate-formats", title: "Tidegate carrier formats, field map", fileType: "sheet", fileUrl: "https://files.krysalis.studio/tidegate/carrier-field-map.xlsx", sizeKb: 132, isSharedSocial: false, uploadedById: "u-priya", jobId: "j-tidegate-claims-intake", createdAt: "2026-06-09" },
  { id: "v-tidegate-queue", title: "Exception queue, first cut", fileType: "image", fileUrl: "https://files.krysalis.studio/tidegate/exception-queue-v1.png", sizeKb: 940, isSharedSocial: false, uploadedById: "u-marcus", jobId: "j-tidegate-claims-intake", createdAt: "2026-06-10" },
  { id: "v-fernwell-collateral", title: "Fernwell collateral set, final", fileType: "figma", fileUrl: "https://figma.com/file/fernwell-collateral-final", isSharedSocial: false, uploadedById: "u-june", jobId: "j-fernwell-brand-refresh", createdAt: "2026-06-09" },
  { id: "v-fernwell-templates", title: "Fernwell Word templates, round-trip tested", fileType: "doc", fileUrl: "https://files.krysalis.studio/fernwell/templates-pack.docx", sizeKb: 412, isSharedSocial: false, uploadedById: "u-theo", jobId: "j-fernwell-brand-refresh", createdAt: "2026-06-09" },
  { id: "v-vargas-staging", title: "Vargas site, staging link", fileType: "link", fileUrl: "https://staging.krysalis.studio/vargas", isSharedSocial: false, uploadedById: "u-june", jobId: "j-vargas-site", createdAt: "2026-06-11" },
  { id: "v-northbeam-model", title: "Northbeam dispatch data model, phase one", fileType: "pdf", fileUrl: "https://files.krysalis.studio/northbeam/dispatch-data-model.pdf", sizeKb: 268, isSharedSocial: true, uploadedById: "u-priya", jobId: "j-northbeam-dispatch-1", createdAt: "2026-04-15" },
  { id: "v-northbeam-handover", title: "Northbeam phase one, handover note", fileType: "doc", fileUrl: "https://files.krysalis.studio/northbeam/phase-one-handover.docx", sizeKb: 56, isSharedSocial: true, uploadedById: "u-owen", jobId: "j-northbeam-dispatch-1", createdAt: "2026-04-17" },
  { id: "v-cassia-reminder-flows", title: "Cassia reminder pipeline, flow diagram", fileType: "pdf", fileUrl: "https://files.krysalis.studio/cassia/reminder-flows.pdf", sizeKb: 198, isSharedSocial: true, uploadedById: "u-daniel", jobId: "j-cassia-booking-reminders", createdAt: "2026-02-18" },
  { id: "v-cassia-case-study", title: "Cassia case study, client-ready", fileType: "pdf", fileUrl: "https://files.krysalis.studio/cassia/case-study.pdf", sizeKb: 1240, isSharedSocial: true, uploadedById: "u-sara", jobId: "j-cassia-booking-reminders", createdAt: "2026-03-06" },
  { id: "v-ratio-dunning", title: "Ratio email flows, copy deck", fileType: "doc", fileUrl: "https://files.krysalis.studio/ratio/dunning-copy.docx", sizeKb: 47, isSharedSocial: false, uploadedById: "u-camille", jobId: "j-ratio-subscription-emails", createdAt: "2026-05-29" },
  { id: "v-ratio-results", title: "Ratio email flows, first-window results", fileType: "sheet", fileUrl: "https://files.krysalis.studio/ratio/flow-results-w1.xlsx", sizeKb: 88, isSharedSocial: false, uploadedById: "u-rebecca", jobId: "j-ratio-subscription-emails", createdAt: "2026-06-09" },
  { id: "v-tidegate-letters", title: "Tidegate quote-letter masters", fileType: "doc", fileUrl: "https://files.krysalis.studio/tidegate/quote-letter-masters.docx", sizeKb: 310, isSharedSocial: false, uploadedById: "u-aiko", jobId: "j-tidegate-quote-letters", createdAt: "2026-06-05" },
  { id: "v-gate-audit", title: "Gate content audit, June", fileType: "sheet", fileUrl: "https://files.krysalis.studio/internal/gate-content-audit-jun.xlsx", sizeKb: 73, isSharedSocial: false, uploadedById: "u-dmitri", createdAt: "2026-06-11" },
];

/** Spliced from the seed-content authoring pass. */
export const EXTRA_VAULT_ASSETS: MockVaultAsset[] = [
  { id: "v-cassia-fax-log", title: "Cassia fax pilot, misclassification log", fileType: "sheet", fileUrl: "https://files.krysalis.studio/cassia/fax-misclassification-log.xlsx", sizeKb: 58, isSharedSocial: false, uploadedById: "u-fatima", jobId: "j-cassia-referral-fax", createdAt: "2026-06-10" },
  { id: "v-ratio-spring-moodboard", title: "Ratio spring campaign, moodboard", fileType: "figma", fileUrl: "https://figma.com/file/ratio-spring-moodboard", isSharedSocial: false, uploadedById: "u-hana", jobId: "j-ratio-spring-campaign", createdAt: "2026-06-08" },
  { id: "v-northbeam-driver-source-docs", title: "Northbeam driver packet, source docs", fileType: "link", fileUrl: "https://files.krysalis.studio/northbeam/driver-packet-source-docs", isSharedSocial: false, uploadedById: "u-martina", jobId: "j-northbeam-driver-onboarding", createdAt: "2026-06-09" },
  { id: "v-proposal-template-master", title: "Krysalis proposal template, master", fileType: "doc", fileUrl: "https://files.krysalis.studio/internal/proposal-template-master.docx", sizeKb: 142, isSharedSocial: false, uploadedById: "u-tomas", createdAt: "2026-06-05" },
];

export function allVaultAssets(): MockVaultAsset[] {
  return [...CORE_VAULT_ASSETS, ...EXTRA_VAULT_ASSETS];
}

// ── Academy completions ─────────────────────────────────────

/** Who has completed how much of which course (PRD section 10: spread
 *  unevenly). `lessons` is a count of lessons completed in course order;
 *  seed.ts expands to LessonCompletion rows with deterministic dates and
 *  marks the enrollment complete when the count covers the course. */
export interface SeedCompletion {
  memberId: string;
  courseId: string;
  lessons: number;
  /** First completion date; later lessons step forward 2 days each. */
  startedAt: string;
}

export const COMPLETIONS: SeedCompletion[] = [
  // TypeScript at Krysalis (9 lessons)
  { memberId: "u-daniel", courseId: "c-typescript", lessons: 9, startedAt: "2026-01-12T12:00:00" },
  { memberId: "u-priya", courseId: "c-typescript", lessons: 9, startedAt: "2026-02-02T12:00:00" },
  { memberId: "u-fatima", courseId: "c-typescript", lessons: 9, startedAt: "2026-03-09T12:00:00" },
  { memberId: "u-marcus", courseId: "c-typescript", lessons: 6, startedAt: "2026-04-06T12:00:00" },
  { memberId: "u-owen", courseId: "c-typescript", lessons: 4, startedAt: "2026-05-04T12:00:00" },
  { memberId: "u-grace", courseId: "c-typescript", lessons: 3, startedAt: "2026-05-18T12:00:00" },
  { memberId: "u-viktor", courseId: "c-typescript", lessons: 2, startedAt: "2026-06-01T12:00:00" },

  // Shipping Automations Safely (4 lessons)
  { memberId: "u-viktor", courseId: "c-automation", lessons: 4, startedAt: "2026-02-16T12:00:00" },
  { memberId: "u-priya", courseId: "c-automation", lessons: 4, startedAt: "2026-03-02T12:00:00" },
  { memberId: "u-fatima", courseId: "c-automation", lessons: 2, startedAt: "2026-05-11T12:00:00" },
  { memberId: "u-owen", courseId: "c-automation", lessons: 1, startedAt: "2026-06-08T12:00:00" },

  // Brand Systems Fieldwork (9 lessons)
  { memberId: "u-aiko", courseId: "c-brand-fieldwork", lessons: 9, startedAt: "2026-01-19T12:00:00" },
  { memberId: "u-june", courseId: "c-brand-fieldwork", lessons: 9, startedAt: "2026-02-09T12:00:00" },
  { memberId: "u-theo", courseId: "c-brand-fieldwork", lessons: 5, startedAt: "2026-04-13T12:00:00" },
  { memberId: "u-ines", courseId: "c-brand-fieldwork", lessons: 3, startedAt: "2026-05-11T12:00:00" },
  { memberId: "u-caleb", courseId: "c-brand-fieldwork", lessons: 2, startedAt: "2026-05-25T12:00:00" },
  { memberId: "u-noor", courseId: "c-brand-fieldwork", lessons: 1, startedAt: "2026-06-08T12:00:00" },

  // The Krysalis Voice (4 lessons)
  { memberId: "u-sara", courseId: "c-voice", lessons: 4, startedAt: "2026-02-23T12:00:00" },
  { memberId: "u-camille", courseId: "c-voice", lessons: 4, startedAt: "2026-03-16T12:00:00" },
  { memberId: "u-hana", courseId: "c-voice", lessons: 2, startedAt: "2026-04-20T12:00:00" },
  { memberId: "u-rebecca", courseId: "c-voice", lessons: 2, startedAt: "2026-05-04T12:00:00" },
  { memberId: "u-dmitri", courseId: "c-voice", lessons: 1, startedAt: "2026-05-25T12:00:00" },
  { memberId: "u-jonas", courseId: "c-voice", lessons: 1, startedAt: "2026-06-01T12:00:00" },
  { memberId: "u-june", courseId: "c-voice", lessons: 1, startedAt: "2026-06-08T12:00:00" },

  // Running a Handover (4 lessons)
  { memberId: "u-lena", courseId: "c-handover", lessons: 4, startedAt: "2026-02-02T12:00:00" },
  { memberId: "u-mara", courseId: "c-handover", lessons: 4, startedAt: "2026-02-16T12:00:00" },
  { memberId: "u-martina", courseId: "c-handover", lessons: 4, startedAt: "2026-03-23T12:00:00" },
  { memberId: "u-elias", courseId: "c-handover", lessons: 3, startedAt: "2026-04-27T12:00:00" },
  { memberId: "u-tomas", courseId: "c-handover", lessons: 2, startedAt: "2026-05-18T12:00:00" },
  { memberId: "u-andre", courseId: "c-handover", lessons: 1, startedAt: "2026-06-01T12:00:00" },

  // Scoping Client Engagements (4 lessons)
  { memberId: "u-lena", courseId: "c-scoping", lessons: 4, startedAt: "2026-03-09T12:00:00" },
  { memberId: "u-hana", courseId: "c-scoping", lessons: 3, startedAt: "2026-04-13T12:00:00" },
  { memberId: "u-elias", courseId: "c-scoping", lessons: 2, startedAt: "2026-05-11T12:00:00" },
  { memberId: "u-mara", courseId: "c-scoping", lessons: 2, startedAt: "2026-05-18T12:00:00" },
  { memberId: "u-sara", courseId: "c-scoping", lessons: 1, startedAt: "2026-06-01T12:00:00" },
  { memberId: "u-daniel", courseId: "c-scoping", lessons: 1, startedAt: "2026-06-08T12:00:00" },
];

// ── Portal content ──────────────────────────────────────────

export const INFO_BAR = [
  { id: "info-july", text: "Our office is closed July 3.", href: undefined as string | undefined, isActive: true, order: 1 },
  { id: "info-packets", text: "Quarterly review packets go out June 20.", href: undefined as string | undefined, isActive: true, order: 2 },
  { id: "info-guide", text: "New here? The guide below covers how this portal works.", href: "#guide", isActive: true, order: 3 },
];

export const PORTAL_GUIDE_MD = `## What this portal shows

This portal is the standing record of your work with Krysalis. Each engagement
you have commissioned is listed with its current status in plain terms — in
progress, in review with our team, or delivered. When something changes, the
status here changes; there is no version of events we see that you don't.

Files we deliver land in the shared files panel as they're ready. Anything
listed there is yours to download and keep; if a file you expect is missing,
say so in the message thread and someone will fix it the same day.

The status words are deliberately plain. "Team assigned, starting soon" means
the contract is done and scheduling is under way; "in progress" means hands
are on the work this week; "in review with our team" means a senior pass is
happening before anything reaches you. If a status hasn't moved in a while
and you're wondering why, ask in the thread — that's a fine message to send.

## How review and delivery work

Before anything is marked delivered, it passes a review inside our team — a
second set of senior eyes on the work, every time. You'll see the engagement
sit at "in review with our team" while that happens; it usually takes a few
working days. Delivered means we consider the work done and ready for your
sign-off, not that the conversation is over.

If something delivered isn't right, reply in the thread. Revisions that fall
inside the agreed scope are handled without ceremony; if a request falls
outside it, we'll say so plainly and propose what it would take.

## Reaching the team

The message thread on this page goes straight to the people doing your work,
not to a help desk. Replies come during working hours, usually within a few
hours and always within one business day.

For anything better discussed live, ask for a review call in the thread and
your contact will offer times. There's no phone tree and no ticket number —
the person who answers is the person accountable for your engagement.

## Billing and records

Invoices arrive by email from our operations team on the schedule set in your
engagement agreement. The figures in this portal show what each engagement is
contracted at, so the invoice should never be a surprise. Questions about
billing go to the same thread as everything else; we'd rather over-answer than
have you wondering.`;

// ── Academy courses ─────────────────────────────────────────
// Outlines plus finished lesson bodies; the remaining bodies for the two
// fully-written courses are in EXTRA_LESSON_BODIES (authored content pass)
// and merged by coursesWithBodies().

const COURSE_OUTLINES: MockCourse[] = [
  {
    id: "c-typescript",
    title: "TypeScript at Krysalis",
    description: "How we write, review, and ship TypeScript on client work — the primer every engineer reads first.",
    departmentId: "engineering",
    isPrimer: true,
    modules: [
      {
        id: "c-ts-m1",
        title: "The house style",
        lessons: [
          {
            id: "c-ts-l1",
            title: "Why strict mode is not optional",
            durationMin: 12,
            body: `Every Krysalis repository ships with \`strict: true\`, and the setting is not a preference — it is how we price work. A fixed-fee engagement only stays profitable if the surprises happen during development, where they cost minutes, instead of after handover, where they cost a support thread and a client's confidence.

Strict mode moves three classes of surprise forward. Null and undefined stop being runtime discoveries: if a dispatch record can arrive without a driver assignment, the type says so, and the load board renders the gap deliberately instead of crashing on a Tuesday. Implicit \`any\` stops being a silent contract: when a function accepts unlabeled data, the compiler makes you say so out loud, and the reviewer gets to ask why. And structural checks catch the drift between what an integration sent last quarter and what it sends now — the Tidegate carrier-format rename surfaced as a type error in a fixture, not a malformed claim in front of an adjuster.

The cost is honesty up front. You will write more type definitions than you would in a weekend project, and some of them will feel like ceremony. Write them anyway, and keep them next to the data they describe — a \`types.ts\` per domain, not a grab-bag \`models.ts\` for the whole repo. When a type gets painful to maintain, that is information: the shape underneath it is probably wrong, and the fix belongs in the data model, not in a looser annotation.

Two house rules close the loop. First, \`any\` does not pass review — \`unknown\` plus a narrowing function is the escape hatch, because it keeps the doubt visible. Second, \`@ts-expect-error\` requires a comment saying what is expected and when it can come out. Both rules exist for the same reason as strict mode itself: on client work, the person who pays for a hidden assumption is never the person who made it.

Read your current project's \`tsconfig.json\` before the next lesson and note anything that deviates. Deviations are allowed; undocumented ones are not.`,
          },
          { id: "c-ts-l2", title: "Types live next to the data", durationMin: 10 },
          { id: "c-ts-l3", title: "Escape hatches and what they cost", durationMin: 9 },
        ],
      },
      {
        id: "c-ts-m2",
        title: "Working in client repositories",
        lessons: [
          { id: "c-ts-l4", title: "Reading a codebase you didn't write", durationMin: 14 },
          { id: "c-ts-l5", title: "Integrations: validate at the boundary", durationMin: 12 },
          { id: "c-ts-l6", title: "Errors a client can read", durationMin: 8 },
        ],
      },
      {
        id: "c-ts-m3",
        title: "Review and delivery",
        lessons: [
          { id: "c-ts-l7", title: "What reviewers look for here", durationMin: 10 },
          { id: "c-ts-l8", title: "The handover-ready repository", durationMin: 11 },
          { id: "c-ts-l9", title: "Your first posting: how to bid", durationMin: 7 },
        ],
      },
    ],
  },
  {
    id: "c-automation",
    title: "Shipping Automations Safely",
    description: "Shadow periods, exception queues, and rollback plans for work that touches a client's system of record.",
    departmentId: "engineering",
    isPrimer: false,
    modules: [
      {
        id: "c-au-m1",
        title: "Before anything writes",
        lessons: [
          { id: "c-au-l1", title: "The shadow period, explained", durationMin: 13 },
          { id: "c-au-l2", title: "Exception queues are the product", durationMin: 11 },
        ],
      },
      {
        id: "c-au-m2",
        title: "When it goes wrong",
        lessons: [
          { id: "c-au-l3", title: "Rollback plans clients sign off on", durationMin: 12 },
          { id: "c-au-l4", title: "Writing the incident note", durationMin: 8 },
        ],
      },
    ],
  },
  {
    id: "c-brand-fieldwork",
    title: "Brand Systems Fieldwork",
    description: "Building brand systems that survive contact with the client's tools — the Design primer.",
    departmentId: "design",
    isPrimer: true,
    modules: [
      {
        id: "c-bf-m1",
        title: "Systems, not artifacts",
        lessons: [
          {
            id: "c-bf-l1",
            title: "The client's tools are the medium",
            durationMin: 12,
            body: `A brand system that only works in our design files is a portfolio piece, not a deliverable. The Fernwell letterhead will live in Word. The Ratio price list will be edited by a wholesale manager in a spreadsheet, eleven months from now, without us in the room. Fieldwork means designing for that room.

Start every engagement by asking what software the client actually opens. Not what they own — what they open. Cassia's front desk has a license for the full design suite and uses none of it; their world is the practice-management system and a shared drive. A patient-intake redesign that requires anything else has failed before the first screen is drawn, no matter how clean the flow is.

Then design the degradation path on purpose. Every system has a best version and a survivable version: the proposal template with the custom face, and the one that falls back to a system font on a machine we have never seen. Theo's acceptance test for the Fernwell templates was a round trip through Margaret's own laptop — if it comes back broken, the system is not done. Decide what is allowed to degrade (spacing tolerances, the second accent color) and what is not (the logo clear space, the figure alignment in tables), and write both lists into the delivery note.

Finally, hand over the rules, not just the files. A one-page "how to not break this" sheet beats a forty-page brand book for a two-person office: which file to copy for a new document, the three things never to change, who to message when something looks off. The vault keeps the masters; the client keeps the habits.

Before the next lesson, pick one deliverable from a current job and name its survivable version. If you cannot, that is the gap to close this week.`,
          },
          { id: "c-bf-l2", title: "Audit before you draw", durationMin: 10 },
          { id: "c-bf-l3", title: "Degradation paths, decided on purpose", durationMin: 11 },
        ],
      },
      {
        id: "c-bf-m2",
        title: "The collateral set",
        lessons: [
          { id: "c-bf-l4", title: "Templates that survive Word", durationMin: 13 },
          { id: "c-bf-l5", title: "Tables, figures, and other unglamorous wins", durationMin: 9 },
          { id: "c-bf-l6", title: "The round-trip acceptance test", durationMin: 8 },
        ],
      },
      {
        id: "c-bf-m3",
        title: "Handover",
        lessons: [
          { id: "c-bf-l7", title: "The one-page rules sheet", durationMin: 9 },
          { id: "c-bf-l8", title: "Filing the masters in the vault", durationMin: 7 },
          { id: "c-bf-l9", title: "Walking the client through it", durationMin: 10 },
        ],
      },
    ],
  },
  {
    id: "c-voice",
    title: "The Krysalis Voice",
    description: "How the firm writes — campaigns, the site, client email — and the Marketing primer.",
    departmentId: "marketing",
    isPrimer: true,
    modules: [
      {
        id: "c-kv-m1",
        title: "Plain words, real claims",
        lessons: [
          { id: "c-kv-l1", title: "What we never say", durationMin: 9, body: `The fastest way to sound like every other automation shop is to borrow their words. We do not. The site, the proposals, and every campaign run on a short discipline: name the work, name the result, and let the specifics carry the weight.

That means numbers over adjectives. "The dunning flow recovered 38 subscriptions in three weeks" beats any sentence built on "powerful" — and it is the sentence the client repeats to their board. When a result is not measurable yet, say what was done and when the measurement comes; honesty about timing reads as competence, because it is.

It also means the client is the subject of the sentence. Their front desk stops re-keying the same form; their dispatcher runs the morning from one screen. Krysalis appears as the firm that did the work, not the hero of the story. Copy that centers us is copy the reader skips.

A short list of words is banned outright because they promise nothing — the breathless adjectives every automation shop reaches for. If a draft leans on one, the draft does not know what the work actually did; go find out, then write that instead. Exclamation marks are banned in product and proposal copy for the same reason: a true sentence does not need one.

Exercise before the next lesson: take any agency homepage, pick three sentences, and rewrite each one with a number, a subject who is the client, and no banned words. Bring the before and after to your department channel.` },
          { id: "c-kv-l2", title: "Numbers do the persuading", durationMin: 10 },
        ],
      },
      {
        id: "c-kv-m2",
        title: "Channels",
        lessons: [
          { id: "c-kv-l3", title: "Email: one job per message", durationMin: 11 },
          { id: "c-kv-l4", title: "Case studies clients forward", durationMin: 12 },
        ],
      },
    ],
  },
  {
    id: "c-handover",
    title: "Running a Handover",
    description: "Closing an engagement so the client keeps winning after we leave — the Operations primer.",
    departmentId: "operations",
    isPrimer: true,
    modules: [
      {
        id: "c-rh-m1",
        title: "The handover note",
        lessons: [
          { id: "c-rh-l1", title: "Decisions with dates", durationMin: 10, body: `Six months after an engagement closes, nobody rereads the file list. They reread the decisions — and only if someone wrote them down with dates and reasons while they were fresh.

A Krysalis handover note opens with the decision log: each significant choice, the date it was made, who made it, and the sentence of reasoning that made it right at the time. "Staging-first during the shadow period (June 4, Priya and Sam) — so automated records could be diffed against hand-keyed ones before going live." That single line saves a future engineer a debugging morning and saves the client from undoing a choice they never knew was deliberate.

The second section is people, not systems: who at the client actually owns each piece now, who to call when it misbehaves, and — the part that never survives in tickets — how they like to be reached. Irene reads the weekly summary; Curtis reads nothing until something breaks. Writing that down is not gossip; it is the operating manual for the relationship.

Third, the locations: where the masters live in the vault, which assets were shared to the client portal, and which credentials were handed back. Every entry is a link, not a description. If finding something takes more than one click from the note, the note is not finished.

Keep the whole thing under two pages. A handover note that nobody finishes reading protects nobody. Before the next lesson, open the note from the last job you touched — or notice that it does not exist, which is the more common finding, and the reason this course is the Operations primer.` },
          { id: "c-rh-l2", title: "Who owns what now", durationMin: 9 },
        ],
      },
      {
        id: "c-rh-m2",
        title: "The last week",
        lessons: [
          { id: "c-rh-l3", title: "The closing review call", durationMin: 11 },
          { id: "c-rh-l4", title: "From delivered to dormant, gracefully", durationMin: 8 },
        ],
      },
    ],
  },
  {
    id: "c-scoping",
    title: "Scoping Client Engagements",
    description: "Turning a discovery call into a fixed scope the firm can deliver at margin.",
    departmentId: "operations",
    isPrimer: false,
    modules: [
      {
        id: "c-sc-m1",
        title: "Discovery that counts things",
        lessons: [
          { id: "c-sc-l1", title: "Count steps, not feelings", durationMin: 12, body: `A scope built on adjectives fails at delivery. A scope built on counted things survives. The discovery call's one job is to leave with numbers: how many steps, how many documents, how many people, how many times a day.

When Lena walked Tidegate's claims desk, she did not write "intake is very manual." She counted eleven manual steps from carrier email to claim record, and noted which three systems received the same keystrokes. That count became the proposal's spine: parser for the two formats covering 84 percent of volume, queue for the rest, and a number — 21,500.00 — that both sides could defend, because both sides could see what it bought.

Counting also exposes the work that should not be automated. Bellhaven's ninety units sound like a software problem until you learn two office staff handle them, and half the "maintenance requests" are one tenant who prefers the phone. The honest scope is smaller than the enthusiastic one, and the firm's reputation compounds on honest scopes.

Three numbers belong in every discovery summary: volume (how often the painful thing happens), touch (how many hands it passes through), and variance (how many shapes it arrives in). Volume sells the engagement, touch sizes it, and variance is where the risk lives — variance is why the exception queue exists in every automation we ship.

Practice: take the unclaimed booking card on the bounty board and write the three questions you would ask first. Compare with a colleague's three. The overlap is the playbook; the differences are worth a thread in the operations channel.` },
          { id: "c-sc-l2", title: "The three numbers every scope needs", durationMin: 10 },
        ],
      },
      {
        id: "c-sc-m2",
        title: "From numbers to a price",
        lessons: [
          { id: "c-sc-l3", title: "Fixed fees and where they break", durationMin: 13 },
          { id: "c-sc-l4", title: "Writing the proposal", durationMin: 11 },
        ],
      },
    ],
  },
];

export const EXTRA_LESSON_BODIES: Record<string, string> = {
  "c-au-l1": "Every automation we ship that writes to a client's system of record goes through a shadow period, and the shadow period is in the contract, not just the plan. For an agreed window — four weeks on Tidegate, two on smaller scopes — the automation runs at full volume but writes to a holding area while the client's team keeps doing the work by hand. Both outputs exist side by side, and the period ends when the diff between them is boring.\n\nThe point is not that we doubt the code. The point is that the client's data has habits nobody documented, and the shadow period is where those habits surface at zero cost. On the Cassia reminder pipeline, the shadow window caught a clinic that recorded appointment times in local time while the other two used UTC offsets from their old system — a wrong reminder time, sent to a real patient, would have burned trust the project never gets back. As a shadow-period diff, it was a Tuesday-morning fix.\n\nRunning a shadow period well takes three things. First, a diffable target: write to a staging table, a parallel queue, anything the client's team can compare against the hand-keyed truth without tooling we have to build twice. Second, a named owner on the client side who reviews the diff on a schedule — Sam Okada reads the Tidegate staging view every morning, and that cadence is written into the engagement. Third, exit criteria agreed before the period starts: ours is typically a full week of zero unexplained differences at normal volume. \"It looks right\" is not an exit criterion; a number is.\n\nPrice the shadow period into the bid. It is real work — the diff tooling, the review cadence, the fixes it surfaces — and engagements that skip it pay for the same work later as incident response, at a worse hourly rate and with an audience.\n\nBefore the next lesson, find the shadow-period clause in the Tidegate proposal in the vault and note its exit criteria. Then write the one-sentence version you would put in your next bid.",
  "c-au-l2": "Every classifier we ship is wrong sometimes, and the difference between an automation a client trusts and one they quietly turn off is what happens at that moment. The answer is always the same shape: an exception queue. When the system cannot act with confidence, it does not guess — it routes the item, with everything it knows, to a person equipped to decide.\n\nTreat the queue as a product surface, not an error log. The Cassia pilot routes unclassifiable faxes to a review list where the front desk sees the fax image, what the classifier thought, and one-click routing to the right clinic. Marcus is building the Tidegate version the same way: claim preview, the parser's best reading, accept into the record or correct it. A queue that takes longer to work than the original manual task is a failed design even if the classifier is excellent.\n\nThree rules keep queues honest. Confidence thresholds are explicit and tunable — the line between \"act\" and \"ask\" is a number in config, agreed with the client, not a vibe in the code. Every queue decision is logged with who decided and what they chose, because that log is both the audit trail the client's compliance people want and the training set for raising the threshold later. And queue volume is a metric the client sees: the Cassia pilot was scoped to send the long tail to manual routing, and saying so plainly in the proposal is why two misrouted faxes in week three read as the pilot working, not failing.\n\nThe deeper habit: design the failure path before the success path. The success path is usually the easy 84 percent — the two carrier formats, the typed cover sheets. The exception path is where the client learns whether the system respects their work. Get it right and the queue becomes the place where trust compounds, one well-handled edge case at a time.\n\nExercise: open the exception queue screenshots in the vault (Exception queue, first cut) and write down what a claims adjuster sees, in order. Then list what they would need that is missing. Bring the list to the job channel.",
  "c-kv-l2": "Adjectives ask the reader to take our word for it. Numbers let the reader check. That is the whole logic of how Krysalis writes about results, and it changes what you collect during an engagement, not just what you write afterward.\n\nCompare the two ways to describe the same work. \"The dunning flow has dramatically improved subscription retention\" — nothing in that sentence can be checked, repeated to a colleague, or defended in a renewal conversation. \"The dunning flow recovered 38 of 61 failed payments in its first window\" — that sentence survives being forwarded. The client's wholesale manager can repeat it to the owner without us in the room, and it sounds exactly as good secondhand, which is the test that matters.\n\nNumbers also discipline us. To write the second sentence, somebody had to count recoveries against failed payments, which means somebody had to decide the measurement before the flow went live. Writing with numbers is downstream of scoping with numbers: the three counts that belong in every discovery summary — volume, touch, variance — become the before in every case study's before-and-after. If you reach the end of an engagement and there is no number to report, the miss happened months earlier, at scoping.\n\nTwo cautions. First, only use numbers you can stand behind: a count from a four-week window is a count from a four-week window, and saying \"first window\" costs nothing while inflating it would cost everything. Second, a number without a denominator is an adjective in disguise — \"38 recovered subscriptions\" means little until \"of 61 failed payments\" sits next to it. Percentages without bases are the same trick; prefer \"312 of 320 sample notices\" to \"97.5 percent accuracy\", because the reader can feel the size of the sample.\n\nExercise: take one engagement you know — the vault's case studies work — and write its result twice: once with adjectives, once with a counted claim and its denominator. Read both aloud. Then check whether the number you used exists anywhere a client could verify it. If it doesn't, that's the real finding.",
  "c-rh-l2": "A handover note that lists systems but not people leaves the client knowing what was built and nobody to call. The second section of every Krysalis handover is an ownership map: each piece of the delivered work, the named person at the client who owns it now, and the named person at Krysalis who owned it last.\n\nOwnership means three specific things, and the note should say all three. Who operates it — the person who runs the weekly export, reads the queue, edits the price sheet. Who decides about it — the person with authority to change a threshold, approve a template edit, or accept a new carrier format. Who gets called when it misbehaves — which may be neither of the above, and at small clients is usually one overworked office manager whose name deserves to be written down with respect.\n\nThe map is only honest if it was true before the handover. The transfer of ownership happens during delivery, not on the last day: Felix edited the Ratio price sheet himself in week two, with Caleb watching, which is how we knew the system survived its real operator before review. If the first time the client's person touches the thing is after we leave, the handover note is recording a hope, not a fact. Build the operating habit during the engagement and the handover section writes itself.\n\nInclude reading habits, because they decide how the relationship ages. Curtis reads nothing until something breaks; Irene reads the weekly summary and answers the same day. Writing that down is not gossip — it is the difference between the next engagement starting warm and starting from zero. The account manager keeps this current, but the delivery team learns it first, and the handover note is where that knowledge stops being tribal.\n\nExercise: pick a job you are on now and draft its ownership map today, mid-engagement — operator, decider, first call, reading habits, four lines. The gaps you cannot fill are your remaining delivery work, listed by name.",
  "c-sc-l2": "Every discovery summary at Krysalis carries the same three numbers: volume, touch, and variance. They are not paperwork; they are the scope. Get them right and the proposal nearly writes itself. Skip one and the engagement finds it later, at delivery prices.\n\nVolume is how often the painful thing happens — per day, per week, per renewal season. It sells the engagement, because volume times minutes is the client's cost in hours they can check against their own payroll. Halcyon's front desk losing two hours a day is a volume claim; so is Bellhaven's two office staff against ninety units. Always get volume from counting, not from the frustrated estimate in the first call — walk the desk, pull a week of the inbox, count the pile. Lena counted eleven manual steps at Tidegate because she stood next to the claims desk and watched, and that count became the spine of a 21,500.00 proposal nobody argued with.\n\nTouch is how many hands the painful thing passes through. Touch sizes the work, because every hand is an interface: a person to interview, a handoff to preserve or remove, an approval the automation must respect. A one-touch process is a parser; a four-touch process is a workflow with politics. Cassia's referral faxes looked like one problem until touch revealed three clinics with three routing habits — the same data, three owners.\n\nVariance is how many shapes the thing arrives in, and variance is where the risk lives. Two carrier formats covering 84 percent of Tidegate's volume is a variance finding; so is discovering that the remaining 16 percent is scanned PDFs. Variance decides what gets automated and what goes to the exception queue, and proposals that state that split plainly — we automate these shapes, a person handles those — survive contact with reality.\n\nExercise: take the unclaimed booking card on the bounty board and write the volume, touch, and variance questions you would ask in the discovery call — three of each. Compare with the account notes for a deal that closed. The overlap is the playbook.",
  "c-ts-l2": "Open the Northbeam dispatch repository and the folder layout already explains the system: `dispatch/` holds the load and driver types, the ingest that constructs them, and the fixtures that prove the ingest honest. Nothing about dispatch lives anywhere else. That is the house layout — a `types.ts` per domain, sitting beside the functions that produce the shape and the tests that exercise it.\n\nThe alternative is the central dump: a `types/index.ts` that every file imports from and nobody owns. Types far from their data drift, because the person changing the ingest does not see the type two folders away, and the person reading the type cannot see what actually constructs it. A grab-bag module also hides dependencies: when everything imports from one place, the import graph says nothing. When `billing/` has to reach into `dispatch/types` to get a `LoadRecord`, that line is a real dependency made visible, and the reviewer gets to ask whether billing should know about loads at all.\n\nDerive instead of restating. If the domain has a closed set of statuses, write the list once and let the type fall out of it:\n\n```ts\nconst LOAD_STATUSES = [\"unassigned\", \"assigned\", \"in_transit\", \"delivered\"] as const;\ntype LoadStatus = (typeof LOAD_STATUSES)[number];\n```\n\nNow the validator, the filter chips, and the type all read from one declaration, and adding a status is a one-line change the compiler propagates. The same instinct applies to config-shaped data: `satisfies` checks a literal against a contract without widening it, which keeps autocomplete working and the contract enforced.\n\nThe payoff shows up at bidding time. Northbeam phase two went on the board with the phase-one data model attached, and it drew four scoped bids — two of them from engineers who never touched phase one, neither of whom needed a walkthrough to land on a defensible number. The types were the map, and they were trustworthy because they lived where the data was made.\n\nBefore the next lesson: find one type in your current repo defined more than a folder away from the code that constructs it. Move it next to its constructor and let the broken imports show you who actually depends on the shape. The list is usually shorter than the central file implied.",
  "c-ts-l3": "Every escape hatch in TypeScript is a loan. `any`, `as`, the non-null `!`, `@ts-expect-error` — each one buys you a passing build now and bills someone later, with interest. On marketplace-staffed work the someone is usually not you: the next engineer on the account inherits the repo through a bid, not a briefing. What you silenced, they debug.\n\nSo the house prices the hatches explicitly. `any` does not pass review, full stop. It is not a type; it is an agreement to stop checking, and it spreads — one `any` parameter quietly turns every downstream value into `any` too. The honest version of the same move is `unknown` plus a narrowing function: the doubt stays, but it stays visible and stays contained.\n\n`as` is allowed only at a marked boundary where you can defend both sides — immediately after a validation that proves the shape, or inside a test building a fixture. An `as` in the middle of business logic means the types and the logic disagree and you sided against the compiler. The double cast, `as unknown as T`, is two hatches stacked; treat it as a flare, not a technique.\n\n`@ts-expect-error` carries a comment saying what is expected and when the line can come out — a library bug with the issue link, a migration with a date. `!` is acceptable only when the guarantee sits on the adjacent line; if you have to scroll to justify it, restructure instead.\n\nThere is one escape hatch we ship proudly, and it is instructive. When the Tidegate intake parser meets a scanned PDF it cannot read, it does not guess — it routes the notice to the exception queue, where a person decides. That is `unknown` as a product decision: doubt made visible, contained, and handed to someone equipped to resolve it. Your code should fail the same way. The expensive failures are never the loud ones; they are the confident wrong answers an `any` waved through.\n\nExercise: search your current project for `: any` and ` as ` and put each hit in one of three buckets — boundary, laziness, or latent bug. Bring the counts to the engineering channel; the buckets matter more than the totals.",
  "c-ts-l4": "Most engineering work here starts inside code you did not write. You bid into phase two of someone else's build, onto a pilot a previous job left behind, or against a client's existing system of record. Reading an unfamiliar codebase quickly and correctly is not a junior survival skill; it is the core competence the marketplace assumes.\n\nRead in this order. First, `tsconfig.json` and `package.json` — five minutes that calibrate everything after. Strict settings mean the types are load-bearing and you can navigate by them; loose settings mean the types are decoration and you verify by hand. The scripts block tells you the real entry points, which are not always the documented ones.\n\nSecond, find where data enters and where it leaves. Every system we ship is a pipe with a boundary at each end — a parser, an API route, an export, a render. Between the boundaries is transformation, and transformations are readable once you know both ends.\n\nThird, pick the central domain type — the `ClaimRecord`, the `LoadRecord` — and read outward from it. Go-to-definition and find-all-references are the map tools. The type's consumers tell you what the system actually does, as opposed to what the README remembers.\n\nFourth, read the fixtures and tests. Fixtures are the honest documentation — committed samples of what the data really looks like. Tests tell you what the last person was scared of, which is the most useful thing they left behind.\n\nFifth, run it before you change it. A build you have never seen green is a build you cannot trust red.\n\nPriya Raman's habit on the Tidegate kickoff is the standard to copy: before writing a line, she traced one carrier notice end to end — inbound email, parser, field map, staging row — reading every function it passed through. One record, fully followed, beats ten files skimmed.\n\nWhile you read, write down everything that surprises you. A surprise is either your misunderstanding or the repo's debt, and both lists are valuable: the first becomes your questions for the job channel, the second becomes review findings and, eventually, handover material.\n\nKeep the first change small. The first PR into an unfamiliar repo should be deliberate and almost trivial — a fixture added, a type tightened — because its real purpose is proving you can run, test, and ship the thing. Opening with a restructuring PR skips the part where the repo teaches you why it is shaped that way.\n\nExercise: take a repo you have not touched — the Northbeam phase-one model in the Commons works — and give yourself 45 minutes. Write five sentences: what it does, where data enters, the central type, the riskiest file, and one question for the last author. Then check them against the handover note, if one exists. The gaps run both ways.",
  "c-ts-l5": "Every engagement that earns real money touches someone else's data: carrier emails, ledger exports, a practice-management API. None of it is yours, all of it changes without notice, and the type system cannot see across the wire. So the rule is mechanical: data from outside is `unknown` until a function you wrote proves otherwise, and that proof happens once, at the boundary — not scattered through the business logic.\n\nThe boundary function takes `unknown` and returns a decision, never a half-typed object:\n\n```ts\ntype IntakeResult =\n  | { ok: true; claim: ClaimRecord }\n  | { ok: false; reason: ExceptionReason; raw: string };\n```\n\nEverything inside the boundary works with `ClaimRecord` and trusts it completely — that trust is the entire return on the boundary's paranoia. The one move this pattern forbids is the quiet one: `as ClaimRecord` on response JSON, which converts a runtime risk into a type-level lie.\n\nThe Tidegate numbers show what an honest boundary looks like. The first carrier format parses 312 of 320 sample notices; the eight failures are scanned PDFs, and they go to the exception queue by design. The parser does not guess at images. Refusing to guess is a feature the client is paying for — a wrong claim record costs Ruth Calder's team more than a queued one.\n\nValidate meaning, not just shape. A notice can satisfy every structural check and still carry a loss date in the future or a policy number from the wrong line of business. Semantic checks belong at the same boundary; downstream code should never be where nonsense is first noticed.\n\nAnd plan for the format to change, because it will. The second carrier renamed half its fields in March, and the fix still cost a debugging morning even though a fixture's type error kept it out of production. Two defenses are now standard on intake work: a committed fixture per format version, so a rename surfaces as a readable diff, and a normalize-then-parse split, so version differences are absorbed in one place. Fatima El-Sayed's line from the Fernwell bidding is the right instinct for any export-driven job — normalize the ledger export first, so the packet generator never sees a malformed quarter.\n\nExercise: find one place on your current job where external data crosses into typed code without a runtime check. Either write the narrowing function or write three sentences arguing why the check is unnecessary. Both are legitimate outcomes; bring whichever you produce to review, because that argument is exactly what your reviewer needs to see.",
  "c-ts-l6": "An error in client work has two readers: the engineer with the logs open, and the person at the client who hit it — a claims processor working the exception queue, a front desk mid-check-in. Most codebases serve the first reader and abandon the second. We are paid to serve both.\n\nThe house pattern for the human-facing sentence is fixed: what happened, then the next action. No apology, no blame, no stack trace on a client surface, and no cheerfulness — a person staring at a failed claim does not need the software's mood; they need to know what to do.\n\nGetting that sentence right starts in the type system. Model failure as data, not as thrown strings:\n\n```ts\ntype IntakeException =\n  | { code: \"SCANNED_PDF\"; carrier: string }\n  | { code: \"UNKNOWN_FORMAT\"; subjectLine: string };\n```\n\nA thrown string can only be logged. A typed exception can be rendered for the queue (\"Scanned PDF from Harborline Mutual — enter the claim manually.\"), counted for the weekly review, and filtered by code, all from the same value. The discipline is to capture the fields the sentence will need at the moment the failure happens; reconstructing context later is how messages end up vague.\n\nKeep the two readers separate but fed from one source. The log line gets the code, the raw payload, and the cause chain. The client surface gets the sentence and the next action. When both render from one type they cannot drift apart — the Tidegate queue and its logs are two views of the same `IntakeException`, which is why the queue stays accurate without anyone maintaining it separately.\n\nThe same principle holds when nothing is wrong. The Cassia fax pilot records why every referral routed where it did, so the clinics can audit the pilot instead of trusting it. An explanation a client can read is not an error-handling nicety; it is what makes automation acceptable to the people whose work it touches.\n\nExercise: take the most recent failure path in your code and write the exact sentence the client's staff would see. If you cannot name the next action, the error type is missing a field. Add it.",
  "c-ts-l7": "Review here is not a style gate. It is where the fixed fee gets defended — the last point where a hidden assumption costs minutes instead of a support thread. Knowing what reviewers read first makes you faster on both sides of the table.\n\nThe boundaries come first. A reviewer opens the diff at every point where external data enters and asks one question: validated or asserted? An `as` where a narrowing function belongs fails review no matter how clean everything downstream is, because downstream cleanliness is exactly what the assertion put at risk.\n\nEscape hatches, second. Each `any`, `!`, and `@ts-expect-error` has to justify itself under the rules in lesson three. The reviewer is not hunting violations; they are reading your judgment about where doubt lives.\n\nThird, whether the types tell the truth. `driverId?: string` on a record where the field is always present is a small lie that compounds — every consumer now handles a case that cannot happen, and the day it can happen, nobody believes the type anyway. Optionality, nullability, and unions should mean exactly what the data does.\n\nFourth, vocabulary. Code on the Tidegate job says `notice`, `claim`, and `carrier` because Ruth Calder's team says them. Inventing synonyms costs every future reader a translation table, and the future readers include the client's own engineers after handover.\n\nFifth, money. `Decimal` end to end, never floats, with the pool invariants checked where the arithmetic happens. A penny of drift in a worker-pool split is not a rounding bug; it is the firm being wrong about money in front of its own people.\n\nSixth, tests where the revenue is. The two carrier formats covering 84 percent of Tidegate's volume get committed fixtures and exhaustive cases; the exotic remainder gets routed to the queue, plus one test proving it routes. Coverage should follow the economics of the job, not the easiness of the code.\n\nAround the checklist, shape matters: small PRs, with a description that says what changed and where the risk is. And when review surfaces real disagreement, copy the staging-versus-records argument from the Tidegate channel — Marcus and Priya disagreed in the open, settled it with the client inside a day, and wrote the resolution where the next person would find it. Daniel Okafor's standard for comments applies to everyone: questions about assumptions beat verdicts about style.\n\nExercise: pick an open PR this week and review it against the six checks above, whether or not you were asked. Leave at least one genuine question about a hidden assumption. Asking well is the skill; the rest is reading.",
  "c-ts-l8": "Engagements end. The repository's real test comes after — when a phase-two bidder scopes against it, when the client's in-house hire inherits it, when you return in eight months with no memory of why anything is the way it is. Handover-ready is not a final-week cleanup; it is a state the repo holds from the first commit.\n\nThe checklist is short and unforgiving. A README that takes a stranger from clone to running system, with commands that are copy-pasteable and true. An `.env.example` naming every variable with a sentence each — a value that exists only in someone's shell history is a value the firm has already lost. Fixtures and seeds that work offline: the Tidegate parser ships with its committed sample notices, scrubbed of policyholder data, so the tests pass without carrier credentials or a VPN. Scripts that match the docs, because a README that lies once is distrusted everywhere.\n\nThen the layer prose cannot cover. Types are the documentation that cannot go stale — they are re-checked on every build, which is more than any wiki can claim. This is why the house spends so much on them: lessons two through five were also about handover, even when they did not say so.\n\nDecisions need their own note: the choices that shaped the repo — staging-first during the shadow period, the record writer behind a flag — with dates and the sentence of reasoning that made each right at the time. The Operations course Running a Handover covers the full format; read its first lesson even if you never run one, because engineers produce most of the raw material.\n\nFinally, the TODO audit. A TODO that is actually a bug is a defect the client paid for and cannot see. Fix it, or file it where the job channel and the client can see it. Honest open items are fine; buried ones are not.\n\nThe standard, demonstrated: when Northbeam phase one closed, Owen Gallagher filed the handover note and the data-model PDF in the vault. Phase two went on the board this month and drew four scoped bids, two of them from engineers who never touched phase one — and nobody needed a walkthrough. The repo answered the questions. That is what the firm sells, and it is why handover-ready work keeps winning the next engagement.\n\nExercise: clone your current job's repo into a clean directory and follow your own README exactly as written, no improvising. Every place it lies, fix the README or the repo — whichever one is wrong.",
  "c-ts-l9": "The mechanics first. Every posting shows three figures: gross, worker pool, and the firm's margin. The transparency is policy — you are bidding into the pool, and you can see exactly what the firm keeps. One bid per person per job. Your proposed split must fit inside the unallocated remainder of the pool, and you can edit it while it is pending. An accepted bid puts you on the job, opens the job channel to you, and turns your split into earnings when the job completes.\n\nSize the bid to the slice, not the pool. Most jobs split across two or three people: Tidegate's 13,975.00 pool went 7,400.00 to the parser and 5,200.00 to the exception queue. Bidding the whole pool on a multi-person job says you have not read the work; bidding low to win says the same thing from the other direction. Name the part you will own and price that part defensibly.\n\nThe pitch is one or two sentences, and specific beats eager every time. Read the accepted bids on completed jobs — they are the curriculum. Owen Gallagher's winning line on the dispatch ingest: \"TMS exports are ugly but consistent. I'll build the ingest with replayable batches.\" A slice, a reason it is his, and the thing he will protect. Nothing in it could be pasted onto another job, which is exactly the point.\n\nDo the reading before the writing. The job description, the account's notes, and the account's prior jobs are all linked from the posting. On any Cassia posting, a pitch that shows you know the reminder pipeline exists will beat a longer one that does not.\n\nFor a first job, bid a defined slice on a posting where a senior engineer is bidding for the spine — the pattern Marcus Webb used on Tidegate, taking the exception queue alongside Priya's parser. You get real scope, a reviewer who knows the account, and a completed job on your record.\n\nExercise: draft a bid on an open Engineering posting today. Write the two sentences and the number, then compare them against the pending bids already on the job before deciding whether to place it. The comparison is the lesson; placing it is up to you.",
  "c-bf-l2": "The first week of a brand engagement produces a list, not a layout. Before anyone opens a design file, someone collects every document the client currently sends out the door, and notes who edits each one, in what tool, and how often. The collection is always stranger than the kickoff call suggested.\n\nThe Fernwell audit is the standing example. The brief said letterhead, proposal template, report covers. The collection pass turned up six letterhead variants in circulation — Margaret's, Paul's older one, a fax cover sheet from a print shop that no longer exists, and three engagement letters that each set the margins differently. None of that was anyone's fault; it is what happens when a firm runs for years without masters. The audit did not embarrass anyone. It told us the real deliverable was not a prettier letterhead but a single source the variants could collapse into.\n\nAiko ran the same pass at Tidegate before touching the quote letters: she pulled the letters the claims team actually sent in a sample month, not the ones the style guide said existed. Two of the standard letters had not gone out since 2024, and one letter nobody mentioned in scoping carried half the volume. That finding moved the whole engagement, and it cost an afternoon.\n\nRecord four things per document: who edits it, in what tool, how often, and where the current version lives. Then add a fifth column the client cannot fill in: what the document is derived from. The Ratio price list is derived from a spreadsheet; the Cassia intake packet is derived from three clinics photocopying each other for years. Derivation is where the system design actually happens — fix the source and the artifacts follow.\n\nResist sketching during the audit. A direction picked on day two is picked before the variant problem is visible, and it will be wrong in ways that are expensive to walk back. The drawing goes faster after the audit, not slower; the time comes back out of arguments you no longer have.\n\nExercise: pick an active design job and list every document the engagement touches — sent, printed, or filled in. For each, write who edits it and in what tool. Any row you cannot fill without guessing is your next client question, and it is a better one than anything about color.",
  "c-bf-l3": "Lesson one named the idea: every system has a best version and a survivable version. This lesson is the method for deciding the gap between them, because a degradation path nobody chose is just breakage with a delay.\n\nStart with the three failure surfaces every deliverable meets. A machine without our fonts. A printer without our color. A person in a hurry exporting, pasting, or forwarding. Each element of the system meets all three, and for each meeting there are only three honest outcomes: it holds, it degrades to something we picked, or it breaks the document.\n\nWalk the elements one at a time and assign an outcome. The Fernwell wordmark holds — it ships as an image at fixed size, so a missing font cannot touch it. The proposal body face degrades — Theo paired it with a system font whose metrics are close enough that pagination survives the swap. The second accent color degrades to nothing; on a one-cartridge office printer it simply disappears, and the documents were designed to read without it. The figure alignment in the report tables is not allowed to do either: a quarterly number that drifts off its decimal misstates money, so the tables are built so the worst available renderer still aligns them.\n\nThe hold-degrade-break sheet becomes two lists in the delivery note. The allowed-to-degrade list, with what each item degrades to. The never-degrades list, with how each item was made safe. Aiko's Tidegate quote letters carried both lists, and when the claims document system stripped styling — which it does, reliably — nothing on the second list moved.\n\nTwo judgment calls recur. Spacing tolerances: pick a range, not a pixel, because Word will not give you the pixel. And anything marked breaks is not a client-education problem; it is a design fault. If the layout collapses when someone deletes the intro paragraph, redesign until it cannot, or move that surface out of the client's hands entirely.\n\nExercise: take one deliverable from a current job and run its elements through the three surfaces — missing fonts, no color, hurried export. Mark each element holds, degrades, or breaks. Anything marked breaks is this week's work.",
  "c-bf-l4": "A Word template is a piece of software with no error messages. Whatever you build will be edited by someone with no design training, on a machine you have never seen, under deadline — and it has to come back intact. Theo's Fernwell pack is the house reference; this lesson is the rules it follows.\n\nStyles carry everything. Direct formatting — select text, click bold, nudge a size — dies the first time someone pastes over it. Every paragraph in the template maps to a named style, and the names are in the client's vocabulary: Report heading, Client name, Figure table, not H2-alt-final. When Margaret pastes a paragraph from an email, it lands in Body and looks like Fernwell, because Body is defined and the paste has nowhere else to go. Set the default paste behavior to merge formatting inside the template itself; it is a document setting, and it travels with the file.\n\nFonts the client has not licensed do not exist. Design with the brand face, but pair every style with a metric-compatible system fallback and test pagination in the fallback — if the proposal grows a page when the font swaps, the swap was not designed. The wordmark never travels as type. It is an image, placed in the header at fixed dimensions, with the clear space built into the image file's own padding so nobody can crowd it without cropping.\n\nLayout goes in tables and headers, never text boxes. Text boxes float, anchor to paragraphs that get deleted, and reflow unpredictably across Word versions. A table with hidden borders does the same job and stays put. Keep the page geometry inside the printable area of a cheap office printer — twelve millimeters minimum — because Fernwell's printer is not our printer.\n\nLock what must not move. Headers and footers hold the letterhead and stay uneditable in normal use; content controls mark the fields people fill in — date, client, fee — so the structure around them survives. Everything else stays editable on purpose. An over-locked template gets abandoned for a copy of last month's document, and then the system is whatever last month looked like.\n\nShip each template with one disposable instruction page at the top — three sentences, then \"delete this page.\" It is read at the exact moment it is useful, which a separate PDF never is.\n\nExercise: open any template you have shipped or inherited, disable the brand fonts on your own machine, and make three hurried edits — paste from an email, delete a heading, add a table row. List what broke. That list is the spec for the next version.",
  "c-bf-l5": "Clients do not judge a brand system by the logo. They judge it by the document with money on it — the price list, the quote letter, the quarterly packet — because that is the one their own customers read line by line. Tables are where the system earns its fee, and table craft is mostly rules you can memorize.\n\nNumbers align on the decimal, two places, right-aligned in their column. Use tabular figures — the variant where every digit has the same width — or the column turns ragged the first time a 1 lands over a 4. Units and currency live in the header, not repeated in every cell; a column that says \"per lb\" once reads faster than forty cells that each say it.\n\nHairline rules beat boxes. A table drawn as a cage of borders reads like a form; horizontal hairlines between row groups and generous row height read like a document someone designed. Column widths are fixed, not auto — auto-fit reflows the moment a long product name arrives, and the Ratio list has a few.\n\nThe Ratio price-list refresh is the working example of the deeper rule: design the source, not the artifact. Felix updates wholesale prices in one sheet; the list document pulls from it and exports clean. The design work was deciding what a row is, what changes monthly versus yearly, and what happens when a product retires — the layout was the last hour. Eleven months from now the list will still look right, because looking right was made the path of least effort.\n\nAiko's Tidegate quote letters apply the same discipline at higher stakes: a claims adjuster scans the figure table before reading a word of the letter, so the amounts sit in a structure the claims document system cannot misalign. June's Ratio bag labels are the small-format version — fixed die line, two inks, every variable field sized for its longest real value, not its average one.\n\nExercise: find a table in any current deliverable and check five things — decimal alignment, tabular figures, units in the header, fixed column widths, longest-real-value sizing. Fix what fails, then post the before and after in the design channel.",
  "c-bf-l6": "A template is not done when it looks right in our files. It is done when it survives the client. The round-trip test makes that operational: the deliverable goes to the client's actual machine, a real user makes realistic edits, saves, and sends it back, and we inspect what returns. Theo ran it on the Fernwell pack through Margaret's own laptop and called it the real acceptance test. That is now the house position.\n\nThree rules keep the test honest. First, the real machine — not a colleague's laptop standing in for it. The point is to meet the fonts, the Word version, the printer driver, and the paste habits we did not know about. Second, the real user. Margaret, not Paul, and not whoever at the client is most careful — the test is of the system under ordinary hands. Third, scripted edits that match real work: add a paragraph, paste from an email, change the date and the fee, print to PDF, attach and send. Five minutes of their time, scheduled, not sprung.\n\nWrite the pass criteria before the file leaves. On return, check fonts (substituted where designed, nowhere else), styles (paragraph styles intact, no rogue direct formatting), the wordmark (position, size, clear space), pagination (same page count, nothing orphaned), and the figure tables against the never-degrades list from lesson three. A failure is not a client problem. It is a finding, and the fix goes in the template, not in an instruction.\n\nRun the test before internal review, not after delivery. A round-trip failure caught in review costs a day; the same failure found by the client costs a support thread and some of the confidence the engagement was supposed to build. And run it again after any small revision — small revisions are where direct formatting sneaks back in.\n\nExercise: write the round-trip script for a current deliverable — machine, user, five edits, pass criteria — even if the test is weeks away. If you cannot name the real user, that is the first gap; ask the account owner today.",
  "c-bf-l7": "A forty-page brand book is a deliverable for clients with brand teams. Our clients have Margaret, Felix, and a front desk. What they need is one page that keeps the system alive between our visits, and writing it is harder than it looks, because one page forces decisions a long document lets you dodge.\n\nThe sheet has four parts. Where things live: a link to the portal folder with the masters, one line per file, in the client's words — \"New proposal: copy Proposal template; never edit it directly.\" What never changes: three items at most, named plainly — the logo and its clear space, the figure-table layout, the fonts list. If a fourth item wants onto the list, the template is under-built; fix the template. Common tasks: the two or three things they actually do, as numbered steps — for Fernwell that is Paul's quarterly packet assembly, for Ratio it is Felix's monthly price update: copy, edit the sheet, export, done. Who to message: one name and one channel, not a support policy.\n\nWrite it in their vocabulary, not ours. Felix does not have masters and instances; he has the price sheet and the list. If the sheet needs a glossary, that is our jargon, not their gap. Keep instructions positive where possible — \"copy this file\" carries better than nine prohibitions, and three nevers is the whole budget.\n\nThen test it the only way that counts: hand it to someone who was not on the job and have them perform a task cold against the actual files. Where they hesitate, the sheet — or the system — fails. June's habit is to run this with whoever is nearest in the studio before any handover; a junior designer stumbling on step two is the same stumble Felix will make in November, found while it is still free to fix.\n\nThe rules sheet ships in the delivery note and gets filed in the vault next to the masters, so the next Krysalis person on the account reads the same page the client did.\n\nExercise: draft the rules sheet for a job you are on now, in under 250 words. Then cut it by a third. What survives the cut is what the client will actually retain.",
  "c-bf-l8": "The engagement ends; the files do not. Eleven months after the Ratio bag labels shipped, the wholesale price-list job landed with someone who was not on the original work — and the system held because the masters were findable, named for what they are, and linked to the job. Filing is the unglamorous half of handover, and it is the half the next designer experiences.\n\nWhat gets vaulted, per engagement: the design masters (source files, not exports), the round-trip-tested template pack, the rules sheet, and a short note naming the fonts and where their licenses sit. Each asset links to its job, so the work's channel, money, and files stay one click apart. Exports and working files stay out; the vault holds what someone would need to continue the work, not the archaeology of how we got there.\n\nNames follow one rule: account first, then the thing, then the state — Fernwell letterhead, final. \"Final\" is a claim with a definition: it has passed the round trip. Anything that has not is dated instead, and the date is the warning. One master per artifact; when a revision lands, the old final is renamed with its date rather than deleted, because the client may still be running it.\n\nTwo boundaries matter. The client receives copies through the portal and never holds the only copy of anything — if their shared drive loses the letterhead, the master is here. And sharing to the Commons is a separate decision from filing: the Fernwell collateral files to its job, while the case-study-ready pieces are shared firm-wide. Filed is for continuity; shared is for the firm to learn from.\n\nA filing pass takes twenty minutes at the end of an engagement and saves a half day at the start of the next one, usually for a person who cannot ask you anything because you are on other work by then.\n\nExercise: open the vault and find the masters for the last design job you touched. Time yourself. Over one minute, or any guessing about which file is current — fix the names and links now, while you still remember which is which.",
  "c-bf-l9": "The last deliverable on a brand engagement is not a file. It is twenty minutes in which the client does the work themselves while we stay quiet. The walkthrough call exists to transfer the habits, and habits do not transfer by demonstration — they transfer by the client's own hands doing the task once with help nearby.\n\nStructure the call around three tasks, not a tour. For Fernwell: Margaret creates a new proposal from the template, pastes a paragraph from a real email, and exports it. For Ratio: Felix updates two prices in the sheet and regenerates the list. The tasks come from the rules sheet, which is open on their screen, because the call is also the test of that page. The client drives. When they stall, the urge to take the keyboard is strong and wrong — talk them to the next step instead, because we will not be on the line in November.\n\nListen for hesitation; it is the best data the engagement will produce. A pause means the sheet skipped a step, or the template demanded a decision it should have made for them. Aiko's Tidegate handover with Sam's claims team surfaced exactly one stall — picking which letter master matched a claim type — and the fix was renaming the masters in the claims team's own terms, that afternoon. The fix is always in the system, never in saying it again louder.\n\nClose with the boundaries: what they own now, what stays in our vault, who to message when something looks off, and what is out of scope until the next engagement. Plain sentences. A client who knows the edge of the system trusts the inside of it.\n\nThen write the handover note the same day — the tasks performed, the stalls, the fixes, who drove — and file it with the masters. Operations runs a whole course on what happens after an engagement closes; this note is its first input.\n\nThe system is done when the client finishes the task without us talking. That is the standard, and it is observable.\n\nExercise: script the walkthrough for a current job — three tasks, who drives, what counts as a stall. If the job is months from handover, script it anyway; the script will change what you build.",
};


export function coursesWithBodies(): MockCourse[] {
  return COURSE_OUTLINES.map((course) => ({
    ...course,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        body: lesson.body ?? EXTRA_LESSON_BODIES[lesson.id],
      })),
    })),
  }));
}
