import { prisma } from "@/lib/db";

/** Settings reads (PRD 7.9): the user matrix, the info-bar rows (active and
 *  not), and the guide markdown — for MODERATOR/ADMIN tiers. */

export interface MatrixRow {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
  onboardingPending: boolean;
}

export interface InfoBarRow {
  id: string;
  text: string;
  href: string | null;
  isActive: boolean;
  order: number;
}

export async function userMatrix(): Promise<{
  people: MatrixRow[];
  departments: { id: string; name: string }[];
}> {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { isSystem: false },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        onboardingCompletedAt: true,
      },
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    people: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      onboardingPending: u.role !== "CLIENT" && u.role !== "USER" && u.onboardingCompletedAt === null,
    })),
    departments,
  };
}

export async function infoBarRows(): Promise<InfoBarRow[]> {
  return prisma.infoBarMessage.findMany({
    orderBy: { order: "asc" },
    select: { id: true, text: true, href: true, isActive: true, order: true },
  });
}

export async function guideMarkdown(): Promise<string> {
  const guide = await prisma.portalGuide.findUnique({
    where: { id: "main" },
    select: { markdown: true },
  });
  return guide?.markdown ?? "";
}
