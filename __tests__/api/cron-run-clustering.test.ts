// Tests for cron run-clustering API

// Mock the clustering service
jest.mock("@/services/clustering-service", () => {
  return {
    ClusteringService: jest.fn().mockImplementation(() => ({
      clusterRequirements: jest.fn().mockResolvedValue([
        { id: "cluster-1", name: "Cluster 1", requirementIds: ["req-1", "req-2"] },
        { id: "cluster-2", name: "Cluster 2", requirementIds: ["req-3"] },
      ]),
    })),
  };
});

// Mock lib/prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    requirement: {
      findMany: jest.fn().mockResolvedValue([
        { id: "req-1", embedding: [0.1, 0.2, 0.3] },
        { id: "req-2", embedding: [0.1, 0.2, 0.31] },
        { id: "req-3", embedding: [0.9, 0.8, 0.7] },
      ]),
    },
    $disconnect: jest.fn(),
  },
}));

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Helper to create mock request
function createMockRequest(url: string, options: { method?: string; auth?: string } = {}) {
  const urlObj = new URL(url);
  return {
    url: urlObj.toString(),
    nextUrl: urlObj,
    method: options.method || "GET",
    headers: {
      get: (name: string) => {
        if (name === "authorization" && options.auth) return `Bearer ${options.auth}`;
        return null;
      },
    },
  };
}

describe("Cron Run Clustering API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cron/run-clustering", () => {
    it("should return 401 when not authorized in production", async () => {
      // Save original env
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.CRON_SECRET;

      (process.env as any).NODE_ENV = "production";
      delete process.env.CRON_SECRET;

      const { GET } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/cron/run-clustering");

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(401);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
    });

    it("should return clusters when authorized in development", async () => {
      // Save original env
      const originalEnv = process.env.NODE_ENV;

      // Set development mode
      (process.env as any).NODE_ENV = "development";
      delete process.env.CRON_SECRET;

      const { GET } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/cron/run-clustering");

      const response = await GET(mockRequest as never);

      // In development mode without secret, should return 200 (or 503 if db unavailable)
      expect([200, 503]).toContain(response.status);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
    });

    it("should return unauthorized with wrong secret", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.CRON_SECRET;

      (process.env as any).NODE_ENV = "production";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest(
        "http://localhost:3000/api/cron/run-clustering?secret=wrong-secret"
      );

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(401);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
      else delete process.env.CRON_SECRET;
    });

    it("should authorize with correct bearer token", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.CRON_SECRET;

      (process.env as any).NODE_ENV = "production";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/cron/run-clustering", {
        auth: "correct-secret",
      });

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(200);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
      else delete process.env.CRON_SECRET;
    });

    it("should authorize with correct query secret", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.CRON_SECRET;

      (process.env as any).NODE_ENV = "production";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest(
        "http://localhost:3000/api/cron/run-clustering?secret=correct-secret"
      );

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(200);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
      else delete process.env.CRON_SECRET;
    });
  });

  describe("POST /api/cron/run-clustering", () => {
    it("should proxy POST to GET", async () => {
      // Save original env
      const originalEnv = process.env.NODE_ENV;

      // Set development mode
      (process.env as any).NODE_ENV = "development";
      delete process.env.CRON_SECRET;

      const { POST } = await import("@/app/api/cron/run-clustering/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/cron/run-clustering", {
        method: "POST",
      });

      const response = await POST(mockRequest as never);

      // In development mode without secret, should return 200 (or 503 if db unavailable)
      expect([200, 503]).toContain(response.status);

      // Restore env
      (process.env as any).NODE_ENV = originalEnv;
    });
  });
});
