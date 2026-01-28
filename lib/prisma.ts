import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log DATABASE_URL for debugging (remove in production)
if (process.env.NODE_ENV === "development") {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;