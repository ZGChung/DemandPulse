import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log DATABASE_URL for debugging (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
}

// Simplified Prisma client configuration
// For SQLite: use default configuration
// For PostgreSQL with Prisma Data Platform: use accelerateUrl
const databaseUrl = process.env.DATABASE_URL || "";

// Default configuration for SQLite
let prismaConfig: any = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Configure based on database URL
if (databaseUrl.startsWith("file:")) {
  // SQLite database
  prismaConfig.adapter = "sqlite";
} else if (databaseUrl.includes("prisma+postgres://")) {
  // Prisma Data Platform
  console.log("Using Prisma Data Platform with accelerateUrl");
  prismaConfig.accelerateUrl = databaseUrl;
} else if (databaseUrl.startsWith("postgresql://")) {
  // Standard PostgreSQL
  prismaConfig.adapter = "postgresql";
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;