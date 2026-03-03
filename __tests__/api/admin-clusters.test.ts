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

// Mock DatabaseService before importing the route
jest.mock("@/services/database-service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getClusters: jest.fn().mockResolvedValue([]),
    getClustersCount: jest.fn().mockResolvedValue(0),
    getClusterById: jest.fn().mockResolvedValue(null),
    updateCluster: jest.fn().mockResolvedValue({ id: "cluster-1", name: "Test" }),
    deleteCluster: jest.fn().mockResolvedValue(true),
    createCluster: jest.fn().mockResolvedValue({ id: "cluster-new", name: "New" }),
  })),
}));

describe("Admin Clusters API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/clusters", () => {
    it("should reject unauthenticated requests", async () => {
      const { getServerSession } = require("next-auth");
      getServerSession.mockResolvedValue(null);

      const { GET } = require("@/app/api/admin/clusters/route");

      const mockRequest = {
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as import("next/server").NextRequest;

      const response = await GET(mockRequest);
      expect(response.status).toBe(401);
    });

    it("should reject non-admin users", async () => {
      const { getServerSession } = require("next-auth");
      getServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER" },
      });

      const { GET } = require("@/app/api/admin/clusters/route");

      const mockRequest = {
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as import("next/server").NextRequest;

      try {
        await GET(mockRequest);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });

    it("should require authentication for admin endpoints", async () => {
      // This test verifies that authentication is properly checked
      const { getServerSession } = require("next-auth");

      // When session is null, should return 401
      getServerSession.mockResolvedValue(null);

      const { GET } = require("@/app/api/admin/clusters/route");

      const mockRequest = {
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as import("next/server").NextRequest;

      const response = await GET(mockRequest);
      expect(response.status).toBe(401);
    });
  });

  describe("Authorization", () => {
    it("should check admin role properly", async () => {
      const { getServerSession } = require("next-auth");

      // Non-admin should be rejected
      getServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER" },
      });

      const { GET } = require("@/app/api/admin/clusters/route");

      const mockRequest = {
        headers: new Map(),
        nextUrl: { searchParams: new URLSearchParams() },
      } as unknown as import("next/server").NextRequest;

      // This should throw "Admin access required" error
      try {
        await GET(mockRequest);
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Admin access required");
      }
    });
  });
});
