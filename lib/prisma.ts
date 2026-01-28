import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log DATABASE_URL for debugging (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
}

// For Prisma 7.3.0, we need to handle different configurations
// For SQLite: use file: URL
// For PostgreSQL: use regular connection string
const prismaConfig: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Check if we're using SQLite
const databaseUrl = process.env.DATABASE_URL || "";
if (databaseUrl.startsWith("file:")) {
  // SQLite - use default config
  console.log("Using SQLite database");
} else if (databaseUrl.includes("prisma+postgres://")) {
  // Prisma Data Platform - requires accelerateUrl
  console.log("Using Prisma Data Platform");
  prismaConfig.accelerateUrl = databaseUrl;
} else if (databaseUrl.startsWith("postgresql://")) {
  // Regular PostgreSQL
  console.log("Using PostgreSQL database");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;