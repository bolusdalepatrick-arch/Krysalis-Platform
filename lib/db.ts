import { PrismaClient } from "@prisma/client";

/** Prisma client singleton (PRD section 8) — survives Next.js dev reloads. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
