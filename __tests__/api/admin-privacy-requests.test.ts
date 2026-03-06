// Tests for admin privacy-requests API

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
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    dataDeletionQueue: {
      findMany: jest.fn().mockResolvedValue([
        { id: "req-1", status: "PENDING", entityType: "user", entityId: "user-1" },
        { id: "req-2", status: "COMPLETED", entityType: "user", entityId: "user-2" },
      ]),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn().mockResolvedValue({
        id: "req-1",
        status: "COMPLETED",
        entityType: "user",
        entityId: "user-1",
      }),
    },
    privacyAuditLog: {
      create: jest.fn().mockResolvedValue({ id: "log-1" }),
    },
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET, PATCH } from "@/app/api/admin/privacy-requests/route";
import { prisma } from "@/lib/prisma";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as any;

function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const url = options.url || "http://localhost:3000/api/admin/privacy-requests";
  return {
    headers: new Map(Object.entries(options.headers || {})),
    nextUrl: {
      searchParams: new URLSearchParams(url.split("?")[1] || ""),
    },
    method: options.method || "GET",
    url,
    json: async () => options.body || {},
  } as unknown as NextRequest;
}

describe("Admin Privacy-Requests API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/privacy-requests", () => {
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

    it("should return privacy requests for admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/privacy-requests?page=1&limit=50",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("privacyRequests");
      expect(data.data).toHaveProperty("pagination");
    });

    it("should filter by status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/privacy-requests?status=PENDING",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("should filter by entityType", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/privacy-requests?entityType=user",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/privacy-requests?status=INVALID",
      });

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("should use default pagination values", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest();

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(50);
    });
  });

  describe("PATCH /api/admin/privacy-requests", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests?requestId=req-1",
        body: { status: "COMPLETED" },
      });
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests?requestId=req-1",
        body: { status: "COMPLETED" },
      });

      try {
        await PATCH(request);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should return 400 if requestId is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests",
        body: { status: "COMPLETED" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests?requestId=req-1",
        body: { status: "INVALID" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("should update privacy request status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests?requestId=req-1",
        body: { status: "COMPLETED", notes: "Processed successfully" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalled();
    });

    it("should return 404 if privacy request not found", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      mockPrisma.dataDeletionQueue.update.mockRejectedValue({ code: "P2025" });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/privacy-requests?requestId=non-existent",
        body: { status: "COMPLETED" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(404);
    });
  });
});
