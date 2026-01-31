import { PrismaClient, RequirementStatus, PrivacyAction, ActorType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CollectedRequirement } from "@/types/claude-code";

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
  anonymizedData: any;
  dataRetentionDays: number;
  scheduledDeletionAt: Date;
  status: RequirementStatus;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export class DatabaseService {
  private prisma: PrismaClient | null = null;
  // private useMock: boolean = false // Unused but kept for future mock functionality
  private mockRequirements: MockRequirement[] = [];
  private mockIdCounter = 1;

  constructor() {
    try {
      // Try to use Prisma, but fallback to mock if it fails
      this.prisma = prisma;
      // Test connection by accessing a property
      if (this.prisma) {
        console.log("DatabaseService: Using Prisma client");
      }
    } catch (error) {
      console.warn("DatabaseService: Prisma client failed, using mock storage", error);
      // this.useMock = true // Unused but kept for future mock functionality
      this.prisma = null;
    }
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

      // Create anonymized data if consent allows
      const anonymizedData = collectedRequirement.consent.consentOptions.anonymization
        ? this.anonymizeRequirement(collectedRequirement)
        : null;

      // Use Prisma if available, otherwise fallback to mock
      if (this.prisma) {
        // Store the requirement
        const requirement = await this.prisma.requirement.create({
          data: {
            originalRequirement: collectedRequirement.originalRequirement,
            summarizedRequirement: collectedRequirement.summarizedRequirement,
            conversationId: collectedRequirement.context.conversationId,
            workspacePath: collectedRequirement.context.workspacePath,
            detectedAt: collectedRequirement.context.timestamp,

            // Consent information
            dataCollectionConsent: collectedRequirement.consent.consentOptions.dataCollection,
            contactConsent: collectedRequirement.consent.consentOptions.contact,
            anonymizationConsent: collectedRequirement.consent.consentOptions.anonymization,
            userProvidedEmail: collectedRequirement.consent.userProvidedEmail,
            consentedAt: collectedRequirement.consent.consentedAt,

            // User association (if authenticated)
            userId: userId,

            // Privacy controls
            anonymizedData,
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
          originalRequirement: collectedRequirement.originalRequirement,
          summarizedRequirement: collectedRequirement.summarizedRequirement,
          conversationId: collectedRequirement.context.conversationId,
          workspacePath: collectedRequirement.context.workspacePath,
          detectedAt: collectedRequirement.context.timestamp,
          dataCollectionConsent: collectedRequirement.consent.consentOptions.dataCollection,
          contactConsent: collectedRequirement.consent.consentOptions.contact,
          anonymizationConsent: collectedRequirement.consent.consentOptions.anonymization,
          userProvidedEmail: collectedRequirement.consent.userProvidedEmail,
          consentedAt: collectedRequirement.consent.consentedAt,
          userId: userId,
          anonymizedData,
          dataRetentionDays,
          scheduledDeletionAt,
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.mockRequirements.push(mockRequirement);
        console.log("DatabaseService: Stored requirement in mock storage", mockId);
        return mockId;
      }
    } catch (error) {
      console.error("Error storing requirement:", error);
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
          console.log("DatabaseService: Updated embedding for requirement in mock storage", id);
        }
      }
    } catch (error) {
      console.error("Error updating requirement embedding:", error);
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
        return this.applyPrivacyControls(requirement, includeAnonymized);
      } else {
        // Mock implementation
        const mockRequirement = this.mockRequirements.find((req) => req.id === id);
        if (!mockRequirement) {
          return null;
        }
        return this.applyPrivacyControls(mockRequirement, includeAnonymized);
      }
    } catch (error) {
      console.error("Error fetching requirement:", error);
      throw new Error("Failed to fetch requirement");
    }
  }

  async getRequirementsByStatus(status: RequirementStatus, limit = 100, userId?: string) {
    try {
      if (this.prisma) {
        const whereClause: any = { status };
        if (userId) {
          whereClause.userId = userId;
        }

        const requirements = await this.prisma.requirement.findMany({
          where: whereClause,
          take: limit,
          orderBy: { detectedAt: "desc" },
        });

        // Apply privacy controls to all requirements
        return requirements.map((req: any) => this.applyPrivacyControls(req, false));
      } else {
        // Mock implementation
        let mockRequirements = this.mockRequirements.filter((req) => req.status === status);
        if (userId) {
          mockRequirements = mockRequirements.filter((req) => req.userId === userId);
        }
        mockRequirements.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
        mockRequirements = mockRequirements.slice(0, limit);
        return mockRequirements.map((req) => this.applyPrivacyControls(req, false));
      }
    } catch (error) {
      console.error("Error fetching requirements by status:", error);
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
        console.log("DatabaseService: Updated requirement status in mock storage", id, status);
        return mockRequirement;
      }
    } catch (error) {
      console.error("Error updating requirement status:", error);
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
        console.log("DatabaseService: Deleted requirement from mock storage", id, reason);
        return mockRequirement;
      }
    } catch (error) {
      console.error("Error deleting requirement:", error);
      throw new Error("Failed to delete requirement");
    }
  }

  async getStatistics() {
    try {
      if (this.prisma) {
        const [
          totalRequirements,
          pendingRequirements,
          processedRequirements,
          clusteredRequirements,
          requirementsWithContactConsent,
          requirementsWithAnonymization,
        ] = await Promise.all([
          this.prisma.requirement.count(),
          this.prisma.requirement.count({ where: { status: "PENDING" } }),
          this.prisma.requirement.count({ where: { status: "PROCESSED" } }),
          this.prisma.requirement.count({ where: { status: "CLUSTERED" } }),
          this.prisma.requirement.count({ where: { contactConsent: true } }),
          this.prisma.requirement.count({ where: { anonymizationConsent: true } }),
        ]);

        return {
          totalRequirements,
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

        return {
          totalRequirements,
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
      console.error("Error fetching statistics:", error);
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
      console.error("Error processing scheduled deletions:", error);
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

  private anonymizeRequirement(collectedRequirement: CollectedRequirement): any {
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

  private applyPrivacyControls(requirement: any, includeAnonymized: boolean) {
    // Apply privacy controls based on consent
    const result = { ...requirement };

    // If anonymization was consented, use anonymized data
    if (requirement.anonymizationConsent && requirement.anonymizedData && !includeAnonymized) {
      result.originalRequirement = "[ANONYMIZED]";
      result.conversationId = "[ANONYMIZED]";
      result.workspacePath = "[ANONYMIZED]";
      result.userProvidedEmail = null;

      // Merge anonymized data
      Object.assign(result, requirement.anonymizedData);
    }

    // Always hide email unless explicitly requested with proper authorization
    if (!includeAnonymized) {
      result.userProvidedEmail = requirement.contactConsent ? "[REDACTED]" : null;
    }

    return result;
  }

  private async logPrivacyAction(params: {
    action: PrivacyAction;
    entityType: string;
    entityId?: string;
    actorType: ActorType;
    actorId?: string;
    changes?: any;
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
            changes: params.changes,
            reason: params.reason,
          },
        });
      } else {
        // Mock implementation - just log to console
        console.log("DatabaseService: Privacy action logged (mock)", params);
      }
    } catch (error) {
      console.error("Error logging privacy action:", error);
      // Don't throw - privacy logging shouldn't break main functionality
    }
  }

  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
