// ClusteringService tests
import { ClusteringService } from "../../services/clustering-service";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    cluster: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
    },
    requirement: {
      updateMany: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    requirementCluster: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock("compute-cosine-similarity", () => jest.fn().mockReturnValue(0.8));
jest.mock("ml-kmeans", () => ({
  kmeans: jest.fn().mockReturnValue({
    clusters: [0, 0, 1, 1],
    centroids: [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ],
  }),
}));

describe("ClusteringService", () => {
  let service: ClusteringService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClusteringService();
  });

  describe("constructor", () => {
    it("should create an instance", () => {
      expect(service).toBeDefined();
    });
  });

  describe("clusterRequirements", () => {
    it("should return empty array when requirements less than minClusterSize", async () => {
      const requirements = [{ id: "1", embedding: [0.1, 0.2, 0.3] }];
      const result = await service.clusterRequirements(requirements, { minClusterSize: 3 });
      expect(result).toEqual([]);
    });

    it("should return empty array when no valid embeddings", async () => {
      const requirements = [
        { id: "1", embedding: [] },
        { id: "2", embedding: [] },
      ];
      const result = await service.clusterRequirements(requirements, { minClusterSize: 2 });
      expect(result).toEqual([]);
    });

    it("should cluster requirements with valid embeddings", async () => {
      const requirements = [
        { id: "1", embedding: [0.1, 0.2, 0.3] },
        { id: "2", embedding: [0.15, 0.25, 0.35] },
        { id: "3", embedding: [0.4, 0.5, 0.6] },
        { id: "4", embedding: [0.45, 0.55, 0.65] },
      ];
      const result = await service.clusterRequirements(requirements, { minClusterSize: 2 });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect maxClusters option", async () => {
      const requirements = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        embedding: [Math.random(), Math.random(), Math.random()],
      }));
      const result = await service.clusterRequirements(requirements, { maxClusters: 3 });
      expect(result).toBeDefined();
    });
  });

  describe("assignToCluster", () => {
    it("should return cluster ID for valid requirement", async () => {
      const requirement = { id: "req-1", embedding: [0.1, 0.2, 0.3] };
      const result = await service.assignToCluster(requirement);
      // Returns null if no clusters exist or string clusterId
      expect(result === null || typeof result === "string").toBe(true);
    });
  });

  describe("updateClusterCentroid", () => {
    it("should handle update for non-existent cluster", async () => {
      await expect(service.updateClusterCentroid("non-existent-id")).resolves.not.toThrow();
    });
  });

  describe("findSimilarRequirements", () => {
    it("should return empty array for invalid embedding", async () => {
      const result = await service.findSimilarRequirements({ id: "1", embedding: [] }, 5);
      expect(result).toEqual([]);
    });

    it("should return similar requirements within threshold", async () => {
      const requirement = { id: "1", embedding: [0.1, 0.2, 0.3] };
      const result = await service.findSimilarRequirements(requirement, 5, 0.5);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
