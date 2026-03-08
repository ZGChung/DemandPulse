describe("prisma", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    delete (globalThis as unknown as { prisma?: unknown }).prisma;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should export a PrismaClient instance when DATABASE_URL is postgres", async () => {
    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
    expect(typeof (prisma as { $connect?: unknown }).$connect).toBe("function");
    expect(typeof (prisma as { $disconnect?: unknown }).$disconnect).toBe("function");
  });

  it("should be able to connect", async () => {
    const { prisma } = await import("../../lib/prisma");
    if (prisma) {
      await expect(prisma.$connect()).resolves.not.toThrow();
    }
  });

  it("should be able to disconnect", async () => {
    const { prisma } = await import("../../lib/prisma");
    if (prisma) {
      await expect(prisma.$disconnect()).resolves.not.toThrow();
    }
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
    delete (globalThis as unknown as { prisma?: unknown }).prisma;
  });

  it("should create client for PostgreSQL URL", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });

  it("should create client for Prisma Data Platform URL", async () => {
    process.env.DATABASE_URL =
      "prisma+postgres://abcd1234@aws.connect.prisma-data.com/?api_key=your_api_key";

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });
});

describe("prisma build-time initialization", () => {
  it("should skip initialization during production build phase", async () => {
    const prevPhase = process.env.NEXT_PHASE;
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NEXT_PHASE = "phase-production-build";
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    delete (globalThis as unknown as { prisma?: unknown }).prisma;
    jest.resetModules();
    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeNull();
    process.env.NEXT_PHASE = prevPhase;
    process.env.NODE_ENV = prevNodeEnv;
  });
});

describe("prisma - schema is PostgreSQL only", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete (globalThis as unknown as { prisma?: unknown }).prisma;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null for file: URL (SQLite not supported with current schema)", async () => {
    process.env.DATABASE_URL = "file:./dev.db";

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeNull();
  });

  it("should return null when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeNull();
  });
});

describe("prisma accelerateUrl configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    delete (globalThis as unknown as { prisma?: unknown }).prisma;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create client for Prisma Data Platform", async () => {
    process.env.DATABASE_URL =
      "prisma+postgres://abcd1234@aws.connect.prisma-data.com/?api_key=test";

    const { prisma } = await import("../../lib/prisma");
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });
});
