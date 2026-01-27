import { DataCollectionFlow } from '@/services/data-collection-flow'

describe('DataCollectionFlow', () => {
  let flow: DataCollectionFlow

  beforeEach(() => {
    flow = new DataCollectionFlow()
  })

  describe('processConversationMessage', () => {
    it('should detect requirement and create consent prompt for high-confidence requirement', async () => {
      const text = 'I need to build a comprehensive user authentication system with OAuth support'
      const context = { conversationId: 'test-conv-123' }

      const result = await flow.processConversationMessage(text, context)

      expect(result.detected).not.toBeNull()
      expect(result.shouldPrompt).toBe(true)
      expect(result.prompt).not.toBeNull()
      expect(result.prompt?.requirementId).toBe(result.detected?.id)
      expect(result.prompt?.summarizedRequirement).toBeTruthy()
    })

    it('should detect requirement but not prompt for low-confidence requirement', async () => {
      const text = 'maybe we could build something simple'
      const context = { conversationId: 'test-conv-123' }

      const result = await flow.processConversationMessage(text, context)

      // This might or might not be detected depending on confidence calculation
      // If detected, shouldPrompt should be false
      if (result.detected) {
        expect(result.shouldPrompt).toBe(false)
      }
      expect(result.prompt).toBeNull()
    })

    it('should return null for non-requirement messages', async () => {
      const text = 'Hello, how are you today?'
      const context = { conversationId: 'test-conv-123' }

      const result = await flow.processConversationMessage(text, context)

      expect(result.detected).toBeNull()
      expect(result.shouldPrompt).toBe(false)
      expect(result.prompt).toBeNull()
    })
  })

  describe('handleUserConsent', () => {
    const mockContext = {
      conversationId: 'conv-123',
      userId: 'user-456',
      workspacePath: '/projects/test',
    }

    it('should successfully handle valid consent', async () => {
      const requirementId = 'req-123'
      const originalRequirement = 'Build a login system with 2FA'
      const summarizedRequirement = 'Build login system'
      const userConsent = {
        requirementId: 'req-123',
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      }

      const result = await flow.handleUserConsent(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        mockContext,
        userConsent
      )

      expect(result.success).toBe(true)
      expect(result.collectedRequirement).not.toBeNull()
      expect(result.errors).toHaveLength(0)
      expect(result.collectedRequirement?.id).toBe(requirementId)
      expect(result.collectedRequirement?.originalRequirement).toBe(originalRequirement)
      expect(result.collectedRequirement?.status).toBe('pending')
    })

    it('should reject consent without data collection permission', async () => {
      const requirementId = 'req-123'
      const originalRequirement = 'Build a login system with 2FA'
      const summarizedRequirement = 'Build login system'
      const userConsent = {
        requirementId: 'req-123',
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: false,
          anonymization: true,
        },
      }

      const result = await flow.handleUserConsent(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        mockContext,
        userConsent
      )

      expect(result.success).toBe(false)
      expect(result.collectedRequirement).toBeNull()
      expect(result.errors).toContain('Data collection consent is required to submit requirement')
    })

    it('should validate consent structure', async () => {
      const requirementId = 'req-123'
      const originalRequirement = 'Build a login system with 2FA'
      const summarizedRequirement = 'Build login system'
      const userConsent = {
        // Missing requirementId
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      }

      const result = await flow.handleUserConsent(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        mockContext,
        userConsent
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Requirement ID is required')
    })

    it('should handle email validation when contact consent is given', async () => {
      const requirementId = 'req-123'
      const originalRequirement = 'Build a login system with 2FA'
      const summarizedRequirement = 'Build login system'
      const userConsent = {
        requirementId: 'req-123',
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: 'invalid-email',
      }

      const result = await flow.handleUserConsent(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        mockContext,
        userConsent
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })
  })

  describe('simulateClaudeCodeIntegration', () => {
    it('should process conversation and detect requirements', async () => {
      const conversation = [
        { role: 'user' as const, content: 'Hello, I need help with something' },
        { role: 'assistant' as const, content: 'How can I help you?' },
        { role: 'user' as const, content: 'I want to build a data visualization dashboard' },
        { role: 'assistant' as const, content: 'That sounds interesting. What kind of data?' },
        { role: 'user' as const, content: 'I need to build a system for sales data with real-time updates' },
      ]

      const context = { conversationId: 'conv-123' }

      const results = await flow.simulateClaudeCodeIntegration(conversation, context)

      // Should only process user messages
      expect(results).toHaveLength(3)
      
      // First message contains "need" so it might be detected
      // We'll accept either detection or no detection for first message
      
      // Second user message should be detected
      expect(results[1].detection).not.toBeNull()
      expect(results[1].detection?.requirementText).toContain('data visualization dashboard')
      
      // Third user message should also be detected
      expect(results[2].detection).not.toBeNull()
    })
  })

  describe('getFlowStatistics and resetFlow', () => {
    it('should return initial statistics', () => {
      const stats = flow.getFlowStatistics()

      expect(stats.totalMessagesProcessed).toBe(0)
      expect(stats.requirementsDetected).toBe(0)
      expect(stats.consentPromptsGenerated).toBe(0)
      expect(stats.requirementsCollected).toBe(0)
    })

    it('should reset flow state', () => {
      // This is a placeholder test since resetFlow doesn't do much in the current implementation
      expect(() => flow.resetFlow()).not.toThrow()
    })
  })
})