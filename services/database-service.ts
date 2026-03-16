import {
  PrismaClient,
  RequirementStatus,
  RequirementCluster,
  PrivacyAction,
  ActorType,
} from "@prisma/client";

import { encryptionService } from "@/lib/encryption";
import { dbLogger } from "@/lib/logger";
import { maskRequirementsForAdmin, canViewUnmaskedData } from "@/lib/masking";
import { prisma } from "@/lib/prisma";
import { CollectedRequirement } from "@/types/claude-code";

// Prisma Requirement type - defined inline to avoid build-time null issues
interface PrismaRequirement {
  id: string;
  originalRequirement: string;
  summarizedRequirement: string;
  embedding?: unknown;
  conversationId: string;
  workspacePath?: string | null;
  detectedAt: Date;
  dataCollectionConsent: boolean;
  contactConsent: boolean;
  anonymizationConsent: boolean;
  userProvidedEmail?: string | null;
  consentedAt?: Date | null;
  userId?: string | null;
  status: RequirementStatus;
  processedAt?: Date | null;
  anonymizedData?: unknown; // Prisma JsonValue can be string | number | boolean | null | JSONArray | JSONObject
  dataRetentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock in-memory store for when database is unavailable
interface MockRequirement {
  id: string;
  originalRequirement: string;
  summarizedRequirement: string;
  conversationId: string;
  workspacePath?: string;
  detectedAt: Date;
  dataCollectionConsent: boolean;
  contactConsent: boolean;
  anonymizationConsent: boolean;
  userProvidedEmail?: string;
  consentedAt: Date;
  userId?: string;
  anonymizedData?: Record<string, unknown> | string;
  dataRetentionDays: number;
  scheduledDeletionAt: Date;
  status: RequirementStatus;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export class DatabaseService {
  private prisma: PrismaClient | null = null;
  // private useMock: boolean = false // Unused but kept for future mock functionality
  private mockRequirements: MockRequirement[] = [];
  private mockIdCounter = 1;

  constructor(prismaClient?: PrismaClient | null) {
    try {
      // Use provided prisma client or fallback to global prisma
      const client = prismaClient !== undefined ? prismaClient : prisma;
      // Check if client is valid (has required methods) or use mock
      if (client && typeof client === "object" && "requirement" in client) {
        this.prisma = client;
        dbLogger.info("DatabaseService: Using Prisma client");
      } else {
        this.prisma = null;
        dbLogger.info("DatabaseService: Using mock storage (invalid or null prisma client)");
      }
    } catch (error) {
      dbLogger.warn("DatabaseService: Prisma client failed, using mock storage", {
        error: (error as Error).message,
      });
      this.prisma = null;
    }
  }

  /**
   * Encrypt sensitive fields in a requirement before storage
   */
  private async encryptRequirementFields(requirement: CollectedRequirement): Promise<{
    encryptedOriginalRequirement: string;
    encryptedSummarizedRequirement: string;
    encryptedUserProvidedEmail?: string;
    encryptedAnonymizedData?: string;
  }> {
    const encryptedOriginalRequirement = await encryptionService.encrypt(
      requirement.originalRequirement
    );
    const encryptedSummarizedRequirement = await encryptionService.encrypt(
      requirement.summarizedRequirement
    );

    const encryptedUserProvidedEmail = requirement.consent.userProvidedEmail
      ? await encryptionService.encrypt(requirement.consent.userProvidedEmail)
      : undefined;

    let encryptedAnonymizedData = undefined;
    if (requirement.consent.consentOptions.anonymization) {
      const anonymizedData = this.anonymizeRequirement(requirement);
      encryptedAnonymizedData = await encryptionService.encryptJSON(anonymizedData);
    }

    return {
      encryptedOriginalRequirement,
      encryptedSummarizedRequirement,
      encryptedUserProvidedEmail,
      encryptedAnonymizedData,
    };
  }

  /**
   * Decrypt encrypted fields when reading from database
   */
  private async decryptRequirementFields(
    encryptedOriginalRequirement: string,
    encryptedSummarizedRequirement: string,
    encryptedUserProvidedEmail?: string | null,
    encryptedAnonymizedData?: unknown
  ): Promise<{
    originalRequirement: string;
    summarizedRequirement: string;
    userProvidedEmail?: string;
    anonymizedData?: unknown;
  }> {
    const originalRequirement = await encryptionService.decrypt(encryptedOriginalRequirement);
    const summarizedRequirement = await encryptionService.decrypt(encryptedSummarizedRequirement);

    const userProvidedEmail = encryptedUserProvidedEmail
      ? await encryptionService.decrypt(encryptedUserProvidedEmail)
      : undefined;

    let anonymizedData: Record<string, unknown> | undefined = undefined;
    if (encryptedAnonymizedData) {
      // Check if data is encrypted (contains dot separator) or already decrypted object
      if (typeof encryptedAnonymizedData === "string" && encryptedAnonymizedData.includes(".")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anonymizedData = (await encryptionService.decryptJSON(encryptedAnonymizedData)) as any;
      } else {
        // Already decrypted or plain object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anonymizedData = encryptedAnonymizedData as any;
      }
    }

    return {
      originalRequirement,
      summarizedRequirement,
      userProvidedEmail,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anonymizedData: anonymizedData as any,
    };
  }

  /**
   * Decrypt encrypted fields in a requirement object
   */
  private async decryptRequirement(requirement: PrismaRequirement): Promise<PrismaRequirement> {
    const { originalRequirement, summarizedRequirement, userProvidedEmail, anonymizedData } =
      await this.decryptRequirementFields(
        requirement.originalRequirement,
        requirement.summarizedRequirement,
        requirement.userProvidedEmail,
        requirement.anonymizedData
      );

    return {
      ...requirement,
      originalRequirement,
      summarizedRequirement,
      userProvidedEmail,
      anonymizedData,
    };
  }

  async storeRequirement(
    collectedRequirement: CollectedRequirement,
    userId?: string
  ): Promise<string> {
    try {
      // Calculate data retention based on consent
      const dataRetentionDays = this.calculateRetentionDays(collectedRequirement.consent);
      const scheduledDeletionAt = new Date();
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + dataRetentionDays);

      // Encrypt sensitive fields before storage
      const {
        encryptedOriginalRequirement,
        encryptedSummarizedRequirement,
        encryptedUserProvidedEmail,
        encryptedAnonymizedData,
      } = await this.encryptRequirementFields(collectedRequirement);

      // Use Prisma if available, otherwise fallback to mock
      if (this.prisma) {
        // Store the requirement
        const requirement = await this.prisma.requirement.create({
          data: {
            originalRequirement: encryptedOriginalRequirement,
            summarizedRequirement: encryptedSummarizedRequirement,
            conversationId: collectedRequirement.context.conversationId,
            workspacePath: collectedRequirement.context.workspacePath,
            detectedAt: collectedRequirement.context.timestamp,

            // Consent information
            dataCollectionConsent: collectedRequirement.consent.consentOptions.dataCollection,
            contactConsent: collectedRequirement.consent.consentOptions.contact,
            anonymizationConsent: collectedRequirement.consent.consentOptions.anonymization,
            userProvidedEmail: encryptedUserProvidedEmail,
            consentedAt: collectedRequirement.consent.consentedAt,

            // User association (if authenticated)
            userId: userId,

            // Privacy controls
            anonymizedData: encryptedAnonymizedData,
            dataRetentionDays,
            scheduledDeletionAt,

            // Status
            status: "PENDING",
          },
        });

        // Log the privacy action
        await this.logPrivacyAction({
          action: "CREATE",
          entityType: "Requirement",
          entityId: requirement.id,
          actorType: "SYSTEM",
          changes: {
            consent: collectedRequirement.consent.consentOptions,
            retentionDays: dataRetentionDays,
          },
          reason: "New requirement collected with user consent",
        });

        return requirement.id;
      } else {
        // Mock implementation
        const mockId = `mock-${this.mockIdCounter++}`;
        const mockRequirement: MockRequirement = {
          id: mockId,
          originalRequirement: encryptedOriginalRequirement,
          summarizedRequirement: encryptedSummarizedRequirement,
          conversationId: collectedRequirement.context.conversationId,
          workspacePath: collectedRequirement.context.workspacePath,
          detectedAt: collectedRequirement.context.timestamp,
          dataCollectionConsent: collectedRequirement.consent.consentOptions.dataCollection,
          contactConsent: collectedRequirement.consent.consentOptions.contact,
          anonymizationConsent: collectedRequirement.consent.consentOptions.anonymization,
          userProvidedEmail: encryptedUserProvidedEmail,
          consentedAt: collectedRequirement.consent.consentedAt,
          userId: userId,
          anonymizedData: encryptedAnonymizedData,
          dataRetentionDays,
          scheduledDeletionAt,
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockRequirements.push(mockRequirement);
        dbLogger.info("DatabaseService: Stored requirement in mock storage", { mockId });
        return mockId;
      }
    } catch (error) {
      dbLogger.error("Error storing requirement", { error: (error as Error).message });
      throw new Error("Failed to store requirement");
    }
  }

  async updateRequirementEmbedding(id: string, embedding: number[]): Promise<void> {
    try {
      if (this.prisma) {
        await this.prisma.requirement.update({
          where: { id },
          data: { embedding },
        });
      } else {
        // Mock implementation
        const mockRequirement = this.mockRequirements.find((req) => req.id === id);
        if (mockRequirement) {
          mockRequirement.embedding = embedding;
          mockRequirement.updatedAt = new Date();
          dbLogger.info("DatabaseService: Updated embedding for requirement in mock storage", {
            id,
          });
        }
      }
    } catch (error) {
      dbLogger.error("Error updating requirement embedding", {
        error: (error as Error).message,
      });
      throw new Error("Failed to update requirement embedding");
    }
  }

  async getRequirement(id: string, includeAnonymized = false) {
    try {
      if (this.prisma) {
        const requirement = await this.prisma.requirement.findUnique({
          where: { id },
        });

        if (!requirement) {
          return null;
        }

        // Apply privacy controls
        return await this.applyPrivacyControls(requirement, includeAnonymized);
      } else {
        // Mock implementation
        const mockRequirement = this.mockRequirements.find((req) => req.id === id);
        if (!mockRequirement) {
          return null;
        }
        return await this.applyPrivacyControls(mockRequirement, includeAnonymized);
      }
    } catch (error) {
      dbLogger.error("Error fetching requirement", { error: (error as Error).message });
      throw new Error("Failed to fetch requirement");
    }
  }

  /**
   * Requirements sorted by priority: recency + cluster size.
   * Score = 100 - min(100, daysSinceDetected) + sum(cluster.requirementCount) for linked clusters.
   */
  async getPrioritizedRequirements(limit = 100, userId?: string) {
    try {
      if (this.prisma) {
        const whereClause: { status: { in: RequirementStatus[] }; userId?: string } = {
          status: { in: ["PROCESSED", "CLUSTERED"] },
        };
        if (userId) whereClause.userId = userId;

        const raw = await this.prisma.requirement.findMany({
          where: whereClause,
          take: Math.min(limit * 3, 300),
          orderBy: { detectedAt: "desc" },
          include: { clusters: { select: { requirementCount: true } } },
        });

        const now = Date.now();
        const withScore = raw.map((req) => {
          const daysSince = (now - new Date(req.detectedAt).getTime()) / (24 * 60 * 60 * 1000);
          const recencyScore = Math.max(0, 100 - Math.min(100, daysSince));
          const clusterScore = req.clusters.reduce((s, c) => s + (c.requirementCount ?? 0), 0);
          return { ...req, _priorityScore: recencyScore + clusterScore };
        });
        withScore.sort(
          (a, b) =>
            (b as { _priorityScore: number })._priorityScore -
            (a as { _priorityScore: number })._priorityScore
        );
        const trimmed = withScore
          .slice(0, limit)
          .map(({ clusters: _c, _priorityScore: _p, ...req }) => req);

        return Promise.all(
          trimmed.map((req) => this.applyPrivacyControls(req as PrismaRequirement, false))
        );
      }
      return this.getRequirementsByStatus("PROCESSED", limit, userId);
    } catch (error) {
      dbLogger.error("Error fetching prioritized requirements", {
        error: (error as Error).message,
      });
      return this.getRequirementsByStatus("PROCESSED", limit, userId);
    }
  }

  async getRequirementsByStatus(status: RequirementStatus, limit = 100, userId?: string) {
    try {
      if (this.prisma) {
        const whereClause: { status: RequirementStatus; userId?: string } = { status };
        if (userId) {
          whereClause.userId = userId;
        }

        const requirements = await this.prisma.requirement.findMany({
          where: whereClause,
          take: limit,
          orderBy: { detectedAt: "desc" },
        });

        // Apply privacy controls to all requirements
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.all(requirements.map((req: any) => this.applyPrivacyControls(req, false)));
      } else {
        // Mock implementation
        let mockRequirements = this.mockRequirements.filter((req) => req.status === status);
        if (userId) {
          mockRequirements = mockRequirements.filter((req) => req.userId === userId);
        }
        mockRequirements.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
        mockRequirements = mockRequirements.slice(0, limit);
        return Promise.all(mockRequirements.map((req) => this.applyPrivacyControls(req, false)));
      }
    } catch (error) {
      dbLogger.error("Error fetching requirements by status", {
        error: (error as Error).message,
      });
      throw new Error("Failed to fetch requirements");
    }
  }

  async updateRequirementStatus(id: string, status: RequirementStatus) {
    try {
      if (this.prisma) {
        const requirement = await this.prisma.requirement.update({
          where: { id },
          data: {
            status,
            processedAt: status === "PROCESSED" || status === "CLUSTERED" ? new Date() : undefined,
          },
        });

        await this.logPrivacyAction({
          action: "UPDATE",
          entityType: "Requirement",
          entityId: id,
          actorType: "SYSTEM",
          changes: { status },
          reason: "Requirement processing status updated",
        });

        return requirement;
      } else {
        // Mock implementation
        const mockRequirement = this.mockRequirements.find((req) => req.id === id);
        if (!mockRequirement) {
          throw new Error("Requirement not found");
        }
        mockRequirement.status = status;
        mockRequirement.updatedAt = new Date();
        dbLogger.info("DatabaseService: Updated requirement status in mock storage", {
          id,
          status,
        });
        return mockRequirement;
      }
    } catch (error) {
      dbLogger.error("Error updating requirement status", {
        error: (error as Error).message,
      });
      throw new Error("Failed to update requirement status");
    }
  }

  async deleteRequirement(id: string, reason: string, requestedBy?: string) {
    try {
      if (this.prisma) {
        // First, add to deletion queue for audit trail
        await this.prisma.dataDeletionQueue.create({
          data: {
            entityType: "Requirement",
            entityId: id,
            deletionReason: "USER_REQUEST",
            scheduledAt: new Date(),
            requestedBy,
          },
        });

        // Then mark as deleted (soft delete)
        const requirement = await this.prisma.requirement.update({
          where: { id },
          data: {
            status: "DELETED",
            scheduledDeletionAt: new Date(), // Immediate deletion
          },
        });

        await this.logPrivacyAction({
          action: "DELETE",
          entityType: "Requirement",
          entityId: id,
          actorType: requestedBy ? "USER" : "SYSTEM",
          reason: `Requirement deleted: ${reason}`,
        });

        return requirement;
      } else {
        // Mock implementation
        const index = this.mockRequirements.findIndex((req) => req.id === id);
        if (index === -1) {
          throw new Error("Requirement not found");
        }
        const [mockRequirement] = this.mockRequirements.splice(index, 1);
        mockRequirement.status = "DELETED";
        mockRequirement.scheduledDeletionAt = new Date();
        mockRequirement.updatedAt = new Date();
        dbLogger.info("DatabaseService: Deleted requirement from mock storage", { id, reason });
        return mockRequirement;
      }
    } catch (error) {
      dbLogger.error("Error deleting requirement", { error: (error as Error).message });
      throw new Error("Failed to delete requirement");
    }
  }

  async getStatistics() {
    try {
      if (this.prisma) {
        const [
          totalRequirements,
          totalClusters,
          totalUsers,
          pendingRequirements,
          processedRequirements,
          clusteredRequirements,
          requirementsWithContactConsent,
          requirementsWithAnonymization,
        ] = await Promise.all([
          this.prisma.requirement.count(),
          this.prisma.requirementCluster.count(),
          this.prisma.user.count(),
          this.prisma.requirement.count({ where: { status: "PENDING" } }),
          this.prisma.requirement.count({ where: { status: "PROCESSED" } }),
          this.prisma.requirement.count({ where: { status: "CLUSTERED" } }),
          this.prisma.requirement.count({ where: { contactConsent: true } }),
          this.prisma.requirement.count({ where: { anonymizationConsent: true } }),
        ]);

        // Get recent requirements (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequirements = await this.prisma.requirement.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        });

        return {
          totalRequirements,
          totalClusters,
          totalUsers,
          recentRequirements,
          byStatus: {
            pending: pendingRequirements,
            processed: processedRequirements,
            clustered: clusteredRequirements,
          },
          privacyMetrics: {
            withContactConsent: requirementsWithContactConsent,
            withAnonymization: requirementsWithAnonymization,
          },
        };
      } else {
        // Mock implementation
        const totalRequirements = this.mockRequirements.length;
        const totalClusters = 0; // Mock clusters not implemented
        const totalUsers = 0; // Mock users not implemented
        const pendingRequirements = this.mockRequirements.filter(
          (req) => req.status === "PENDING"
        ).length;
        const processedRequirements = this.mockRequirements.filter(
          (req) => req.status === "PROCESSED"
        ).length;
        const clusteredRequirements = this.mockRequirements.filter(
          (req) => req.status === "CLUSTERED"
        ).length;
        const requirementsWithContactConsent = this.mockRequirements.filter(
          (req) => req.contactConsent
        ).length;
        const requirementsWithAnonymization = this.mockRequirements.filter(
          (req) => req.anonymizationConsent
        ).length;

        // Get recent requirements (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequirements = this.mockRequirements.filter(
          (req) => req.createdAt && new Date(req.createdAt) >= sevenDaysAgo
        ).length;

        return {
          totalRequirements,
          totalClusters,
          totalUsers,
          recentRequirements,
          byStatus: {
            pending: pendingRequirements,
            processed: processedRequirements,
            clustered: clusteredRequirements,
          },
          privacyMetrics: {
            withContactConsent: requirementsWithContactConsent,
            withAnonymization: requirementsWithAnonymization,
          },
        };
      }
    } catch (error) {
      dbLogger.error("Error fetching statistics", { error: (error as Error).message });
      throw new Error("Failed to fetch statistics");
    }
  }

  async processScheduledDeletions() {
    try {
      const now = new Date();

      if (this.prisma) {
        const requirementsToDelete = await this.prisma.requirement.findMany({
          where: {
            scheduledDeletionAt: { lte: now },
            status: { not: "DELETED" },
          },
          take: 100, // Batch size
        });

        for (const requirement of requirementsToDelete) {
          await this.deleteRequirement(requirement.id, "Retention period expired", "SYSTEM");
        }

        return requirementsToDelete.length;
      } else {
        // Mock implementation
        const requirementsToDelete = this.mockRequirements
          .filter((req) => req.scheduledDeletionAt <= now && req.status !== "DELETED")
          .slice(0, 100);

        for (const requirement of requirementsToDelete) {
          await this.deleteRequirement(requirement.id, "Retention period expired", "SYSTEM");
        }

        return requirementsToDelete.length;
      }
    } catch (error) {
      dbLogger.error("Error processing scheduled deletions", {
        error: (error as Error).message,
      });
      throw new Error("Failed to process scheduled deletions");
    }
  }

  private calculateRetentionDays(consent: CollectedRequirement["consent"]): number {
    if (consent.consentOptions.anonymization) {
      return 365 * 5; // 5 years for anonymized data
    }

    if (consent.consentOptions.contact) {
      return 365 * 2; // 2 years for data with contact info
    }

    return 365; // 1 year for basic consented data
  }

  private anonymizeRequirement(
    collectedRequirement: CollectedRequirement
  ): Record<string, unknown> {
    // Create anonymized version of the requirement
    // In production, this would be more sophisticated
    return {
      summarizedRequirement: collectedRequirement.summarizedRequirement,
      detectedAt: collectedRequirement.context.timestamp,
      categories: [], // Would be filled during AI processing
      wordCount: collectedRequirement.originalRequirement.split(/\s+/).length,
      // No personally identifiable information
    };
  }

  private async applyPrivacyControls(
    requirement: PrismaRequirement,
    includeAnonymized: boolean
  ): Promise<PrismaRequirement> {
    // Decrypt encrypted fields before applying privacy controls
    const decryptedRequirement = await this.decryptRequirement(requirement);

    // Apply privacy controls based on consent
    const result = { ...decryptedRequirement };

    // If anonymization was consented, use anonymized data
    if (
      decryptedRequirement.anonymizationConsent &&
      decryptedRequirement.anonymizedData &&
      !includeAnonymized
    ) {
      result.originalRequirement = "[ANONYMIZED]";
      result.conversationId = "[ANONYMIZED]";
      result.workspacePath = "[ANONYMIZED]";
      result.userProvidedEmail = null;

      // Merge anonymized data
      Object.assign(result, decryptedRequirement.anonymizedData);
    }

    // Always hide email unless explicitly requested with proper authorization
    if (!includeAnonymized) {
      result.userProvidedEmail = decryptedRequirement.contactConsent ? "[REDACTED]" : null;
    }

    return result;
  }

  private async logPrivacyAction(params: {
    action: PrivacyAction;
    entityType: string;
    entityId?: string;
    actorType: ActorType;
    actorId?: string;
    changes?: Record<string, unknown>;
    reason?: string;
  }) {
    try {
      if (this.prisma) {
        await this.prisma.privacyAuditLog.create({
          data: {
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            actorType: params.actorType,
            actorId: params.actorId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            changes: params.changes as any,
            reason: params.reason,
          },
        });
      } else {
        // Mock implementation - just log to console
        dbLogger.info("DatabaseService: Privacy action logged (mock)", { params });
      }
    } catch (error) {
      dbLogger.error("Error logging privacy action", { error: (error as Error).message });
      // Don't throw - privacy logging shouldn't break main functionality
    }
  }

  async getClusters(limit?: number, offset?: number) {
    try {
      if (this.prisma) {
        const clusters = await this.prisma.requirementCluster.findMany({
          take: limit || 10,
          skip: offset || 0,
          include: {
            _count: {
              select: { requirements: true },
            },
            requirements: {
              take: 5,
              select: {
                summarizedRequirement: true,
                detectedAt: true,
              },
            },
          },
          orderBy: {
            requirementCount: "desc",
          },
        });

        return clusters.map((cluster) => ({
          id: cluster.id,
          name: cluster.name,
          description: cluster.description,
          requirementCount: cluster._count.requirements,
          firstDetectedAt: cluster.firstDetectedAt,
          lastDetectedAt: cluster.lastDetectedAt,
          sampleRequirements: cluster.requirements.map((req) => ({
            summary: req.summarizedRequirement,
            detectedAt: req.detectedAt,
          })),
        }));
      } else {
        // Mock implementation
        return [
          {
            id: "mock-cluster-1",
            name: "Authentication Systems",
            description: "Login, OAuth, 2FA, and security requirements",
            requirementCount: 42,
            firstDetectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lastDetectedAt: new Date(),
            sampleRequirements: [
              { summary: "Add NextAuth.js with Google OAuth", detectedAt: new Date() },
              { summary: "Implement 2-factor authentication", detectedAt: new Date() },
            ],
          },
          {
            id: "mock-cluster-2",
            name: "Data Visualization",
            description: "Dashboards, charts, and analytics tools",
            requirementCount: 38,
            firstDetectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            lastDetectedAt: new Date(),
            sampleRequirements: [
              { summary: "Create interactive charts for user data", detectedAt: new Date() },
              { summary: "Build real-time analytics dashboard", detectedAt: new Date() },
            ],
          },
        ];
      }
    } catch (error) {
      dbLogger.error("Error fetching clusters", { error: (error as Error).message });
      throw new Error("Failed to fetch clusters");
    }
  }

  async getClustersCount(): Promise<number> {
    try {
      if (this.prisma) {
        return await this.prisma.requirementCluster.count();
      } else {
        // Mock implementation
        return 2;
      }
    } catch (error) {
      dbLogger.error("Error counting clusters", { error: (error as Error).message });
      throw new Error("Failed to count clusters");
    }
  }

  async getClusterDetailsForAdmin(
    clusterId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {},
    userRole?: string
  ) {
    try {
      const { limit = 100, offset = 0 } = options;

      if (this.prisma) {
        const cluster = await this.prisma.requirementCluster.findUnique({
          where: { id: clusterId },
          include: {
            _count: {
              select: { requirements: true },
            },
            requirements: {
              take: limit,
              skip: offset,
              orderBy: { detectedAt: "desc" },
            },
          },
        });

        if (!cluster) return null;

        const requirements = await Promise.all(
          cluster.requirements.map((req) =>
            this.applyPrivacyControls(req as PrismaRequirement, false)
          )
        );

        const canViewUnmasked = canViewUnmaskedData(userRole, "admin");
        const visibleRequirements = canViewUnmasked
          ? requirements
          : maskRequirementsForAdmin(requirements, {
              maskEmail: true,
              maskRequirementText: false,
              maskWorkspacePath: true,
              maskConversationId: true,
              maskUUID: false,
            });

        return {
          id: cluster.id,
          name: cluster.name,
          description: cluster.description,
          requirementCount: cluster._count.requirements,
          firstDetectedAt: cluster.firstDetectedAt,
          lastDetectedAt: cluster.lastDetectedAt,
          requirements: visibleRequirements,
        };
      }

      const mockClusters = await this.getClusters(limit, offset);
      const cluster = mockClusters.find((item) => item.id === clusterId);
      if (!cluster) return null;

      return {
        ...cluster,
        requirements: [],
      };
    } catch (error) {
      dbLogger.error("Error fetching cluster details for admin", {
        clusterId,
        error: (error as Error).message,
      });
      throw new Error("Failed to fetch cluster details");
    }
  }

  async createCluster(name: string, description: string): Promise<RequirementCluster> {
    try {
      if (this.prisma) {
        const cluster = await this.prisma.requirementCluster.create({
          data: {
            name,
            description,
            requirementCount: 0,
            firstDetectedAt: new Date(),
            lastDetectedAt: new Date(),
          },
        });

        await this.logPrivacyAction({
          action: "CREATE",
          entityType: "RequirementCluster",
          entityId: cluster.id,
          actorType: "SYSTEM",
          changes: { name, description },
          reason: "Cluster created by admin",
        });

        return cluster;
      } else {
        // Mock implementation
        const mockCluster: RequirementCluster = {
          id: `cluster-${Date.now()}`,
          name,
          description,
          requirementCount: 0,
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          centroidEmbedding: null,
        };
        return mockCluster;
      }
    } catch (error) {
      dbLogger.error("Error creating cluster", { error: (error as Error).message });
      throw new Error("Failed to create cluster");
    }
  }

  async getRequirementCountForUser(userId: string): Promise<number> {
    try {
      if (this.prisma) {
        return await this.prisma.requirement.count({ where: { userId } });
      }
      return 0;
    } catch (error) {
      dbLogger.error("Error counting user requirements", {
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /** Clusters that the user's requirements belong to (for personal insights). */
  async getClustersForUser(
    userId: string
  ): Promise<{ id: string; name: string; requirementCount: number }[]> {
    try {
      if (this.prisma) {
        const clusters = await this.prisma.requirementCluster.findMany({
          where: { requirements: { some: { userId } } },
          select: { id: true, name: true, requirementCount: true },
          orderBy: { requirementCount: "desc" },
        });
        return clusters;
      }
      return [];
    } catch (error) {
      dbLogger.error("Error fetching clusters for user", {
        error: (error as Error).message,
      });
      return [];
    }
  }

  async getPublicStatistics() {
    try {
      if (this.prisma) {
        const [totalRequirements, totalClusters, totalUsers, recentRequirements] =
          await Promise.all([
            this.prisma.requirement.count(),
            this.prisma.requirementCluster.count(),
            this.prisma.user.count(),
            this.prisma.requirement.count({
              where: {
                detectedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            }),
          ]);

        return {
          totalRequirements,
          totalClusters,
          totalUsers,
          recentRequirements,
        };
      } else {
        // Mock statistics
        return {
          totalRequirements: 2847,
          totalClusters: 12,
          totalUsers: 428,
          recentRequirements: 142,
        };
      }
    } catch (error) {
      dbLogger.error("Error fetching public statistics", {
        error: (error as Error).message,
      });
      return {
        totalRequirements: 0,
        totalClusters: 0,
        totalUsers: 0,
        recentRequirements: 0,
      };
    }
  }

  /**
   * Get requirements with masking for admin views
   * @param options Filtering options
   * @param userRole User role for permission checking
   * @returns Requirements with appropriate masking applied
   */
  async getRequirementsForAdmin(
    options: {
      status?: RequirementStatus;
      limit?: number;
      offset?: number;
      userId?: string;
    } = {},
    userRole?: string
  ) {
    try {
      const { status, limit = 100, offset = 0, userId } = options;

      let requirements;
      if (this.prisma) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (userId) whereClause.userId = userId;

        requirements = await this.prisma.requirement.findMany({
          where: whereClause,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        });
      } else {
        // Mock implementation
        requirements = this.mockRequirements
          .filter((req) => {
            if (status && req.status !== status) return false;
            if (userId && req.userId !== userId) return false;
            return true;
          })
          .slice(offset, offset + limit);
      }

      // Apply privacy controls (decryption, anonymization)
      const processedRequirements = await Promise.all(
        requirements.map((req) => this.applyPrivacyControls(req, false))
      );

      // Check if user can view unmasked data
      const canViewUnmasked = canViewUnmaskedData(userRole, "admin");

      // Apply masking if needed
      if (!canViewUnmasked) {
        return maskRequirementsForAdmin(processedRequirements, {
          maskEmail: true,
          maskRequirementText: false, // Admins can usually see full text
          maskWorkspacePath: true,
          maskConversationId: true,
          maskUUID: false, // Keep UUIDs for reference
        });
      }

      return processedRequirements;
    } catch (error) {
      dbLogger.error("Error fetching requirements for admin", {
        error: (error as Error).message,
      });
      throw new Error("Failed to fetch requirements for admin view");
    }
  }

  async getRequirementsCountForAdmin(
    options: {
      status?: RequirementStatus;
      userId?: string;
    } = {}
  ): Promise<number> {
    try {
      const { status, userId } = options;

      if (this.prisma) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (userId) whereClause.userId = userId;

        return await this.prisma.requirement.count({
          where: whereClause,
        });
      } else {
        // Mock implementation
        return this.mockRequirements.filter((req) => {
          if (status && req.status !== status) return false;
          if (userId && req.userId !== userId) return false;
          return true;
        }).length;
      }
    } catch (error) {
      dbLogger.error("Error counting requirements for admin", {
        error: (error as Error).message,
      });
      throw new Error("Failed to count requirements for admin view");
    }
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
