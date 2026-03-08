import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

const databaseUrl = process.env.DATABASE_URL || "";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

function createPrismaClient(): PrismaClient | null {
  if (isBuild || !databaseUrl.trim()) return null;

  const logLevel: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

  // Prisma 7 with engine type "client" requires adapter or accelerateUrl
  if (databaseUrl.includes("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl, log: logLevel });
  }

  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    // PostgreSQL: use @prisma/adapter-pg (required in Prisma 7 for serverless/Vercel)
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");
    // Use verify-full to avoid pg driver warning about sslmode=require/prefer/verify-ca in future pg v9
    const connectionString = databaseUrl.replace(
      /([?&])sslmode=(require|prefer|verify-ca)(&|$)/gi,
      (_, p, __, end) => `${p}sslmode=verify-full${end}`
    );
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: logLevel } as Prisma.PrismaClientOptions);
  }

  // Schema is now PostgreSQL-only; file:/SQLite not supported with this client
  return null;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
