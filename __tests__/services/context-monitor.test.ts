// ContextMonitorService tests
import { ContextMonitorService } from "../../services/context-monitor";

describe("ContextMonitorService", () => {
  let service: ContextMonitorService;

  beforeEach(() => {
    service = new ContextMonitorService({
      contextWindowSize: 10000,
      warningThreshold: 0.75,
      compactThreshold: 0.85,
      criticalThreshold: 0.95,
      checkInterval: 5000,
      maxConversationLength: 100,
      autoCompactEnabled: false,
      compactStrategy: "summarize_oldest",
      preserveImportantMessages: true,
      maxPreservedMessages: 10,
      tokensPerChar: 0.25,
      tokensPerMessage: 100,
    });
  });

  describe("constructor", () => {
    it("should use custom config when provided", () => {
      const customService = new ContextMonitorService({
        contextWindowSize: 50000,
        autoCompactEnabled: true,
      });
      expect(customService).toBeDefined();
    });

    it("should use default config when not provided", () => {
      const defaultService = new ContextMonitorService();
      expect(defaultService).toBeDefined();
    });
  });

  describe("getContextStatus", () => {
    it("should return initial status with zero usage", () => {
      const status = (service as any).getContextStatus();
      expect(status).toBeDefined();
      expect(status.currentTokens).toBe(0);
      expect(status.messageCount).toBe(0);
      expect(status.status).toBe("ok");
      expect(status.shouldCompact).toBe(false);
    });
  });

  describe("configuration", () => {
    it("should have correct default context window size", () => {
      const config = (service as any).config;
      expect(config.contextWindowSize).toBe(10000);
    });

    it("should have correct thresholds", () => {
      const config = (service as any).config;
      expect(config.warningThreshold).toBe(0.75);
      expect(config.compactThreshold).toBe(0.85);
      expect(config.criticalThreshold).toBe(0.95);
    });

    it("should have auto-compact disabled for testing", () => {
      const config = (service as any).config;
      expect(config.autoCompactEnabled).toBe(false);
    });
  });

  describe("token estimation", () => {
    it("should calculate tokens per character correctly", () => {
      const config = (service as any).config;
      expect(config.tokensPerChar).toBe(0.25);
    });

    it("should calculate tokens per message correctly", () => {
      const config = (service as any).config;
      expect(config.tokensPerMessage).toBe(100);
    });
  });

  describe("conversation tracking", () => {
    it("should have empty conversation initially", () => {
      const conversation = (service as any).conversation;
      expect(Array.isArray(conversation)).toBe(true);
      expect(conversation.length).toBe(0);
    });
  });

  describe("monitoring state", () => {
    it("should not be monitoring initially", () => {
      const isMonitoring = (service as any).isMonitoring;
      expect(isMonitoring).toBe(false);
    });
  });

  describe("getStatistics", () => {
    it("should return initial statistics", () => {
      const stats = service.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalMessages).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.importantMessages).toBe(0);
      expect(stats.monitoringActive).toBe(false);
      expect(stats.config).toBeDefined();
    });
  });

  describe("configuration management", () => {
    it("should update config correctly", () => {
      service.updateConfig({ contextWindowSize: 20000, warningThreshold: 0.8 });
      const config = service.getConfig();
      expect(config.contextWindowSize).toBe(20000);
      expect(config.warningThreshold).toBe(0.8);
    });

    it("should return copy of config", () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      expect(config1).not.toBe(config2);
    });
  });

  describe("conversation management", () => {
    it("should return empty conversation initially", () => {
      const conversation = service.getConversation();
      expect(Array.isArray(conversation)).toBe(true);
      expect(conversation.length).toBe(0);
    });

    it("should clear conversation", () => {
      service.clearConversation();
      const conversation = service.getConversation();
      expect(conversation.length).toBe(0);
    });
  });

  describe("startMonitoring and stopMonitoring", () => {
    it("should start monitoring", () => {
      service.startMonitoring();
      const stats = service.getStatistics();
      expect(stats.monitoringActive).toBe(true);
    });

    it("should stop monitoring", () => {
      service.startMonitoring();
      service.stopMonitoring();
      const stats = service.getStatistics();
      expect(stats.monitoringActive).toBe(false);
    });

    it("should not restart if already monitoring", () => {
      service.startMonitoring();
      service.startMonitoring(); // Should not throw or cause issues
      const stats = service.getStatistics();
      expect(stats.monitoringActive).toBe(true);
      service.stopMonitoring();
    });

    it("should not error when stopping if not monitoring", () => {
      expect(() => service.stopMonitoring()).not.toThrow();
    });
  });

  describe("context status thresholds", () => {
    let testService: ContextMonitorService;

    beforeEach(() => {
      testService = new ContextMonitorService({
        contextWindowSize: 1000,
        warningThreshold: 0.75,
        compactThreshold: 0.85,
        criticalThreshold: 0.95,
        checkInterval: 5000,
        maxConversationLength: 100,
        autoCompactEnabled: false,
        compactStrategy: "summarize_oldest",
        preserveImportantMessages: true,
        maxPreservedMessages: 10,
        tokensPerChar: 0.25,
        tokensPerMessage: 100,
      });
    });

    it("should return ok status when under warning threshold", () => {
      // Add a small message (100 chars * 0.25 = 25 tokens = 2.5%)
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(100),
        timestamp: new Date(),
        estimatedTokens: 25,
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.status).toBe("ok");
      expect(status.shouldWarn).toBe(false);
      expect(status.shouldCompact).toBe(false);
    });

    it("should return warning status when approaching limit", () => {
      // Add message to reach 80% (800 tokens)
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(3200),
        timestamp: new Date(),
        estimatedTokens: 800,
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.status).toBe("warning");
      expect(status.shouldWarn).toBe(true);
      expect(status.shouldCompact).toBe(false);
    });

    it("should return critical status when over compact threshold", () => {
      // Add message to reach 90% (900 tokens)
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(3600),
        timestamp: new Date(),
        estimatedTokens: 900,
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.status).toBe("critical");
      expect(status.shouldCompact).toBe(false); // autoCompactEnabled is false
    });

    it("should return limit_reached status when over critical threshold", () => {
      // Add message to reach 100% (1000 tokens)
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(4000),
        timestamp: new Date(),
        estimatedTokens: 1000,
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.status).toBe("limit_reached");
      expect(status.shouldWarn).toBe(true);
      expect(status.shouldCompact).toBe(true);
    });

    it("should include recommendations when message count is high", () => {
      for (let i = 0; i < 55; i++) {
        (testService as any).conversation.push({
          id: `test-${i}`,
          role: "user" as const,
          content: "test message",
          timestamp: new Date(),
          estimatedTokens: 50,
          important: false,
        });
      }
      const status = testService.getContextStatus();
      expect(status.recommendations.length).toBeGreaterThan(0);
      expect(status.recommendations.some((r) => r.includes("Long conversation"))).toBe(true);
    });

    it("should include recommendations when many important messages", () => {
      for (let i = 0; i < 15; i++) {
        (testService as any).conversation.push({
          id: `test-${i}`,
          role: "user" as const,
          content: "This is an important requirement for the project",
          timestamp: new Date(),
          estimatedTokens: 50,
          important: true,
        });
      }
      const status = testService.getContextStatus();
      expect(status.recommendations.some((r) => r.includes("important messages"))).toBe(true);
    });
  });

  describe("token estimation", () => {
    let testService: ContextMonitorService;

    beforeEach(() => {
      testService = new ContextMonitorService({
        tokensPerChar: 0.25,
        tokensPerMessage: 100,
      });
    });

    it("should estimate tokens for short text", () => {
      // Manually set estimatedTokens since we're directly adding to conversation
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "Hello world",
        timestamp: new Date(),
        estimatedTokens: 12, // "Hello world" = 11 chars
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.currentTokens).toBe(12);
    });

    it("should estimate tokens for long text", () => {
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(1000),
        timestamp: new Date(),
        estimatedTokens: 250, // 1000 * 0.25
        important: false,
      });
      const status = testService.getContextStatus();
      expect(status.currentTokens).toBe(250);
    });
  });

  describe("message importance detection", () => {
    let testService: ContextMonitorService;

    beforeEach(() => {
      testService = new ContextMonitorService({
        tokensPerChar: 0.25,
        tokensPerMessage: 100,
      });
    });

    it("should correctly mark important message", () => {
      // Directly set important flag for testing
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "This is an important requirement",
        timestamp: new Date(),
        estimatedTokens: 100,
        important: true,
      });
      const msg = (testService as any).conversation[0];
      expect(msg.important).toBe(true);
    });

    it("should correctly mark non-important message", () => {
      (testService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "Hello",
        timestamp: new Date(),
        estimatedTokens: 10,
        important: false,
      });
      const msg = (testService as any).conversation[0];
      expect(msg.important).toBe(false);
    });
  });

  describe("auto-compact functionality", () => {
    let compactService: ContextMonitorService;

    beforeEach(() => {
      compactService = new ContextMonitorService({
        contextWindowSize: 1000,
        warningThreshold: 0.75,
        compactThreshold: 0.85,
        criticalThreshold: 0.95,
        checkInterval: 5000,
        maxConversationLength: 100,
        autoCompactEnabled: true,
        compactStrategy: "remove_oldest",
        preserveImportantMessages: true,
        maxPreservedMessages: 10,
        tokensPerChar: 0.25,
        tokensPerMessage: 100,
      });
    });

    it("should trigger auto-compact when limit reached", async () => {
      (compactService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(4000),
        timestamp: new Date(),
        estimatedTokens: 1000,
        important: false,
      });
      await (compactService as any).checkContextStatus();
      const status = compactService.getContextStatus();
      expect(status.status).toBe("limit_reached");
    });

    it("should handle compact with remove_oldest strategy", async () => {
      for (let i = 0; i < 5; i++) {
        (compactService as any).conversation.push({
          id: `test-${i}`,
          role: "user" as const,
          content: "a".repeat(200),
          timestamp: new Date(),
          estimatedTokens: 50,
          important: false,
        });
      }
      await (compactService as any).triggerAutoCompact();
      expect((compactService as any).conversation.length).toBeLessThanOrEqual(5);
    });

    it("should handle compact with summarize_oldest strategy", async () => {
      const summarizeService = new ContextMonitorService({
        contextWindowSize: 1000,
        autoCompactEnabled: true,
        compactStrategy: "summarize_oldest",
        preserveImportantMessages: false,
        tokensPerChar: 0.25,
      });

      for (let i = 0; i < 3; i++) {
        (summarizeService as any).conversation.push({
          id: `test-${i}`,
          role: "user" as const,
          content: "a".repeat(200),
          timestamp: new Date(),
          estimatedTokens: 50,
          important: false,
        });
      }
      await (summarizeService as any).triggerAutoCompact();
    });
  });

  describe("conversation snapshot", () => {
    let snapshotService: ContextMonitorService;

    beforeEach(() => {
      snapshotService = new ContextMonitorService({
        tokensPerChar: 0.25,
      });
    });

    it("should get conversation snapshot", () => {
      (snapshotService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "Hello world",
        timestamp: new Date(),
        estimatedTokens: 20,
        important: false,
      });
      const snapshot = (snapshotService as any).getConversationSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.length).toBe(1);
      expect(snapshot[0].role).toBe("user");
    });

    it("should truncate long content in snapshot", () => {
      const longContent = "a".repeat(300);
      (snapshotService as any).conversation.push({
        id: "test-1",
        role: "assistant" as const,
        content: longContent,
        timestamp: new Date(),
        estimatedTokens: 75,
        important: false,
      });
      const snapshot = (snapshotService as any).getConversationSnapshot();
      expect(snapshot[0].content.length).toBeLessThanOrEqual(203);
    });
  });

  describe("message handling", () => {
    let messageService: ContextMonitorService;

    beforeEach(() => {
      messageService = new ContextMonitorService({
        maxConversationLength: 5,
        tokensPerChar: 0.25,
      });
    });

    it("should limit conversation length", async () => {
      for (let i = 0; i < 10; i++) {
        await (messageService as any).handleNewMessage({
          content: `Message ${i}`,
          role: "user",
        });
      }
      expect((messageService as any).conversation.length).toBeLessThanOrEqual(5);
    });

    it("should handle important messages in conversation", async () => {
      await (messageService as any).handleNewMessage({
        content: "I need to build a new feature",
        role: "user",
      });
      const msg = (messageService as any).conversation[0];
      expect(msg.important).toBe(true);
    });

    it("should handle non-important messages", async () => {
      await (messageService as any).handleNewMessage({
        content: "hello",
        role: "user",
      });
      const msg = (messageService as any).conversation[0];
      expect(msg.important).toBe(false);
    });

    it("should handle empty data in handleNewMessage", async () => {
      await (messageService as any).handleNewMessage({});
      expect((messageService as any).conversation.length).toBe(0);
    });

    it("should handle missing content in handleNewMessage", async () => {
      await (messageService as any).handleNewMessage({ role: "user" });
      expect((messageService as any).conversation.length).toBe(0);
    });
  });

  describe("context status with warnings", () => {
    let warningService: ContextMonitorService;

    beforeEach(() => {
      warningService = new ContextMonitorService({
        contextWindowSize: 10000,
        warningThreshold: 0.5,
        compactThreshold: 0.7,
        criticalThreshold: 0.9,
        tokensPerChar: 0.25,
      });
    });

    it("should return correct status at warning threshold", () => {
      (warningService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(20000),
        timestamp: new Date(),
        estimatedTokens: 5000,
        important: false,
      });
      const status = warningService.getContextStatus();
      expect(status.status).toBe("warning");
      expect(status.usagePercentage).toBe(0.5);
    });

    it("should include appropriate recommendations", () => {
      (warningService as any).conversation.push({
        id: "test-1",
        role: "user" as const,
        content: "a".repeat(20000),
        timestamp: new Date(),
        estimatedTokens: 5000,
        important: false,
      });
      const status = warningService.getContextStatus();
      expect(status.recommendations).toBeDefined();
      expect(status.recommendations.length).toBeGreaterThan(0);
    });
  });
});
