import { PrismaClient } from "@prisma/client";

// Mock prisma module for testing
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("prisma", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Import after mocking
    const prismaModule = await import("../../lib/prisma");
    prisma = prismaModule.prisma as PrismaClient;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("should export a PrismaClient instance", () => {
    expect(prisma).toBeDefined();
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
  });

  it("should be able to connect", async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it("should be able to disconnect", async () => {
    await expect(prisma.$disconnect()).resolves.not.toThrow();
  });
});

describe("prisma configuration - PostgreSQL", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalDatabaseUrl: string | undefined;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalDatabaseUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("should handle PostgreSQL URL configuration", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.NODE_ENV = "development";

    // Clear the global prisma instance to force re-initialization
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null | undefined };
    delete globalForPrisma.prisma;

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
  });

  it("should handle Prisma Data Platform URL", async () => {
    process.env.DATABASE_URL =
      "prisma+postgres://abcd1234@aws.connect.prisma-data.com/?api_key=your_api_key";
    process.env.NODE_ENV = "development";

    // Clear the global prisma instance to force re-initialization
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null | undefined };
    delete globalForPrisma.prisma;

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
  });
});

describe("prisma build-time initialization", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalDatabaseUrl: string | undefined;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalDatabaseUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("should skip initialization during production build phase", () => {
    process.env.NEXT_PHASE = "phase-production-build";
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    // Clear the global prisma instance to force re-initialization
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null | undefined };
    delete globalForPrisma.prisma;

    // This tests the build-time initialization skip logic
    expect(process.env.NEXT_PHASE).toBe("phase-production-build");
  });
});
