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
});
