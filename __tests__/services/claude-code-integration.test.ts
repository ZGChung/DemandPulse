import { ClaudeCodeIntegrationService } from "../../services/claude-code-integration";

// Mock dependencies
jest.mock("../../services/auto-compact-service", () => ({
  autoCompactService: {
    updateConfig: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    getStatistics: jest.fn(() => ({
      totalCompacts: 0,
      successfulCompacts: 0,
      failedCompacts: 0,
    })),
  },
}));

jest.mock("../../services/context-monitor", () => ({
  contextMonitor: {
    updateConfig: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    getStatistics: jest.fn(() => ({
      totalMessages: 0,
      totalTokens: 0,
    })),
    getContextStatus: jest.fn(() => ({
      usage: 0,
      limit: 1000,
    })),
  },
}));

jest.mock("../../services/hook-manager", () => ({
  hookManager: {
    register: jest.fn(),
    trigger: jest.fn(),
    getStatistics: jest.fn(() => ({
      totalEvents: 0,
    })),
  },
}));

describe("ClaudeCodeIntegrationService", () => {
  let service: ClaudeCodeIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      service = new ClaudeCodeIntegrationService();
      const config = service.getConfig();

      expect(config.enableContextMonitoring).toBe(true);
      expect(config.enableAutoCompact).toBe(true);
      expect(config.enableRequirementDetection).toBe(true);
      expect(config.autoStart).toBe(true);
    });

    it("should merge provided config with defaults", () => {
      service = new ClaudeCodeIntegrationService({
        autoStart: false,
        verboseLogging: true,
      });
      const config = service.getConfig();

      expect(config.autoStart).toBe(false);
      expect(config.verboseLogging).toBe(true);
      expect(config.enableContextMonitoring).toBe(true); // default
    });
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });

      await service.initialize();

      const status = service.getStatus();
      expect(status.initialized).toBe(true);
    });

    it("should not re-initialize if already initialized", async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });

      await service.initialize();
      await service.initialize();

      // Should only initialize once - verify by checking status
      const status = service.getStatus();
      expect(status.initialized).toBe(true);
    });

    it("should auto-start if configured", async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: true });

      await service.initialize();

      const status = service.getStatus();
      expect(status.active).toBe(true);
    });
  });

  describe("start/stop", () => {
    beforeEach(async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();
    });

    it("should start the integration", async () => {
      await service.start();

      const status = service.getStatus();
      expect(status.active).toBe(true);
    });

    it("should not restart if already active", async () => {
      await service.start();
      await service.start();

      const status = service.getStatus();
      expect(status.active).toBe(true);
    });

    it("should stop the integration", async () => {
      await service.start();
      await service.stop();

      const status = service.getStatus();
      expect(status.active).toBe(false);
    });

    it("should not error when stopping if already stopped", async () => {
      await service.stop();

      const status = service.getStatus();
      expect(status.active).toBe(false);
    });

    it("should initialize if not initialized when starting", async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });

      await service.start();

      const status = service.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.active).toBe(true);
    });
  });

  describe("updateConfig", () => {
    beforeEach(async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();
    });

    it("should update configuration", () => {
      service.updateConfig({ verboseLogging: true });

      const config = service.getConfig();
      expect(config.verboseLogging).toBe(true);
    });

    it("should apply configuration when active", () => {
      service.updateConfig({ enableContextMonitoring: false });

      const status = service.getStatus();
      // Configuration should be updated
      expect(status.contextMonitoring).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should return correct status before initialization", () => {
      service = new ClaudeCodeIntegrationService();

      const status = service.getStatus();

      expect(status.initialized).toBe(false);
      expect(status.active).toBe(false);
    });

    it("should return correct status after initialization", async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      const status = service.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.contextMonitoring).toBe(true);
      expect(status.autoCompact).toBe(true);
      expect(status.requirementDetection).toBe(true);
    });
  });

  describe("triggerTestEvent", () => {
    beforeEach(async () => {
      service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();
    });

    it("should trigger hook events", async () => {
      const { hookManager } = require("../../services/hook-manager");

      await service.triggerTestEvent("conversation_start", { test: true });

      expect(hookManager.trigger).toHaveBeenCalledWith("conversation_start", { test: true });
    });
  });

  describe("getHookManager", () => {
    it("should return the hook manager instance", () => {
      service = new ClaudeCodeIntegrationService();

      const hm = service.getHookManager();

      expect(hm).toBeDefined();
    });
  });
});
