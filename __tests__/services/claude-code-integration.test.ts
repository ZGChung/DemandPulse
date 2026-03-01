import { describe, it, expect, jest } from "@jest/globals";

// Mock dependencies
jest.mock("@/services/auto-compact-service", () => ({
  autoCompactService: {
    updateConfig: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    getStatistics: jest.fn().mockReturnValue({ totalCompacts: 0, successfulCompacts: 0 }),
  },
}));

jest.mock("@/services/context-monitor", () => ({
  contextMonitor: {
    updateConfig: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    getStatistics: jest.fn().mockReturnValue({ totalMessages: 0, totalTokens: 0 }),
    getContextStatus: jest.fn().mockReturnValue({ usage: 0 }),
  },
}));

jest.mock("@/services/hook-manager", () => ({
  hookManager: {
    register: jest.fn(),
    trigger: jest.fn().mockResolvedValue(undefined),
    getStatistics: jest.fn().mockReturnValue({ totalEvents: 0 }),
  },
}));

import {
  ClaudeCodeIntegrationService,
  claudeCodeIntegration,
  ClaudeCodeIntegrationConfig,
} from "@/services/claude-code-integration";

describe("ClaudeCodeIntegrationService", () => {
  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const service = new ClaudeCodeIntegrationService();
      const config = service.getConfig();

      expect(config.enableContextMonitoring).toBe(true);
      expect(config.enableAutoCompact).toBe(true);
      expect(config.enableRequirementDetection).toBe(true);
      expect(config.autoStart).toBe(true);
      expect(config.verboseLogging).toBe(false);
      expect(config.persistenceEnabled).toBe(true);
      expect(config.monitoringInterval).toBe(30000);
      expect(config.maxConversationSize).toBe(1000);
      expect(config.compactThreshold).toBe(0.85);
    });

    it("should merge provided config with defaults", () => {
      const customConfig: Partial<ClaudeCodeIntegrationConfig> = {
        autoStart: false,
        verboseLogging: true,
        monitoringInterval: 60000,
      };

      const service = new ClaudeCodeIntegrationService(customConfig);
      const config = service.getConfig();

      expect(config.autoStart).toBe(false);
      expect(config.verboseLogging).toBe(true);
      expect(config.monitoringInterval).toBe(60000);
      // Defaults should still apply
      expect(config.enableContextMonitoring).toBe(true);
    });
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      expect(service.getStatus().initialized).toBe(true);
    });

    it("should not reinitialize if already initialized", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      // Should not throw
      await service.initialize();

      expect(service.getStatus().initialized).toBe(true);
    });

    it("should auto-start if configured", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: true });
      await service.initialize();

      // Wait a tick for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.isIntegrationActive()).toBe(true);
    });
  });

  describe("start", () => {
    it("should start if not initialized", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.start();

      expect(service.getStatus().initialized).toBe(true);
      expect(service.isIntegrationActive()).toBe(true);
    });

    it("should not restart if already active", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.start();
      await service.start();

      expect(service.isIntegrationActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop if active", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.start();
      await service.stop();

      expect(service.isIntegrationActive()).toBe(false);
    });

    it("should not throw if already stopped", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.stop();

      expect(service.isIntegrationActive()).toBe(false);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      service.updateConfig({ verboseLogging: true });

      expect(service.getConfig().verboseLogging).toBe(true);
    });

    it("should apply config changes when active", async () => {
      const service = new ClaudeCodeIntegrationService({
        autoStart: false,
        enableContextMonitoring: true,
      });
      await service.start();

      service.updateConfig({ enableContextMonitoring: false });

      // Config should be updated
      expect(service.getConfig().enableContextMonitoring).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should return current status", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();
      await service.start();

      const status = service.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.active).toBe(true);
      expect(status.contextMonitoring).toBe(true);
      expect(status.autoCompact).toBe(true);
      expect(status.requirementDetection).toBe(true);
      expect(status.statistics).toBeDefined();
    });
  });

  describe("triggerTestEvent", () => {
    it("should trigger hook events", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      await service.triggerTestEvent("conversation_start", { test: true });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("getter methods", () => {
    it("should return hook manager", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      const hookManager = service.getHookManager();
      expect(hookManager).toBeDefined();
    });

    it("should return context monitor", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      const contextMonitor = service.getContextMonitor();
      expect(contextMonitor).toBeDefined();
    });

    it("should return auto compact service", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.initialize();

      const autoCompact = service.getAutoCompactService();
      expect(autoCompact).toBeDefined();
    });
  });

  describe("isIntegrationActive", () => {
    it("should return false before start", () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      expect(service.isIntegrationActive()).toBe(false);
    });

    it("should return true after start", async () => {
      const service = new ClaudeCodeIntegrationService({ autoStart: false });
      await service.start();
      expect(service.isIntegrationActive()).toBe(true);
    });
  });

  describe("singleton", () => {
    it("should export a singleton instance", () => {
      expect(claudeCodeIntegration).toBeDefined();
      expect(claudeCodeIntegration.getConfig).toBeDefined();
    });
  });
});
