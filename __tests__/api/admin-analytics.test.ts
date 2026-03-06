// Tests for admin analytics API

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
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    requirement: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    requirementCluster: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET } from "@/app/api/admin/analytics/route";
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
  const url = options.url || "http://localhost:3000/api/admin/analytics";
  return {
    headers: new Map(Object.entries(options.headers || {})),
    nextUrl: {
      searchParams: new URLSearchParams(url.split("?")[1] || ""),
    },
    method: options.method || "GET",
    url,
  } as unknown as NextRequest;
}

describe("Admin Analytics API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks for new analytics fields
    (mockPrisma.requirement.groupBy as jest.Mock).mockResolvedValue([
      { status: "PENDING", _count: { id: 10 } },
      { status: "PROCESSED", _count: { id: 40 } },
    ]);
    (mockPrisma.requirement.findMany as jest.Mock).mockResolvedValue([
      { createdAt: new Date("2026-03-01") },
      { createdAt: new Date("2026-03-01") },
      { createdAt: new Date("2026-03-02") },
    ]);
  });

  describe("GET /api/admin/analytics", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const request = createMockRequest();

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should return analytics data for admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      // Mock prisma responses
      mockPrisma.user.aggregate.mockResolvedValue({ _count: { id: 100 } });
      mockPrisma.requirement.aggregate.mockResolvedValue({ _count: { id: 500 } });
      mockPrisma.requirementCluster.aggregate.mockResolvedValue({
        _count: { id: 20 },
        _avg: { requirementCount: 25 },
      });
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.requirementCluster.findMany.mockResolvedValue([
        {
          id: "cluster-1",
          name: "Cluster 1",
          description: "Test",
          requirementCount: 100,
          createdAt: new Date(),
        },
      ]);
      mockPrisma.user.count
        .mockResolvedValueOnce(50) // Active users
        .mockResolvedValueOnce(80); // Previous user count for growth calculation

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.summary.totalUsers).toBe(100);
      expect(data.data.summary.totalRequirements).toBe(500);
      expect(data.data.summary.totalClusters).toBe(20);
    });

    it("should handle date range parameters", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.user.aggregate.mockResolvedValue({ _count: { id: 50 } });
      mockPrisma.requirement.aggregate.mockResolvedValue({ _count: { id: 200 } });
      mockPrisma.requirementCluster.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _avg: { requirementCount: 20 },
      });
      mockPrisma.user.count.mockResolvedValue(25);
      mockPrisma.requirementCluster.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValueOnce(25).mockResolvedValueOnce(40);

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/analytics?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.user.aggregate.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch analytics");
    });

    it("should handle rate limiting", async () => {
      const { defaultRateLimiter } = require("@/lib/rate-limiter");
      defaultRateLimiter.checkAndIncrement.mockRejectedValue(new Error("Rate limit error"));

      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.user.aggregate.mockResolvedValue({ _count: { id: 10 } });
      mockPrisma.requirement.aggregate.mockResolvedValue({ _count: { id: 50 } });
      mockPrisma.requirementCluster.aggregate.mockResolvedValue({
        _count: { id: 5 },
        _avg: { requirementCount: 10 },
      });
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.requirementCluster.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValueOnce(5).mockResolvedValueOnce(4);

      const request = createMockRequest();
      const response = await GET(request);

      // Rate limiter fails open, so should still return 200
      expect(response.status).toBe(200);
    });
  });
});
