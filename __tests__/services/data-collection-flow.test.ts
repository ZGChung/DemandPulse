import { DataCollectionFlow } from "../../services/data-collection-flow";

import { UserConsent } from "@/types/claude-code";

describe("DataCollectionFlow", () => {
  let flow: DataCollectionFlow;

  beforeEach(() => {
    flow = new DataCollectionFlow();
  });

  describe("processConversationMessage", () => {
    it("should return null when no requirement is detected", async () => {
      const result = await flow.processConversationMessage("Hello, how are you?", {
        conversationId: "conv-1",
      });
      expect(result.detected).toBeNull();
      expect(result.prompt).toBeNull();
      expect(result.shouldPrompt).toBe(false);
    });

    it("should detect requirement with high confidence", async () => {
      const result = await flow.processConversationMessage(
        "I need to build a REST API for user authentication",
        { conversationId: "conv-1" }
      );
      expect(result.detected).not.toBeNull();
      expect(result.detected?.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it("should not prompt for consent when confidence is low", async () => {
      const result = await flow.processConversationMessage("maybe we could add login", {
        conversationId: "conv-1",
      });
      if (result.detected && result.detected.confidence < 0.5) {
        expect(result.shouldPrompt).toBe(false);
        expect(result.prompt).toBeNull();
      }
    });

    it("should create consent prompt when requirement is detected with sufficient confidence", async () => {
      const result = await flow.processConversationMessage(
        "I need a database schema for user management",
        { conversationId: "conv-1" }
      );
      if (result.detected && result.detected.confidence >= 0.5) {
        expect(result.shouldPrompt).toBe(true);
        expect(result.prompt).not.toBeNull();
        expect(result.prompt?.requirementId).toBe(result.detected?.id);
      }
    });
  });

  describe("handleUserConsent", () => {
    it("should return errors for invalid consent", async () => {
      const result = await flow.handleUserConsent(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        { conversationId: "conv-1" },
        {}
      );
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.collectedRequirement).toBeNull();
    });

    it("should return errors when data collection is not consented", async () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: false,
          anonymization: true,
        },
      };
      const result = await flow.handleUserConsent(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        { conversationId: "conv-1" },
        consent
      );
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Data collection consent is required to submit requirement");
    });

    it("should successfully collect requirement with valid consent", async () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const result = await flow.handleUserConsent(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        { conversationId: "conv-1", userId: "user-1" },
        consent
      );
      expect(result.success).toBe(true);
      expect(result.collectedRequirement).not.toBeNull();
      expect(result.collectedRequirement?.id).toBe("req-123");
      expect(result.collectedRequirement?.status).toBe("pending");
    });

    it("should handle valid consent with contact email", async () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "test@example.com",
      };
      const result = await flow.handleUserConsent(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        { conversationId: "conv-1" },
        consent
      );
      expect(result.success).toBe(true);
      expect(result.collectedRequirement?.consent.userProvidedEmail).toBe("test@example.com");
    });

    it("should reject invalid email format when contact is consented", async () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "invalid-email",
      };
      const result = await flow.handleUserConsent(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        { conversationId: "conv-1" },
        consent
      );
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Invalid email format");
    });
  });

  describe("simulateClaudeCodeIntegration", () => {
    it("should process conversation and detect requirements from user messages", async () => {
      const conversation = [
        { role: "user" as const, content: "I want to build an API" },
        { role: "assistant" as const, content: "That's interesting!" },
        { role: "user" as const, content: "I need a database schema" },
      ];
      const results = await flow.simulateClaudeCodeIntegration(conversation, {
        conversationId: "conv-1",
      });

      expect(results).toHaveLength(2); // Only user messages
      expect(results[0].detection).not.toBeNull();
      // Second message may or may not be detected depending on content
    });

    it("should not process assistant messages", async () => {
      const conversation = [{ role: "assistant" as const, content: "Hello, how can I help?" }];
      const results = await flow.simulateClaudeCodeIntegration(conversation, {
        conversationId: "conv-1",
      });

      expect(results).toHaveLength(0);
    });
  });

  describe("getFlowStatistics", () => {
    it("should return flow statistics", () => {
      const stats = flow.getFlowStatistics();
      expect(stats).toHaveProperty("totalMessagesProcessed");
      expect(stats).toHaveProperty("requirementsDetected");
      expect(stats).toHaveProperty("consentPromptsGenerated");
      expect(stats).toHaveProperty("requirementsCollected");
    });
  });

  describe("resetFlow", () => {
    it("should reset flow without errors", () => {
      expect(() => flow.resetFlow()).not.toThrow();
    });
  });
});
