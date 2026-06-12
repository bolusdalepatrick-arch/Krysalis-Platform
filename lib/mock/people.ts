import type { MockDepartment, MockPerson } from "./types";

export const DEPARTMENTS: MockDepartment[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Builds and ships the automation work clients sign for.",
  },
  {
    id: "design",
    name: "Design",
    description: "Brand systems, product surfaces, and everything clients see.",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "The firm's voice: campaigns, content, and the public site.",
  },
  {
    id: "operations",
    name: "Operations",
    description: "Keeps engagements, accounts, and the books moving on time.",
  },
];

/**
 * The firm (PRD section 10): 24 employees, the managing director, two system
 * users, one parked account, six client users. Ids are stable seed ids.
 */
export const PEOPLE: MockPerson[] = [
  // Leadership
  { id: "u-mara", name: "Mara Voss", title: "Managing Director", role: "ADMIN", departmentId: "operations", email: "mara@krysalis.studio", xp: 2210, tier: 4, earnings: 0 },

  // Engineering
  { id: "u-daniel", name: "Daniel Okafor", title: "Engineering Lead", role: "MODERATOR", departmentId: "engineering", email: "daniel@krysalis.studio", xp: 3185, tier: 5, earnings: 41250 },
  { id: "u-priya", name: "Priya Raman", title: "Staff Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "priya@krysalis.studio", xp: 2640, tier: 4, earnings: 38900 },
  { id: "u-marcus", name: "Marcus Webb", title: "Frontend Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "marcus@krysalis.studio", xp: 1480, tier: 3, earnings: 21600 },
  { id: "u-owen", name: "Owen Gallagher", title: "Backend Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "owen@krysalis.studio", xp: 1130, tier: 3, earnings: 17800 },
  { id: "u-fatima", name: "Fatima El-Sayed", title: "Data Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "fatima@krysalis.studio", xp: 940, tier: 3, earnings: 12400 },
  { id: "u-viktor", name: "Viktor Hansen", title: "Automation Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "viktor@krysalis.studio", xp: 705, tier: 2, earnings: 9100 },
  { id: "u-grace", name: "Grace Ndlovu", title: "QA Engineer", role: "EMPLOYEE", departmentId: "engineering", email: "grace@krysalis.studio", xp: 410, tier: 2, earnings: 5200 },

  // Design
  { id: "u-aiko", name: "Aiko Tanaka", title: "Design Lead", role: "EMPLOYEE", departmentId: "design", email: "aiko@krysalis.studio", xp: 2380, tier: 4, earnings: 30150 },
  { id: "u-june", name: "June Park", title: "Brand Designer", role: "EMPLOYEE", departmentId: "design", email: "june@krysalis.studio", xp: 1820, tier: 4, earnings: 24700 },
  { id: "u-theo", name: "Theo Marchetti", title: "Product Designer", role: "EMPLOYEE", departmentId: "design", email: "theo@krysalis.studio", xp: 980, tier: 3, earnings: 13900 },
  { id: "u-ines", name: "Ines Castel", title: "UX Researcher", role: "EMPLOYEE", departmentId: "design", email: "ines@krysalis.studio", xp: 560, tier: 2, earnings: 6800 },
  { id: "u-caleb", name: "Caleb Foster", title: "Motion Designer", role: "EMPLOYEE", departmentId: "design", email: "caleb@krysalis.studio", xp: 330, tier: 2, earnings: 4100 },
  { id: "u-noor", name: "Noor Haddad", title: "Junior Designer", role: "EMPLOYEE", departmentId: "design", email: "noor@krysalis.studio", xp: 15, tier: 1, earnings: 0 },

  // Marketing
  { id: "u-sara", name: "Sara Lindqvist", title: "Content Strategist", role: "MODERATOR", departmentId: "marketing", email: "sara@krysalis.studio", xp: 1675, tier: 4, earnings: 19800 },
  { id: "u-hana", name: "Hana Suzuki", title: "Marketing Lead", role: "EMPLOYEE", departmentId: "marketing", email: "hana@krysalis.studio", xp: 1390, tier: 3, earnings: 16500 },
  { id: "u-dmitri", name: "Dmitri Volkov", title: "SEO Specialist", role: "EMPLOYEE", departmentId: "marketing", email: "dmitri@krysalis.studio", xp: 620, tier: 2, earnings: 7300 },
  { id: "u-jonas", name: "Jonas Weber", title: "Performance Marketer", role: "EMPLOYEE", departmentId: "marketing", email: "jonas@krysalis.studio", xp: 540, tier: 2, earnings: 6200 },
  { id: "u-camille", name: "Camille Roux", title: "Copywriter", role: "EMPLOYEE", departmentId: "marketing", email: "camille@krysalis.studio", xp: 760, tier: 3, earnings: 8900 },
  { id: "u-rebecca", name: "Rebecca Otieno", title: "Lifecycle Marketer", role: "EMPLOYEE", departmentId: "marketing", email: "rebecca@krysalis.studio", xp: 480, tier: 2, earnings: 5400 },

  // Operations
  { id: "u-lena", name: "Lena Borowski", title: "Account Manager", role: "EMPLOYEE", departmentId: "operations", email: "lena@krysalis.studio", xp: 1950, tier: 4, earnings: 14200 },
  { id: "u-tomas", name: "Tomás Herrera", title: "Ops Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "tomas@krysalis.studio", xp: 870, tier: 3, earnings: 9800 },
  { id: "u-elias", name: "Elias Vance", title: "Operations Lead", role: "EMPLOYEE", departmentId: "operations", email: "elias@krysalis.studio", xp: 1240, tier: 3, earnings: 11600 },
  { id: "u-martina", name: "Martina Silva", title: "Project Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "martina@krysalis.studio", xp: 690, tier: 2, earnings: 7700 },
  { id: "u-andre", name: "Andre Boateng", title: "Billing Coordinator", role: "EMPLOYEE", departmentId: "operations", email: "andre@krysalis.studio", xp: 230, tier: 1, earnings: 2400 },

  // System users (PRD section 3, item 16)
  { id: "u-shadow", name: "Shadow", title: "Draft agent", role: "USER", departmentId: null, email: "shadow@krysalis.studio", isSystem: true, xp: 0, tier: 1, earnings: 0 },
  { id: "u-gate", name: "Gate", title: "Website relay", role: "USER", departmentId: null, email: "gate@krysalis.studio", isSystem: true, xp: 0, tier: 1, earnings: 0 },

  // Parked account awaiting assignment
  { id: "u-robin", name: "Robin Vale", title: "", role: "USER", departmentId: null, email: "robin@krysalis.studio", xp: 0, tier: 1, earnings: 0 },

  // Client portal users — one per active account (PRD section 10)
  { id: "u-curtis", name: "Curtis Hale", title: "Operations Director, Northbeam Logistics", role: "CLIENT", accountId: "a-northbeam", departmentId: null, email: "curtis@northbeamlogistics.com", xp: 0, tier: 1, earnings: 0 },
  { id: "u-alana", name: "Alana Reyes", title: "Practice Manager, Cassia Health", role: "CLIENT", accountId: "a-cassia", departmentId: null, email: "alana@cassiahealth.com", xp: 0, tier: 1, earnings: 0 },
  { id: "u-margaret", name: "Margaret Ellison", title: "Partner, Fernwell & Co.", role: "CLIENT", accountId: "a-fernwell", departmentId: null, email: "margaret@fernwellco.com", xp: 0, tier: 1, earnings: 0 },
  { id: "u-felix", name: "Felix Grant", title: "Wholesale Manager, Ratio Coffee Roasters", role: "CLIENT", accountId: "a-ratio", departmentId: null, email: "felix@ratiocoffee.com", xp: 0, tier: 1, earnings: 0 },
  { id: "u-ruth", name: "Ruth Calder", title: "Claims Operations Director, Tidegate Insurance", role: "CLIENT", accountId: "a-tidegate", departmentId: null, email: "ruth@tidegateinsurance.com", xp: 0, tier: 1, earnings: 0 },
  { id: "u-mateo", name: "Mateo Vargas", title: "Independent Financial Planner", role: "CLIENT", accountId: "a-vargas", departmentId: null, email: "mateo@vargasplanning.com", xp: 0, tier: 1, earnings: 0 },
];

export const TIER_NAMES: Record<number, string> = {
  1: "Larva",
  2: "Instar",
  3: "Chrysalis",
  4: "Eclosion",
  5: "Imago",
};

export function personById(id: string): MockPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}

export function employeesOf(departmentId: string): MockPerson[] {
  return PEOPLE.filter((p) => p.departmentId === departmentId && !p.isSystem);
}
