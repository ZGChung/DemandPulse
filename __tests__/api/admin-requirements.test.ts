// Tests for admin requirements API

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

jest.mock("@/services/database-service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getRequirementsForAdmin: jest.fn().mockResolvedValue([
      { id: "req-1", status: "PENDING", userId: "user-1", text: "Requirement 1" },
      { id: "req-2", status: "PROCESSED", userId: "user-2", text: "Requirement 2" },
    ]),
    getRequirementsCountForAdmin: jest.fn().mockResolvedValue(2),
    updateRequirementStatus: jest.fn().mockResolvedValue({
      id: "req-1",
      status: "PROCESSED",
      userId: "user-1",
      text: "Requirement 1",
    }),
  })),
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET, PATCH } from "@/app/api/admin/requirements/route";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const url = options.url || "http://localhost:3000/api/admin/requirements";
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

describe("Admin Requirements API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/requirements", () => {
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

    it("should return requirements for admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/requirements?page=1&limit=50",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("requirements");
      expect(data.data).toHaveProperty("pagination");
    });

    it("should filter by status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/requirements?status=PENDING",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("should filter by userId", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        url: "http://localhost:3000/api/admin/requirements?userId=user-1",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
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

  describe("PATCH /api/admin/requirements", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/requirements?requirementId=req-1",
        body: { status: "PROCESSED" },
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
        url: "http://localhost:3000/api/admin/requirements?requirementId=req-1",
        body: { status: "PROCESSED" },
      });

      try {
        await PATCH(request);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should return 400 if requirementId is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/requirements",
        body: { status: "PROCESSED" },
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
        url: "http://localhost:3000/api/admin/requirements?requirementId=req-1",
        body: { status: "INVALID" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(400);
    });

    it("should update requirement status", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "PATCH",
        url: "http://localhost:3000/api/admin/requirements?requirementId=req-1",
        body: { status: "PROCESSED" },
      });

      const response = await PATCH(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("requirement");
    });
  });
});
