import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

// Log DATABASE_URL for debugging (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
}

// Simplified Prisma client configuration
// For SQLite: use library engine with default configuration
// For PostgreSQL with Prisma Data Platform: use accelerateUrl
const databaseUrl = process.env.DATABASE_URL || "";

// Default configuration
let prismaConfig: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Configure based on database URL
if (databaseUrl.startsWith("file:")) {
  // SQLite database - use library engine
  console.log("Using SQLite database");
  // For Prisma 7.3.0 with SQLite, we need to use the library engine
  // The engineType is set in schema.prisma to "library"
  // No additional configuration needed
} else if (databaseUrl.includes("prisma+postgres://")) {
  // Prisma Data Platform
  console.log("Using Prisma Data Platform with accelerateUrl");
  prismaConfig.accelerateUrl = databaseUrl;
} else if (databaseUrl.startsWith("postgresql://")) {
  // Standard PostgreSQL - would need adapter
  console.log("Using PostgreSQL - adapter would be required");
  // In production, you would need to set up adapter
  // For now, we'll use a mock or throw an error
}

// During build, skip Prisma client initialization to avoid adapter errors
const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (process.env.NODE_ENV === "production" &&
    typeof window === "undefined" &&
    process.env.DATABASE_URL?.startsWith("file:") === false);

export const prisma = globalForPrisma.prisma ?? (isBuild ? null : new PrismaClient(prismaConfig));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
