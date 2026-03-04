import { describe, it, expect, beforeEach } from "@jest/globals";

import { RequirementDetectionService } from "@/services/requirement-detection";

describe("RequirementDetectionService", () => {
  let service: RequirementDetectionService;

  beforeEach(() => {
    service = new RequirementDetectionService();
  });

  describe("detectRequirement", () => {
    it("should detect requirement with build keyword", () => {
      const result = service.detectRequirement("I need to build a new feature for my project", {
        conversationId: "conv-123",
        userId: "user-1",
      });
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(0);
    });

    it("should detect requirement with create keyword", () => {
      const result = service.detectRequirement(
        "I want to create an automation script for testing my workflow",
        {
          conversationId: "conv-123",
        }
      );
      expect(result).not.toBeNull();
    });

    it("should detect requirement with make keyword", () => {
      const result = service.detectRequirement(
        "Can you make a tool for this workflow that I need?",
        {
          conversationId: "conv-123",
        }
      );
      expect(result).not.toBeNull();
    });

    it("should return null for non-requirement text", () => {
      const result = service.detectRequirement("Hello, how are you today?", {
        conversationId: "conv-123",
      });
      expect(result).toBeNull();
    });

    it("should return null for low confidence text", () => {
      const result = service.detectRequirement("hi", {
        conversationId: "conv-123",
      });
      expect(result).toBeNull();
    });

    it("should detect requirement with I need phrase", () => {
      const result = service.detectRequirement("I need a new API endpoint for my application", {
        conversationId: "conv-123",
        userId: "user-1",
        workspacePath: "/workspace/test",
      });
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(0.3);
    });

    it("should detect requirement with I want phrase", () => {
      const result = service.detectRequirement(
        "I want to improve the database performance significantly",
        {
          conversationId: "conv-123",
        }
      );
      expect(result).not.toBeNull();
    });

    it("should detect requirement with would be great phrase", () => {
      const result = service.detectRequirement(
        "It would be great to have a dashboard for monitoring my tasks",
        {
          conversationId: "conv-123",
        }
      );
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(0.3);
    });

    it("should detect requirement with should have phrase", () => {
      const result = service.detectRequirement(
        "We should have better error handling in place for production",
        {
          conversationId: "conv-123",
        }
      );
      expect(result).not.toBeNull();
    });

    it("should include context in detection result", () => {
      const result = service.detectRequirement(
        "I need to build something important here for my work",
        {
          conversationId: "conv-123",
          userId: "user-1",
          workspacePath: "/workspace/myproject",
          conversationLength: 50,
        }
      );
      expect(result).not.toBeNull();
      expect(result?.context.conversationId).toBe("conv-123");
      expect(result?.context.userId).toBe("user-1");
      expect(result?.context.workspacePath).toBe("/workspace/myproject");
    });

    it("should handle missing context gracefully", () => {
      const result = service.detectRequirement(
        "I need to create a new tool for automation in my project",
        {}
      );
      expect(result).not.toBeNull();
      expect(result?.context.conversationId).toBe("unknown");
    });

    it("should extract keywords from requirement text", () => {
      const result = service.detectRequirement(
        "I need to build a new API and database integration for my project",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.keywords).toContain("build");
      expect(result?.metadata.keywords).toContain("need");
    });

    it("should add tech keywords to extracted keywords", () => {
      const result = service.detectRequirement(
        "I need to create a new API for the backend database in my project",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.keywords).toContain("api");
      expect(result?.metadata.keywords).toContain("backend");
    });

    it("should detect feature_request intent", () => {
      const result = service.detectRequirement(
        "I need to add new functionality to the system for better user experience",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.intent).toBe("feature_request");
    });

    it("should detect bug_fix intent", () => {
      const result = service.detectRequirement(
        "Fix the error in the login system that is causing issues",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.intent).toBe("bug_fix");
    });

    it("should detect improvement intent", () => {
      const result = service.detectRequirement(
        "I want to improve the performance of the database query significantly in production",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.intent).toBe("improvement");
    });

    it("should detect new_tool intent", () => {
      const result = service.detectRequirement(
        "Create a new automation tool for testing the workflow daily",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.intent).toBe("new_tool");
    });

    it("should default to other intent when no pattern matches", () => {
      const result = service.detectRequirement(
        "I need something generic that helps with daily tasks and workflows",
        { conversationId: "conv-123" }
      );
      expect(result).not.toBeNull();
      expect(result?.metadata.intent).toBe("other");
    });

    it("should give higher confidence for question marks", () => {
      const result1 = service.detectRequirement(
        "Can you build me a tool for automation that will help with my work?",
        { conversationId: "conv-123" }
      );
      const result2 = service.detectRequirement(
        "Can you build me a tool for automation that will help with my work",
        { conversationId: "conv-123" }
      );
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });

    it("should give higher confidence for longer text", () => {
      const shortResult = service.detectRequirement("I need to build something", {
        conversationId: "conv-123",
      });
      const optimalResult = service.detectRequirement(
        "I need to build a comprehensive feature that will help with automation and workflow management",
        { conversationId: "conv-123" }
      );
      expect(optimalResult?.confidence).toBeGreaterThan(shortResult?.confidence || 0);
    });

    it("should return unique ID for each detection", () => {
      const result1 = service.detectRequirement("I need to build a tool for my project", {
        conversationId: "conv-1",
      });
      const result2 = service.detectRequirement(
        "I need to build another tool for different purpose",
        { conversationId: "conv-2" }
      );
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1?.id).not.toBe(result2?.id);
    });
  });

  describe("summarizeRequirement", () => {
    it("should return first sentence as summary", () => {
      const summary = service.summarizeRequirement(
        "This is the first sentence. This is the second sentence."
      );
      expect(summary).toBe("This is the first sentence");
    });

    it("should handle text without punctuation", () => {
      const summary = service.summarizeRequirement("This is a simple sentence");
      expect(summary).toBe("This is a simple sentence");
    });

    it("should truncate long first sentences", () => {
      const longSentence = "A".repeat(250);
      const summary = service.summarizeRequirement(longSentence);
      expect(summary.length).toBe(200);
      expect(summary.endsWith("...")).toBe(true);
    });

    it("should handle empty text", () => {
      const summary = service.summarizeRequirement("");
      expect(summary).toBe("");
    });

    it("should handle text with only whitespace", () => {
      const summary = service.summarizeRequirement("   ");
      expect(summary).toBe("");
    });

    it("should handle text ending with multiple punctuation", () => {
      const summary = service.summarizeRequirement("Short text!!!");
      expect(summary).toBe("Short text");
    });
  });
});
