import { RequirementDetectionService } from "@/services/requirement-detection";

describe("RequirementDetectionService", () => {
  let service: RequirementDetectionService;

  beforeEach(() => {
    service = new RequirementDetectionService();
  });

  describe("detectRequirement", () => {
    it("should detect requirement in text with keywords", () => {
      const text = "I need to build a tool that automates database backups";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result).not.toBeNull();
      expect(result?.requirementText).toBe(text);
      expect(result?.confidence).toBeGreaterThan(0.3);
      expect(result?.metadata.keywords).toContain("build");
      expect(result?.metadata.keywords).toContain("tool");
      expect(result?.metadata.keywords).toContain("automates");
      expect(result?.metadata.intent).toBe("new_tool");
    });

    it("should return null for text without requirement keywords", () => {
      const text = "The weather is nice today";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result).toBeNull();
    });

    it("should return null when confidence is below threshold", () => {
      // Very short text with minimal keywords
      const text = "build";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result).toBeNull();
    });

    it("should correctly identify feature request intent", () => {
      const text = "I want to add a new feature to the application";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result?.metadata.intent).toBe("feature_request");
    });

    it("should correctly identify bug fix intent", () => {
      const text = "There is a bug in the login system that needs fixing";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result?.metadata.intent).toBe("bug_fix");
    });

    it("should include context information in detection", () => {
      const text = "I want to create a better user interface";
      const context = {
        conversationId: "test-conv-123",
        userId: "user-456",
        workspacePath: "/projects/test",
        conversationLength: 5,
      };

      const result = service.detectRequirement(text, context);

      expect(result?.context.conversationId).toBe("test-conv-123");
      expect(result?.context.userId).toBe("user-456");
      expect(result?.context.workspacePath).toBe("/projects/test");
      expect(result?.metadata.conversationLength).toBe(5);
    });
  });

  describe("summarizeRequirement", () => {
    it("should summarize requirement text", () => {
      const text =
        "I need to build a tool that automates database backups. This tool should run daily and send notifications if backups fail. It should also compress the backups to save storage space.";

      const summary = service.summarizeRequirement(text);

      expect(summary).toBe("I need to build a tool that automates database backups");
      expect(summary.length).toBeLessThanOrEqual(200);
    });

    it("should handle very long first sentence", () => {
      const longSentence =
        "I want to create a comprehensive data analytics platform that integrates with multiple data sources, provides real-time dashboards, supports custom reporting, includes machine learning predictions, and offers API access for third-party integrations, all while maintaining high performance and scalability.";

      const summary = service.summarizeRequirement(longSentence);

      expect(summary).toContain("...");
      expect(summary.length).toBe(200);
    });

    it("should return trimmed text for single sentence", () => {
      const text = "Build a login system. ";

      const summary = service.summarizeRequirement(text);

      expect(summary).toBe("Build a login system");
    });

    it("should handle empty text", () => {
      const text = "";

      const summary = service.summarizeRequirement(text);

      expect(summary).toBe("");
    });
  });

  describe("confidence calculation", () => {
    it("should calculate higher confidence for clear requirements", () => {
      const text = "I need to build a new feature for user authentication with two-factor support";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      expect(result?.confidence).toBeGreaterThan(0.5);
    });

    it("should calculate lower confidence for ambiguous statements", () => {
      const text = "maybe build something";
      const context = { conversationId: "test-conv-123" };

      const result = service.detectRequirement(text, context);

      // This might still be detected but with low confidence
      if (result) {
        expect(result.confidence).toBeLessThan(0.5);
      }
    });
  });
});
