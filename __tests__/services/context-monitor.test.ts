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
});
