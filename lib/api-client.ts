import { env } from '@/lib/env'

export interface Requirement {
  id: string
  originalRequirement: string
  summarizedRequirement: string
  conversationId: string
  workspacePath?: string
  detectedAt: string
  status: string
  createdAt: string
  updatedAt: string
  dataCollectionConsent: boolean
  contactConsent: boolean
  anonymizationConsent: boolean
  userProvidedEmail?: string
  dataRetentionDays: number
  scheduledDeletionAt?: string
}

export interface Statistics {
  totalRequirements: number
  byStatus: {
    pending: number
    processed: number
    clustered: number
  }
  privacyMetrics: {
    withContactConsent: number
    withAnonymization: number
  }
}

export interface RequirementsResponse {
  success: boolean
  data: {
    statistics: Statistics
    requirements: Requirement[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = env.nextPublicAppUrl()
  }

  async getRequirements(options?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<RequirementsResponse> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const url = `${this.baseUrl}/api/requirements${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache for real-time data
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch requirements: ${response.statusText}`)
    }

    return response.json()
  }

  async submitRequirement(data: {
    requirementId: string
    originalRequirement: string
    summarizedRequirement: string
    context: {
      conversationId: string
      workspacePath?: string
      timestamp: string
    }
    consent: {
      consentOptions: {
        dataCollection: boolean
        contact: boolean
        anonymization: boolean
      }
      userProvidedEmail?: string
      consentedAt: string
    }
  }): Promise<{ success: boolean; requirementId: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit requirement')
    }

    return response.json()
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()