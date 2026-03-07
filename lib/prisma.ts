import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

const databaseUrl = process.env.DATABASE_URL || "";
// Only skip creating the client during Next.js build (no DB available). At Vercel runtime we need the client.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

function createPrismaClient(): PrismaClient | null {
  if (isBuild || !databaseUrl.trim()) return null;

  const logLevel: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

  if (databaseUrl.startsWith("file:")) {
    // SQLite — requires adapter in Prisma 7
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const dbPath = databaseUrl.replace("file:", "").replace("./", "prisma/");
    const sqlite = new Database(dbPath);
    const adapter = new PrismaBetterSqlite3(sqlite);
    return new PrismaClient({ adapter, log: logLevel } as Prisma.PrismaClientOptions);
  }

  if (databaseUrl.includes("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl, log: logLevel });
  }

  // Standard PostgreSQL — works natively with Prisma 7 client engine
  return new PrismaClient({ log: logLevel });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
