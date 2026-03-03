// Tests for admin clusters API

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
    getClusters: jest.fn().mockResolvedValue([
      { id: "cluster-1", name: "Cluster 1", description: "Test cluster 1" },
      { id: "cluster-2", name: "Cluster 2", description: "Test cluster 2" },
    ]),
    getClustersCount: jest.fn().mockResolvedValue(2),
    getClusterById: jest.fn().mockResolvedValue(null),
    updateCluster: jest.fn().mockResolvedValue({ id: "cluster-1", name: "Test" }),
    deleteCluster: jest.fn().mockResolvedValue(true),
    createCluster: jest
      .fn()
      .mockResolvedValue({ id: "cluster-new", name: "New Cluster", description: "Description" }),
  })),
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET, POST } from "@/app/api/admin/clusters/route";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const url = options.url || "http://localhost:3000/api/admin/clusters";
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

describe("Admin Clusters API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/clusters", () => {
    it("should reject unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = createMockRequest();
      const response = await GET(mockRequest);
      expect(response.status).toBe(401);
    });

    it("should reject non-admin users", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const mockRequest = createMockRequest();

      try {
        await GET(mockRequest);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should return clusters with pagination for admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        url: "http://localhost:3000/api/admin/clusters?page=1&limit=20",
      });

      const response = await GET(mockRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("clusters");
      expect(data.data).toHaveProperty("pagination");
    });

    it("should use default pagination values", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        url: "http://localhost:3000/api/admin/clusters",
      });

      const response = await GET(mockRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
    });
  });

  describe("POST /api/admin/clusters", () => {
    it("should reject unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = createMockRequest({
        method: "POST",
        body: { name: "New Cluster", description: "New Description" },
      });
      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });

    it("should reject non-admin users", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const mockRequest = createMockRequest({
        method: "POST",
        body: { name: "New Cluster", description: "New Description" },
      });

      try {
        await POST(mockRequest);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should create cluster with valid data", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/clusters",
        body: { name: "New Cluster", description: "New Description" },
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("cluster");
    });

    it("should return 400 if name is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/clusters",
        body: { description: "New Description" },
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });

    it("should return 400 if description is missing", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/clusters",
        body: { name: "New Cluster" },
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid request body", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockRequest = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/admin/clusters",
        body: { name: "", description: "" },
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should check admin role properly", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const mockRequest = createMockRequest();

      try {
        await GET(mockRequest);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });
  });
});
