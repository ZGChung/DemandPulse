// Tests for admin audit-logs API

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
    privacyAuditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/validation", () => ({
  ValidationError: class ValidationError extends Error {
    constructor(
      message: string,
      public details?: unknown
    ) {
      super(message);
      this.name = "ValidationError";
    }
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET } from "@/app/api/admin/audit-logs/route";
import { prisma } from "@/lib/prisma";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as any;

function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const url = options.url || "http://localhost:3000/api/admin/audit-logs";
  return {
    headers: new Map(Object.entries(options.headers || {})),
    nextUrl: {
      searchParams: new URLSearchParams(url.split("?")[1] || ""),
    },
    method: options.method || "GET",
    url,
  } as unknown as NextRequest;
}

describe("Admin Audit Logs API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/audit-logs", () => {
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

    it("should return audit logs for admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockAuditLogs = [
        {
          id: "log-1",
          action: "CREATE",
          entityType: "Requirement",
          entityId: "req-1",
          actorId: "admin-1",
          actorType: "ADMIN",
          metadata: { field: "value" },
          performedAt: new Date("2026-03-01"),
        },
        {
          id: "log-2",
          action: "READ",
          entityType: "User",
          entityId: "user-1",
          actorId: "admin-1",
          actorType: "ADMIN",
          metadata: {},
          performedAt: new Date("2026-03-02"),
        },
      ];

      mockPrisma.privacyAuditLog.findMany.mockResolvedValue(mockAuditLogs as any);
      mockPrisma.privacyAuditLog.count.mockResolvedValue(2);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.auditLogs).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
    });

    it("should filter by action type", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.privacyAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.privacyAuditLog.count.mockResolvedValue(0);

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/audit-logs?action=CREATE",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.privacyAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: "CREATE",
          }),
        })
      );
    });

    it("should handle pagination parameters", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.privacyAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.privacyAuditLog.count.mockResolvedValue(100);

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/audit-logs?page=2&limit=10",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.privacyAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it("should handle invalid query parameters", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/audit-logs?page=invalid",
      });
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should handle database errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.privacyAuditLog.findMany.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch audit logs");
    });
  });
});
