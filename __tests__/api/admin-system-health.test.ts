// Tests for admin system-health API

jest.mock("@/lib/rate-limiter", () => ({
  defaultRateLimiter: {
    checkAndIncrement: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/env", () => ({
  env: {
    rateLimitMaxRequests: () => 100,
    rateLimitWindowMs: () => 60000,
  },
}));

jest.mock("@/lib/logger", () => ({
  apiLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn().mockResolvedValue(10),
    },
    requirement: {
      count: jest.fn().mockResolvedValue(50),
    },
    requirementCluster: {
      count: jest.fn().mockResolvedValue(5),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statfs: jest.fn().mockResolvedValue({
    bsize: 4096,
    blocks: 1000000,
    bavail: 500000,
  }),
}));

jest.mock("fs/promises", () => ({
  statfs: jest.fn().mockResolvedValue({
    bsize: 4096,
    blocks: 1000000,
    bavail: 500000,
  }),
}));

jest.mock("os", () => ({
  totalmem: jest.fn().mockReturnValue(16 * 1024 * 1024 * 1024), // 16GB
  freemem: jest.fn().mockReturnValue(8 * 1024 * 1024 * 1024), // 8GB
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET } from "@/app/api/admin/system-health/route";
import { prisma } from "@/lib/prisma";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.MockedObject<typeof prisma>;

function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const url = options.url || "http://localhost:3000/api/admin/system-health";
  return {
    headers: new Map(Object.entries(options.headers || {})),
    nextUrl: {
      searchParams: new URLSearchParams(url.split("?")[1] || ""),
    },
    method: options.method || "GET",
    url,
  } as unknown as NextRequest;
}

describe("GET /api/admin/system-health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 403 when user is not admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", role: "USER", email: "user@test.com" },
    });

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ error: "Admin access required" });
  });

  it("should return system health data when admin is authenticated", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });

    mockPrisma.user.count.mockResolvedValue(10);
    mockPrisma.requirement.count.mockResolvedValue(50);
    mockPrisma.requirementCluster.count.mockResolvedValue(5);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("overallStatus");
    expect(data.data).toHaveProperty("systemInfo");
    expect(data.data).toHaveProperty("checks");
    expect(data.data.checks).toHaveProperty("database");
    expect(data.data.checks).toHaveProperty("disk");
    expect(data.data.checks).toHaveProperty("memory");
    expect(data.data.checks).toHaveProperty("files");
    expect(data.data.checks).toHaveProperty("externalServices");
  });

  it("should include correct system info", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.systemInfo).toHaveProperty("nodeVersion");
    expect(data.data.systemInfo).toHaveProperty("platform");
    expect(data.data.systemInfo).toHaveProperty("arch");
    expect(data.data.systemInfo).toHaveProperty("uptime");
    expect(data.data.systemInfo).toHaveProperty("environment");
    expect(data.data.systemInfo).toHaveProperty("appVersion");
    expect(data.data.systemInfo).toHaveProperty("timestamp");
  });

  it("should include database stats", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });

    mockPrisma.user.count.mockResolvedValue(42);
    mockPrisma.requirement.count.mockResolvedValue(100);
    mockPrisma.requirementCluster.count.mockResolvedValue(15);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.checks.database.stats).toEqual({
      users: 42,
      requirements: 100,
      clusters: 15,
    });
  });

  it("should handle database errors gracefully", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });

    mockPrisma.user.count.mockRejectedValue(new Error("Database connection failed"));

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.checks.database.status).toBe("unhealthy");
    expect(data.data.checks.database).toHaveProperty("error");
  });

  it("should check critical files", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
    });

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.checks.files).toHaveProperty("status");
    expect(data.data.checks.files).toHaveProperty("files");
    expect(Array.isArray(data.data.checks.files.files)).toBe(true);
  });
});
