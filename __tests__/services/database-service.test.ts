import { DatabaseService } from "@/services/database-service";

// Mock Prisma client
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    requirement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    dataDeletionQueue: {
      create: jest.fn(),
    },
    privacyAuditLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  // Mock PrismaClient constructor that accepts config
  const PrismaClient = jest.fn().mockImplementation((config?: any) => {
    // Store config for verification if needed
    if (config) {
      PrismaClient.lastConfig = config;
    }
    return mockPrisma;
  });

  // Static property to track last config
  PrismaClient.lastConfig = null;

  return {
    PrismaClient,
    RequirementStatus: {
      PENDING: "PENDING",
      PROCESSED: "PROCESSED",
      CLUSTERED: "CLUSTERED",
      DELETED: "DELETED",
    },
    PrivacyAction: {
      CREATE: "CREATE",
      UPDATE: "UPDATE",
      DELETE: "DELETE",
    },
    ActorType: {
      SYSTEM: "SYSTEM",
      USER: "USER",
    },
  };
});

// Mock the lib/prisma module to prevent real PrismaClient initialization
// This needs to be mocked before DatabaseService imports it
jest.mock("@/lib/prisma", () => {
  // Create a mock prisma instance that matches the structure
  const mockPrismaInstance = {
    requirement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    dataDeletionQueue: {
      create: jest.fn(),
    },
    privacyAuditLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    prisma: mockPrismaInstance,
  };
});

describe("DatabaseService", () => {
  let service: DatabaseService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked Prisma instance from lib/prisma mock
    const { prisma } = require("@/lib/prisma");
    mockPrisma = prisma;

    service = new DatabaseService();
  });

  afterEach(async () => {
    await service.disconnect();
  });

  describe("storeRequirement", () => {
    it("should store requirement with consent information", async () => {
      const collectedRequirement = {
        id: "req-123",
        originalRequirement: "Build a login system with 2FA",
        summarizedRequirement: "Build login system",
        context: {
          conversationId: "conv-456",
          workspacePath: "/projects/auth",
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        consent: {
          requirementId: "req-123",
          consentedAt: new Date("2024-01-01T10:01:00Z"),
          consentOptions: {
            dataCollection: true,
            contact: false,
            anonymization: true,
          },
          userProvidedEmail: undefined,
        },
        collectedAt: new Date("2024-01-01T10:02:00Z"),
        status: "pending" as const,
      };

      mockPrisma.requirement.create.mockResolvedValue({
        id: "db-req-123",
      });

      const result = await service.storeRequirement(collectedRequirement);

      expect(result).toBe("db-req-123");
      expect(mockPrisma.requirement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalRequirement: "Build a login system with 2FA",
          summarizedRequirement: "Build login system",
          conversationId: "conv-456",
          workspacePath: "/projects/auth",
          dataCollectionConsent: true,
          contactConsent: false,
          anonymizationConsent: true,
          dataRetentionDays: 365 * 5, // 5 years for anonymized data
          status: "PENDING",
        }),
      });
      expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalled();
    });

    it("should calculate correct retention for non-anonymized data", async () => {
      const collectedRequirement = {
        id: "req-123",
        originalRequirement: "Build a login system",
        summarizedRequirement: "Build login system",
        context: {
          conversationId: "conv-456",
          timestamp: new Date(),
        },
        consent: {
          requirementId: "req-123",
          consentedAt: new Date(),
          consentOptions: {
            dataCollection: true,
            contact: true,
            anonymization: false,
          },
          userProvidedEmail: "user@example.com",
        },
        collectedAt: new Date(),
        status: "pending" as const,
      };

      mockPrisma.requirement.create.mockResolvedValue({ id: "db-req-123" });

      await service.storeRequirement(collectedRequirement);

      expect(mockPrisma.requirement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dataRetentionDays: 365 * 2, // 2 years for data with contact
          }),
        })
      );
    });

    it("should throw error when storage fails", async () => {
      const collectedRequirement = {
        id: "req-123",
        originalRequirement: "Build a system",
        summarizedRequirement: "Build system",
        context: {
          conversationId: "conv-456",
          timestamp: new Date(),
        },
        consent: {
          requirementId: "req-123",
          consentedAt: new Date(),
          consentOptions: {
            dataCollection: true,
            contact: false,
            anonymization: true,
          },
        },
        collectedAt: new Date(),
        status: "pending" as const,
      };

      mockPrisma.requirement.create.mockRejectedValue(new Error("Database error"));

      await expect(service.storeRequirement(collectedRequirement)).rejects.toThrow(
        "Failed to store requirement"
      );
    });
  });

  describe("getRequirement", () => {
    it("should return requirement with privacy controls applied", async () => {
      const mockRequirement = {
        id: "req-123",
        originalRequirement: "Build a login system",
        summarizedRequirement: "Build login system",
        conversationId: "conv-456",
        workspacePath: "/projects/auth",
        dataCollectionConsent: true,
        contactConsent: false,
        anonymizationConsent: true,
        userProvidedEmail: null,
        anonymizedData: {
          summarizedRequirement: "Build login system",
          categories: ["authentication"],
          wordCount: 4,
        },
      };

      mockPrisma.requirement.findUnique.mockResolvedValue(mockRequirement);

      const result = await service.getRequirement("req-123");

      expect(result).toEqual(
        expect.objectContaining({
          id: "req-123",
          originalRequirement: "[ANONYMIZED]",
          summarizedRequirement: "Build login system",
          conversationId: "[ANONYMIZED]",
          workspacePath: "[ANONYMIZED]",
          dataCollectionConsent: true,
          contactConsent: false,
          anonymizationConsent: true,
          userProvidedEmail: null,
          categories: ["authentication"],
          wordCount: 4,
        })
      );
    });

    it("should return null for non-existent requirement", async () => {
      mockPrisma.requirement.findUnique.mockResolvedValue(null);

      const result = await service.getRequirement("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getRequirementsByStatus", () => {
    it("should return requirements with privacy controls", async () => {
      const mockRequirements = [
        {
          id: "req-1",
          originalRequirement: "Build system A",
          anonymizationConsent: true,
          anonymizedData: { summarizedRequirement: "Build system A" },
        },
        {
          id: "req-2",
          originalRequirement: "Build system B",
          anonymizationConsent: false,
          anonymizedData: null,
        },
      ];

      mockPrisma.requirement.findMany.mockResolvedValue(mockRequirements);

      const results = await service.getRequirementsByStatus("PENDING", 10);

      expect(results).toHaveLength(2);
      expect(results[0].originalRequirement).toBe("[ANONYMIZED]");
      expect(results[1].originalRequirement).toBe("Build system B");
    });
  });

  describe("updateRequirementStatus", () => {
    it("should update status and log action", async () => {
      const updatedRequirement = {
        id: "req-123",
        status: "PROCESSED",
      };

      mockPrisma.requirement.update.mockResolvedValue(updatedRequirement);

      const result = await service.updateRequirementStatus("req-123", "PROCESSED");

      expect(result).toEqual(updatedRequirement);
      expect(mockPrisma.requirement.update).toHaveBeenCalledWith({
        where: { id: "req-123" },
        data: {
          status: "PROCESSED",
          processedAt: expect.any(Date),
        },
      });
      expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalled();
    });
  });

  describe("deleteRequirement", () => {
    it("should add to deletion queue and mark as deleted", async () => {
      const deletedRequirement = {
        id: "req-123",
        status: "DELETED",
      };

      mockPrisma.dataDeletionQueue.create.mockResolvedValue({});
      mockPrisma.requirement.update.mockResolvedValue(deletedRequirement);

      const result = await service.deleteRequirement("req-123", "User request", "user-456");

      expect(result).toEqual(deletedRequirement);
      expect(mockPrisma.dataDeletionQueue.create).toHaveBeenCalled();
      expect(mockPrisma.requirement.update).toHaveBeenCalledWith({
        where: { id: "req-123" },
        data: {
          status: "DELETED",
          scheduledDeletionAt: expect.any(Date),
        },
      });
      expect(mockPrisma.privacyAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorType: "USER",
            reason: "Requirement deleted: User request",
          }),
        })
      );
    });
  });

  describe("getStatistics", () => {
    it("should return statistics", async () => {
      mockPrisma.requirement.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(50) // processed
        .mockResolvedValueOnce(30) // clustered
        .mockResolvedValueOnce(10) // with contact consent
        .mockResolvedValueOnce(40); // with anonymization

      const stats = await service.getStatistics();

      expect(stats).toEqual({
        totalRequirements: 100,
        byStatus: {
          pending: 20,
          processed: 50,
          clustered: 30,
        },
        privacyMetrics: {
          withContactConsent: 10,
          withAnonymization: 40,
        },
      });
    });
  });

  describe("processScheduledDeletions", () => {
    it("should process requirements scheduled for deletion", async () => {
      const requirementsToDelete = [{ id: "req-1" }, { id: "req-2" }];

      mockPrisma.requirement.findMany.mockResolvedValue(requirementsToDelete);
      mockPrisma.requirement.update.mockResolvedValue({});

      const count = await service.processScheduledDeletions();

      expect(count).toBe(2);
      expect(mockPrisma.dataDeletionQueue.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.requirement.update).toHaveBeenCalledTimes(2);
    });
  });
});
