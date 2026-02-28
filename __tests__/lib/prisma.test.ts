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
