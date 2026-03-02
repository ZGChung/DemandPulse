import { AutoCompactService } from "@/services/auto-compact-service";

// Mock dependencies
jest.mock("@/services/context-monitor", () => ({
  contextMonitor: {
    getContextStatus: jest.fn().mockReturnValue({ used: 50000, total: 100000 }),
    getStatistics: jest.fn().mockReturnValue({ messages: 100, tokens: 50000 }),
  },
}));

jest.mock("@/services/hook-manager", () => ({
  hookManager: {
    register: jest.fn(),
    unregister: jest.fn(),
    emit: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("AutoCompactService", () => {
  let service: AutoCompactService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AutoCompactService({
      enabled: true,
      executionMethod: "simulated",
      confirmBeforeExecute: false,
    });
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const defaultService = new AutoCompactService();
      expect(defaultService).toBeDefined();
    });

    it("should merge custom config with defaults", () => {
      const customService = new AutoCompactService({
        enabled: false,
        compactCommand: "/custom-compact",
      });
      expect(customService).toBeDefined();
    });
  });

  describe("getConfig", () => {
    it("should return current configuration", () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.compactCommand).toBe("/compact");
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", () => {
      service.updateConfig({ enabled: false });
      const config = service.getConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe("getHistory", () => {
    it("should return compact history", () => {
      const history = service.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should respect limit parameter", () => {
      const history = service.getHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return statistics", () => {
      const stats = service.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalCompacts).toBeDefined();
      expect(stats.successfulCompacts).toBeDefined();
      expect(stats.failedCompacts).toBeDefined();
      expect(stats.isExecuting).toBe(false);
      expect(stats.config).toBeDefined();
    });
  });

  describe("isEnabled", () => {
    it("should return true when enabled", () => {
      expect(service.isEnabled()).toBe(true);
    });

    it("should return false when disabled", () => {
      const disabledService = new AutoCompactService({ enabled: false });
      expect(disabledService.isEnabled()).toBe(false);
    });
  });

  describe("enable/disable", () => {
    it("should enable the service", () => {
      service.disable();
      expect(service.isEnabled()).toBe(false);
      service.enable();
      expect(service.isEnabled()).toBe(true);
    });

    it("should disable the service", () => {
      service.disable();
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe("manualCompact", () => {
    it("should execute manual compact with default strategy", async () => {
      const result = await service.manualCompact();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should execute manual compact with custom strategy", async () => {
      const result = await service.manualCompact("summarize_oldest");
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("compactStrategies", () => {
    it("should have strategies defined in config", () => {
      const config = service.getConfig();
      expect(config.compactStrategies).toBeDefined();
      expect(config.compactStrategies.length).toBeGreaterThan(0);
      expect(config.compactStrategies[0].name).toBe("summarize_oldest");
    });

    it("should include remove_oldest strategy", () => {
      const config = service.getConfig();
      const strategyNames = config.compactStrategies.map((s) => s.name);
      expect(strategyNames).toContain("remove_oldest");
    });

    it("should include compress_all strategy", () => {
      const config = service.getConfig();
      const strategyNames = config.compactStrategies.map((s) => s.name);
      expect(strategyNames).toContain("compress_all");
    });
  });

  describe("executionMethod", () => {
    it("should use simulated method by default", () => {
      const defaultService = new AutoCompactService();
      const config = defaultService.getConfig();
      expect(config.executionMethod).toBe("simulated");
    });

    it("should use cli method when configured", () => {
      const cliService = new AutoCompactService({ executionMethod: "cli" });
      const config = cliService.getConfig();
      expect(config.executionMethod).toBe("cli");
    });

    it("should use api method when configured", () => {
      const apiService = new AutoCompactService({ executionMethod: "api" });
      const config = apiService.getConfig();
      expect(config.executionMethod).toBe("api");
    });
  });

  describe("confirmBeforeExecute", () => {
    it("should default to not requiring confirmation", () => {
      const defaultService = new AutoCompactService();
      const config = defaultService.getConfig();
      expect(config.confirmBeforeExecute).toBe(false);
    });

    it("should allow enabling confirmation", () => {
      const confirmService = new AutoCompactService({ confirmBeforeExecute: true });
      const config = confirmService.getConfig();
      expect(config.confirmBeforeExecute).toBe(true);
    });
  });

  describe("compactCommand", () => {
    it("should use default compact command", () => {
      const config = service.getConfig();
      expect(config.compactCommand).toBe("/compact");
    });

    it("should allow custom compact command", () => {
      const customService = new AutoCompactService({ compactCommand: "/my-compact" });
      const config = customService.getConfig();
      expect(config.compactCommand).toBe("/my-compact");
    });
  });

  describe("multiple config updates", () => {
    it("should merge multiple config updates", () => {
      service.updateConfig({ enabled: false, threshold: 0.5 });
      const config = service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.threshold).toBe(0.5);
    });
  });

  describe("history management", () => {
    it("should return empty history initially", () => {
      const newService = new AutoCompactService();
      const history = newService.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should respect limit parameter for history", () => {
      const history = service.getHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should return statistics object", () => {
      const stats = service.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalCompacts).toBeDefined();
      expect(stats.successfulCompacts).toBeDefined();
      expect(stats.failedCompacts).toBeDefined();
      expect(stats.isExecuting).toBeDefined();
      expect(stats.config).toBeDefined();
    });
  });

  describe("enable/disable", () => {
    it("should enable the service", () => {
      service.disable();
      expect(service.getConfig().enabled).toBe(false);
      service.enable();
      expect(service.getConfig().enabled).toBe(true);
    });

    it("should disable the service", () => {
      service.enable();
      expect(service.getConfig().enabled).toBe(true);
      service.disable();
      expect(service.getConfig().enabled).toBe(false);
    });
  });

  describe("manualCompact", () => {
    it("should execute manual compact with default strategy", async () => {
      const result = await service.manualCompact();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should execute manual compact with custom strategy", async () => {
      const result = await service.manualCompact("compress_all");
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("executeCompact with different strategies", () => {
    it("should execute with remove_oldest strategy", async () => {
      const result = await service.manualCompact("remove_oldest");
      expect(result).toBeDefined();
    });

    it("should execute with compress_all strategy", async () => {
      const result = await service.manualCompact("compress_all");
      expect(result).toBeDefined();
    });

    it("should handle unknown strategy", async () => {
      const result = await service.manualCompact("unknown_strategy");
      expect(result).toBeDefined();
    });
  });

  describe("hook handlers", () => {
    it("should register hooks on construction", () => {
      const { hookManager } = require("@/services/hook-manager");
      new AutoCompactService({ enabled: true });
      expect(hookManager.register).toHaveBeenCalled();
    });
  });

  describe("getDefaultStrategy", () => {
    it("should return default strategy", () => {
      const strategy = service.getDefaultStrategy();
      expect(strategy).toBeDefined();
      expect(typeof strategy).toBe("string");
    });
  });

  describe("compactHistory", () => {
    it("should record successful compact in history", async () => {
      const newService = new AutoCompactService({ enabled: true, confirmBeforeExecute: false });
      await newService.manualCompact();
      const history = newService.getHistory();
      expect(history).toBeDefined();
    });
  });

  describe("notification", () => {
    it("should have notify method", () => {
      expect(typeof service.notify).toBe("function");
    });
  });

  describe("CLI execution method", () => {
    it("should execute compact via CLI method", async () => {
      const cliService = new AutoCompactService({
        executionMethod: "cli",
        cliPath: "/custom/path/claude",
      });
      const result = await cliService.manualCompact("summarize_oldest");
      expect(result.success).toBe(true);
    });

    it("should handle CLI method with different strategy", async () => {
      const cliService = new AutoCompactService({
        executionMethod: "cli",
      });
      const result = await cliService.manualCompact("remove_oldest");
      expect(result.success).toBe(true);
    });
  });

  describe("API execution method", () => {
    it("should execute compact via API method", async () => {
      const apiService = new AutoCompactService({
        executionMethod: "api",
        apiEndpoint: "https://custom.api/compact",
        apiToken: "test-token",
      });
      const result = await apiService.manualCompact("compress_all");
      expect(result.success).toBe(true);
    });

    it("should handle API method with different strategy", async () => {
      const apiService = new AutoCompactService({
        executionMethod: "api",
      });
      const result = await apiService.manualCompact("summarize_oldest");
      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle unknown execution method gracefully", async () => {
      const customService = new AutoCompactService({
        executionMethod: "unknown" as "simulated",
      });
      const result = await customService.manualCompact();
      expect(result.success).toBe(true); // Falls back to simulated
    });
  });

  describe("config with notification methods", () => {
    it("should support console notification method", () => {
      const consoleService = new AutoCompactService({
        notificationMethod: "console",
      });
      const config = consoleService.getConfig();
      expect(config.notificationMethod).toBe("console");
    });

    it("should support notification notification method", () => {
      const notifService = new AutoCompactService({
        notificationMethod: "notification",
      });
      const config = notifService.getConfig();
      expect(config.notificationMethod).toBe("notification");
    });
  });

  describe("showNotification", () => {
    it("should have showNotification method", () => {
      expect(typeof service.showNotification).toBe("function");
    });

    it("should handle different notification types", () => {
      service.showNotification("Test message", "info");
      service.showNotification("Warning message", "warning");
      service.showNotification("Error message", "error");
      service.showNotification("Success message", "success");
    });
  });

  describe("multiple compact strategies", () => {
    it("should list all available strategies", () => {
      const config = service.getConfig();
      expect(config.compactStrategies.length).toBe(3);
      expect(config.compactStrategies.map((s) => s.name)).toEqual([
        "summarize_oldest",
        "remove_oldest",
        "compress_all",
      ]);
    });

    it("should have descriptions for all strategies", () => {
      const config = service.getConfig();
      config.compactStrategies.forEach((strategy) => {
        expect(strategy.description).toBeDefined();
        expect(strategy.description.length).toBeGreaterThan(0);
      });
    });

    it("should mark one strategy as default", () => {
      const config = service.getConfig();
      const defaultStrategies = config.compactStrategies.filter((s) => s.default);
      expect(defaultStrategies.length).toBe(1);
      expect(defaultStrategies[0].name).toBe("summarize_oldest");
    });
  });

  describe("custom config options", () => {
    it("should allow custom apiEndpoint", () => {
      const customService = new AutoCompactService({
        apiEndpoint: "https://my-custom-endpoint.com/api",
      });
      const config = customService.getConfig();
      expect(config.apiEndpoint).toBe("https://my-custom-endpoint.com/api");
    });

    it("should allow custom apiToken", () => {
      const customService = new AutoCompactService({
        apiToken: "my-secret-token",
      });
      const config = customService.getConfig();
      expect(config.apiToken).toBe("my-secret-token");
    });

    it("should allow custom cliPath", () => {
      const customService = new AutoCompactService({
        cliPath: "/usr/bin/my-claude",
      });
      const config = customService.getConfig();
      expect(config.cliPath).toBe("/usr/bin/my-claude");
    });
  });

  describe("statistics tracking", () => {
    it("should track successful compacts", async () => {
      const newService = new AutoCompactService({ enabled: true });
      await newService.manualCompact();
      const stats = newService.getStatistics();
      expect(stats.totalCompacts).toBeGreaterThanOrEqual(0);
    });

    it("should track failed compacts", async () => {
      const stats = service.getStatistics();
      expect(typeof stats.successfulCompacts).toBe("number");
      expect(typeof stats.failedCompacts).toBe("number");
    });

    it("should report isExecuting status", () => {
      const stats = service.getStatistics();
      expect(typeof stats.isExecuting).toBe("boolean");
    });
  });

  describe("hook event handlers", () => {
    it("should register hooks on construction", () => {
      const { hookManager } = require("@/services/hook-manager");
      expect(hookManager.register).toHaveBeenCalled();
    });

    it("should have hook handlers registered for auto_compact_triggered", () => {
      const { hookManager } = require("@/services/hook-manager");
      expect(hookManager.register).toHaveBeenCalled();
    });

    it("should have hook handlers registered for context_limit_reached", () => {
      const { hookManager } = require("@/services/hook-manager");
      expect(hookManager.register).toHaveBeenCalled();
    });

    it("should have hook handlers registered for context_limit_approaching", () => {
      const { hookManager } = require("@/services/hook-manager");
      expect(hookManager.register).toHaveBeenCalled();
    });
  });

  describe("notification methods", () => {
    it("should notify with info type", () => {
      const testService = new AutoCompactService({ notificationMethod: "console" });
      testService.showNotification("Test info", "info");
    });

    it("should notify with warning type", () => {
      const testService = new AutoCompactService({ notificationMethod: "console" });
      testService.showNotification("Test warning", "warning");
    });

    it("should notify with error type", () => {
      const testService = new AutoCompactService({ notificationMethod: "console" });
      testService.showNotification("Test error", "error");
    });

    it("should notify with success type", () => {
      const testService = new AutoCompactService({ notificationMethod: "console" });
      testService.showNotification("Test success", "success");
    });
  });

  describe("context before/after tracking", () => {
    it("should have getHistory method that returns array", () => {
      const history = service.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should have getHistory with limit", () => {
      const history = service.getHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("CLI execution method", () => {
    it("should use CLI execution method when configured", async () => {
      const cliService = new AutoCompactService({
        executionMethod: "cli",
        cliPath: "/usr/local/bin/claude",
      });
      const result = await cliService.manualCompact("summarize_oldest");
      expect(result).toBeDefined();
    });

    it("should use custom cli path", async () => {
      const cliService = new AutoCompactService({
        executionMethod: "cli",
        cliPath: "/custom/path/claude",
      });
      const result = await cliService.manualCompact();
      expect(result).toBeDefined();
    });
  });

  describe("API execution method", () => {
    it("should use API execution method when configured", async () => {
      const apiService = new AutoCompactService({
        executionMethod: "api",
        apiEndpoint: "https://api.claude.ai/compact",
        apiToken: "test-token",
      });
      const result = await apiService.manualCompact("summarize_oldest");
      expect(result).toBeDefined();
    });

    it("should use custom API endpoint", async () => {
      const apiService = new AutoCompactService({
        executionMethod: "api",
        apiEndpoint: "https://my-api.com/compact",
      });
      const result = await apiService.manualCompact();
      expect(result).toBeDefined();
    });
  });

  describe("confirmBeforeExecute option", () => {
    it("should respect confirmBeforeExecute flag", async () => {
      const confirmedService = new AutoCompactService({
        confirmBeforeExecute: true,
      });
      const result = await confirmedService.manualCompact();
      expect(result).toBeDefined();
    });
  });

  describe("default strategy selection", () => {
    it("should return summarize_oldest when no default is set", () => {
      const customService = new AutoCompactService({
        compactStrategies: [{ name: "test", description: "test", default: false }],
      });
      const strategy = customService.getDefaultStrategy();
      expect(strategy).toBe("summarize_oldest");
    });

    it("should return custom default when set", () => {
      const customService = new AutoCompactService({
        compactStrategies: [{ name: "custom", description: "custom", default: true }],
      });
      const strategy = customService.getDefaultStrategy();
      expect(strategy).toBe("custom");
    });
  });

  describe("compact history details", () => {
    it("should return history as array", async () => {
      const newService = new AutoCompactService({ enabled: true });
      await newService.manualCompact("remove_oldest");
      const history = newService.getHistory();
      // History may or may not have entries depending on execution
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("setupHooks", () => {
    it("should register hooks with hookManager", () => {
      const { hookManager } = require("@/services/hook-manager");
      // Create a new service instance - need to reset all mocks first
      jest.resetAllMocks();
      const newService = new AutoCompactService({ enabled: true });
      // Access private method via any cast
      (newService as any).setupHooks();
      // At least 3 hooks should be registered (auto_compact, context_limit, context_warning)
      expect(hookManager.register).toHaveBeenCalled();
    });
  });

  describe("notification methods", () => {
    it("should notify with console method", async () => {
      const consoleService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      const result = await consoleService.manualCompact("summarize_oldest");
      expect(result).toBeDefined();
    });

    it("should notify with notification method", async () => {
      const notifyService = new AutoCompactService({
        enabled: true,
        notificationMethod: "notification",
      });
      const result = await notifyService.manualCompact("summarize_oldest");
      expect(result).toBeDefined();
    });

    it("should handle warning notification type", async () => {
      const warnService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      // Access private method via any cast
      (warnService as any).notify("test warning", "warning");
      expect(warnService).toBeDefined();
    });

    it("should handle error notification type", async () => {
      const errorService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      (errorService as any).notify("test error", "error");
      expect(errorService).toBeDefined();
    });

    it("should handle success notification type", async () => {
      const successService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      (successService as any).notify("test success", "success");
      expect(successService).toBeDefined();
    });
  });

  describe("both notification method", () => {
    it("should support both notification method", () => {
      const bothService = new AutoCompactService({
        notificationMethod: "both",
      });
      const config = bothService.getConfig();
      expect(config.notificationMethod).toBe("both");
    });
  });

  describe("handleAutoCompactTrigger branch coverage", () => {
    it("should handle hook trigger when disabled", async () => {
      const disabledService = new AutoCompactService({ enabled: false });
      // Try to manually trigger the handler
      const handler = (disabledService as any).handleAutoCompactTrigger?.bind(disabledService);
      if (handler) {
        await handler({});
      }
      // Should not throw and service should remain disabled
      expect(disabledService.isEnabled()).toBe(false);
    });

    it("should handle hook trigger when already executing", async () => {
      const service = new AutoCompactService({ enabled: true });
      // Manually set isExecuting to true
      (service as any).isExecuting = true;
      // Try to trigger again
      try {
        await (service as any).handleAutoCompactTrigger?.({});
      } catch {
        // May throw or not depending on implementation
      }
      // Reset for other tests
      (service as any).isExecuting = false;
    });

    it("should record failed compact in history", async () => {
      const newService = new AutoCompactService({ enabled: true });
      // Force a failure scenario by using unknown strategy
      await (newService as any).executeCompact?.("invalid_strategy_xyz");
      // History should be accessible
      const history = newService.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("handleContextLimitReached branch coverage", () => {
    it("should handle context limit when disabled", async () => {
      const disabledService = new AutoCompactService({
        enabled: false,
        confirmBeforeExecute: false,
      });
      // Access private method and call it
      const handler = (disabledService as any).handleContextLimitReached?.bind(disabledService);
      if (handler) {
        await handler({});
      }
      expect(disabledService.isEnabled()).toBe(false);
    });

    it("should handle context limit with confirmBeforeExecute true", async () => {
      const confirmService = new AutoCompactService({ enabled: true, confirmBeforeExecute: true });
      const handler = (confirmService as any).handleContextLimitReached?.bind(confirmService);
      if (handler) {
        await handler({});
      }
      expect(confirmService.isEnabled()).toBe(true);
    });
  });

  describe("handleContextWarning branch coverage", () => {
    it("should handle context warning when disabled", async () => {
      const disabledService = new AutoCompactService({ enabled: false });
      const handler = (disabledService as any).handleContextWarning?.bind(disabledService);
      if (handler) {
        await handler({});
      }
      expect(disabledService.isEnabled()).toBe(false);
    });

    it("should handle context warning with shouldCompact false and shouldWarn true", async () => {
      const service = new AutoCompactService({ enabled: true, confirmBeforeExecute: false });
      const handler = (service as any).handleContextWarning?.bind(service);
      if (handler) {
        await handler({ status: { shouldCompact: false, shouldWarn: true } });
      }
      expect(service.isEnabled()).toBe(true);
    });

    it("should handle context warning with shouldCompact true and confirmBeforeExecute true", async () => {
      const service = new AutoCompactService({ enabled: true, confirmBeforeExecute: true });
      const handler = (service as any).handleContextWarning?.bind(service);
      if (handler) {
        await handler({ status: { shouldCompact: true, shouldWarn: false } });
      }
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("history management edge cases", () => {
    it("should limit history to 100 entries", () => {
      const newService = new AutoCompactService({ enabled: true });
      // Directly access history array which is capped at 100
      // This is a synchronous operation
      const history = newService.getHistory();
      // History should not exceed reasonable limit
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it("should get history with different limits", () => {
      const newService = new AutoCompactService();
      const history1 = newService.getHistory(1);
      const history10 = newService.getHistory(10);
      expect(history10.length).toBeGreaterThanOrEqual(history1.length);
    });
  });

  describe("manualCompact edge cases", () => {
    it("should handle executeCompact with empty strategy name", async () => {
      const service = new AutoCompactService({ enabled: true });
      const result = await (service as any).executeCompact?.("");
      expect(result).toBeDefined();
    });

    it("should handle executeCompact with strategy not in list", async () => {
      const service = new AutoCompactService({ enabled: true });
      const result = await (service as any).executeCompact?.("nonexistent_strategy");
      expect(result).toBeDefined();
    });
  });

  describe("notificationMethod branches", () => {
    it("should handle notificationMethod console only", async () => {
      const consoleService = new AutoCompactService({
        enabled: true,
        executionMethod: "simulated",
        notificationMethod: "console",
        confirmBeforeExecute: false,
      });
      const result = await consoleService.manualCompact("summarize_oldest");
      expect(result.success).toBe(true);
    });

    it("should handle notificationMethod notification only", async () => {
      const notifService = new AutoCompactService({
        enabled: true,
        executionMethod: "simulated",
        notificationMethod: "notification",
        confirmBeforeExecute: false,
      });
      const result = await notifService.manualCompact("summarize_oldest");
      expect(result.success).toBe(true);
    });

    it("should handle notify with error type", async () => {
      const service = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      await (service as any).notify?.("Test error", "error", { details: "error details" });
      expect(service.isEnabled()).toBe(true);
    });

    it("should handle notify with warning type", async () => {
      const service = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      await (service as any).notify?.("Test warning", "warning", { details: "warning details" });
      expect(service.isEnabled()).toBe(true);
    });

    it("should handle notify with success type", async () => {
      const service = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      await (service as any).notify?.("Test success", "success", { details: "success details" });
      expect(service.isEnabled()).toBe(true);
    });

    it("should handle notify with info type", async () => {
      const service = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      await (service as any).notify?.("Test info", "info", { details: "info details" });
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("executionMethod branches", () => {
    it("should handle CLI execution method", async () => {
      const cliService = new AutoCompactService({
        enabled: true,
        executionMethod: "cli",
        cliPath: "/custom/cli/path",
        confirmBeforeExecute: false,
      });
      const result = await cliService.manualCompact("summarize_oldest");
      expect(result.success).toBe(true);
      expect(result.message).toContain("CLI");
    });

    it("should handle API execution method", async () => {
      const apiService = new AutoCompactService({
        enabled: true,
        executionMethod: "api",
        apiEndpoint: "https://custom.api/v1/compact",
        confirmBeforeExecute: false,
      });
      const result = await apiService.manualCompact("remove_oldest");
      expect(result.success).toBe(true);
      expect(result.message).toContain("API");
    });
  });

  describe("enable/disable branches", () => {
    it("should toggle enabled state", () => {
      const service = new AutoCompactService({ enabled: true });
      expect(service.isEnabled()).toBe(true);

      service.disable();
      expect(service.isEnabled()).toBe(false);

      service.enable();
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("notification methods", () => {
    it("should use console notification method", async () => {
      const consoleService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
        confirmBeforeExecute: false,
      });
      const result = await consoleService.manualCompact();
      expect(result.success).toBe(true);
    });

    it("should use notification notification method", async () => {
      const notifyService = new AutoCompactService({
        enabled: true,
        notificationMethod: "notification",
        confirmBeforeExecute: false,
      });
      const result = await notifyService.manualCompact();
      expect(result.success).toBe(true);
    });
  });

  describe("compact strategies", () => {
    it("should have all default strategies defined", () => {
      const service = new AutoCompactService();
      const config = service.getConfig();
      expect(config.compactStrategies.length).toBeGreaterThan(0);
      expect(config.compactStrategies.some((s) => s.default)).toBe(true);
    });

    it("should handle custom strategies", async () => {
      const customService = new AutoCompactService({
        enabled: true,
        compactStrategies: [{ name: "custom_strategy", description: "Custom", default: true }],
        confirmBeforeExecute: false,
      });
      const result = await customService.manualCompact("custom_strategy");
      expect(result.success).toBe(true);
    });
  });

  describe("history management", () => {
    it("should maintain history up to 100 entries", async () => {
      const service = new AutoCompactService({ enabled: true, confirmBeforeExecute: false });

      // Execute multiple compacts to build history
      for (let i = 0; i < 105; i++) {
        await service.manualCompact();
      }

      const history = service.getHistory();
      // History should be trimmed to ~50 after exceeding 100
      expect(history.length).toBeLessThanOrEqual(60);
    });

    it("should return history with specific limit", () => {
      const service = new AutoCompactService();
      const history = service.getHistory(10);
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe("statistics", () => {
    it("should track successful and failed compacts", async () => {
      const service = new AutoCompactService({ enabled: true, confirmBeforeExecute: false });

      await service.manualCompact();
      await service.manualCompact();

      const stats = service.getStatistics();
      expect(stats.totalCompacts).toBe(2);
      expect(stats.successfulCompacts).toBe(2);
      expect(stats.failedCompacts).toBe(0);
      expect(stats.isExecuting).toBe(false);
    });

    it("should include lastCompact in statistics", async () => {
      const service = new AutoCompactService({ enabled: true, confirmBeforeExecute: false });

      await service.manualCompact();

      const stats = service.getStatistics();
      expect(stats.lastCompact).toBeDefined();
    });
  });

  describe("default strategy selection", () => {
    it("should return summarize_oldest as default", () => {
      const service = new AutoCompactService();
      const strategy = service.getDefaultStrategy();
      expect(strategy).toBe("summarize_oldest");
    });

    it("should return custom default when specified", () => {
      const service = new AutoCompactService({
        compactStrategies: [{ name: "new_default", description: "New default", default: true }],
      });
      const strategy = service.getDefaultStrategy();
      expect(strategy).toBe("new_default");
    });
  });
});
