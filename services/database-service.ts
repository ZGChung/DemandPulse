import { PrismaClient, RequirementStatus, PrivacyAction, ActorType } from '@prisma/client'
import { CollectedRequirement } from '@/types/claude-code'

export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async storeRequirement(collectedRequirement: CollectedRequirement): Promise<string> {
    try {
      // Calculate data retention based on consent
      const dataRetentionDays = this.calculateRetentionDays(collectedRequirement.consent)
      const scheduledDeletionAt = new Date()
      scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + dataRetentionDays)

      // Create anonymized data if consent allows
      const anonymizedData = collectedRequirement.consent.consentOptions.anonymization
        ? this.anonymizeRequirement(collectedRequirement)
        : null

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
          
          // Privacy controls
          anonymizedData,
          dataRetentionDays,
          scheduledDeletionAt,
          
          // Status
          status: 'PENDING',
        },
      })

      // Log the privacy action
      await this.logPrivacyAction({
        action: 'CREATE',
        entityType: 'Requirement',
        entityId: requirement.id,
        actorType: 'SYSTEM',
        changes: {
          consent: collectedRequirement.consent.consentOptions,
          retentionDays: dataRetentionDays,
        },
        reason: 'New requirement collected with user consent',
      })

      return requirement.id
    } catch (error) {
      console.error('Error storing requirement:', error)
      throw new Error('Failed to store requirement')
    }
  }

  async getRequirement(id: string, includeAnonymized = false) {
    try {
      const requirement = await this.prisma.requirement.findUnique({
        where: { id },
      })

      if (!requirement) {
        return null
      }

      // Apply privacy controls
      return this.applyPrivacyControls(requirement, includeAnonymized)
    } catch (error) {
      console.error('Error fetching requirement:', error)
      throw new Error('Failed to fetch requirement')
    }
  }

  async getRequirementsByStatus(status: RequirementStatus, limit = 100) {
    try {
      const requirements = await this.prisma.requirement.findMany({
        where: { status },
        take: limit,
        orderBy: { detectedAt: 'desc' },
      })

      // Apply privacy controls to all requirements
      return requirements.map((req: any) => this.applyPrivacyControls(req, false))
    } catch (error) {
      console.error('Error fetching requirements by status:', error)
      throw new Error('Failed to fetch requirements')
    }
  }

  async updateRequirementStatus(id: string, status: RequirementStatus) {
    try {
      const requirement = await this.prisma.requirement.update({
        where: { id },
        data: {
          status,
          processedAt: status === 'PROCESSED' || status === 'CLUSTERED' ? new Date() : undefined,
        },
      })

      await this.logPrivacyAction({
        action: 'UPDATE',
        entityType: 'Requirement',
        entityId: id,
        actorType: 'SYSTEM',
        changes: { status },
        reason: 'Requirement processing status updated',
      })

      return requirement
    } catch (error) {
      console.error('Error updating requirement status:', error)
      throw new Error('Failed to update requirement status')
    }
  }

  async deleteRequirement(id: string, reason: string, requestedBy?: string) {
    try {
      // First, add to deletion queue for audit trail
      await this.prisma.dataDeletionQueue.create({
        data: {
          entityType: 'Requirement',
          entityId: id,
          deletionReason: 'USER_REQUEST',
          scheduledAt: new Date(),
          requestedBy,
        },
      })

      // Then mark as deleted (soft delete)
      const requirement = await this.prisma.requirement.update({
        where: { id },
        data: {
          status: 'DELETED',
          scheduledDeletionAt: new Date(), // Immediate deletion
        },
      })

      await this.logPrivacyAction({
        action: 'DELETE',
        entityType: 'Requirement',
        entityId: id,
        actorType: requestedBy ? 'USER' : 'SYSTEM',
        reason: `Requirement deleted: ${reason}`,
      })

      return requirement
    } catch (error) {
      console.error('Error deleting requirement:', error)
      throw new Error('Failed to delete requirement')
    }
  }

  async getStatistics() {
    try {
      const [
        totalRequirements,
        pendingRequirements,
        processedRequirements,
        clusteredRequirements,
        requirementsWithContactConsent,
        requirementsWithAnonymization,
      ] = await Promise.all([
        this.prisma.requirement.count(),
        this.prisma.requirement.count({ where: { status: 'PENDING' } }),
        this.prisma.requirement.count({ where: { status: 'PROCESSED' } }),
        this.prisma.requirement.count({ where: { status: 'CLUSTERED' } }),
        this.prisma.requirement.count({ where: { contactConsent: true } }),
        this.prisma.requirement.count({ where: { anonymizationConsent: true } }),
      ])

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
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
      throw new Error('Failed to fetch statistics')
    }
  }

  async processScheduledDeletions() {
    try {
      const now = new Date()
      const requirementsToDelete = await this.prisma.requirement.findMany({
        where: {
          scheduledDeletionAt: { lte: now },
          status: { not: 'DELETED' },
        },
        take: 100, // Batch size
      })

      for (const requirement of requirementsToDelete) {
        await this.deleteRequirement(
          requirement.id,
          'Retention period expired',
          'SYSTEM'
        )
      }

      return requirementsToDelete.length
    } catch (error) {
      console.error('Error processing scheduled deletions:', error)
      throw new Error('Failed to process scheduled deletions')
    }
  }

  private calculateRetentionDays(consent: CollectedRequirement['consent']): number {
    if (consent.consentOptions.anonymization) {
      return 365 * 5 // 5 years for anonymized data
    }
    
    if (consent.consentOptions.contact) {
      return 365 * 2 // 2 years for data with contact info
    }
    
    return 365 // 1 year for basic consented data
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
    }
  }

  private applyPrivacyControls(requirement: any, includeAnonymized: boolean) {
    // Apply privacy controls based on consent
    const result = { ...requirement }

    // If anonymization was consented, use anonymized data
    if (requirement.anonymizationConsent && requirement.anonymizedData && !includeAnonymized) {
      result.originalRequirement = '[ANONYMIZED]'
      result.conversationId = '[ANONYMIZED]'
      result.workspacePath = '[ANONYMIZED]'
      result.userProvidedEmail = null
      
      // Merge anonymized data
      Object.assign(result, requirement.anonymizedData)
    }

    // Always hide email unless explicitly requested with proper authorization
    if (!includeAnonymized) {
      result.userProvidedEmail = requirement.contactConsent ? '[REDACTED]' : null
    }

    return result
  }

  private async logPrivacyAction(params: {
    action: PrivacyAction
    entityType: string
    entityId?: string
    actorType: ActorType
    actorId?: string
    changes?: any
    reason?: string
  }) {
    try {
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
      })
    } catch (error) {
      console.error('Error logging privacy action:', error)
      // Don't throw - privacy logging shouldn't break main functionality
    }
  }

  async disconnect() {
    await this.prisma.$disconnect()
  }
}