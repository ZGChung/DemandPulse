// Tests for public clusters API

// Mock the database service
jest.mock("@/services/database-service", () => {
  return {
    DatabaseService: jest.fn().mockImplementation(() => ({
      getClusters: jest.fn().mockResolvedValue([
        { id: "cluster-1", name: "Cluster 1", count: 10 },
        { id: "cluster-2", name: "Cluster 2", count: 5 },
      ]),
      getPublicStatistics: jest.fn().mockResolvedValue({
        totalClusters: 2,
        totalRequirements: 100,
        activeUsers: 50,
      }),
    })),
  };
});

// Mock cache
jest.mock("@/lib/cache", () => ({
  cacheGet: jest.fn().mockReturnValue(null),
  cacheSet: jest.fn(),
  cacheKey: jest.fn((...args: unknown[]) => args.join(":")),
}));

// Mock lib/prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $disconnect: jest.fn(),
  },
}));

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Helper to create mock request with URL
function createMockRequest(url: string) {
  const urlObj = new URL(url);
  return {
    url: urlObj.toString(),
    nextUrl: urlObj,
    method: "GET",
    headers: { get: () => null },
  };
}

describe("Clusters API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/clusters", () => {
    it("should return clusters with pagination", async () => {
      const { GET } = await import("@/app/api/clusters/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/clusters?limit=10&offset=0");

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(200);

      const body = await (response as { json: () => Promise<Record<string, unknown>> }).json();
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("pagination");
    });

    it("should return 400 for invalid limit parameter", async () => {
      const { GET } = await import("@/app/api/clusters/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/clusters?limit=invalid");

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(400);
    });

    it("should return 400 for limit exceeding max", async () => {
      const { GET } = await import("@/app/api/clusters/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/clusters?limit=200");

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(400);
    });

    it("should use default values when not provided", async () => {
      const { GET } = await import("@/app/api/clusters/route");
      const mockRequest = createMockRequest("http://localhost:3000/api/clusters");

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(200);

      const body = await (response as { json: () => Promise<Record<string, unknown>> }).json();
      expect(body).toHaveProperty("pagination");
    });
  });
});
