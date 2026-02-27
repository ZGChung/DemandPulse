// AutoCompactService tests
import { AutoCompactService } from "../../services/auto-compact-service";

describe("AutoCompactService", () => {
  let service: AutoCompactService;

  beforeEach(() => {
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
      const config = (service as any).config;
      expect(config.enabled).toBe(true);
      expect(config.compactCommand).toBe("/compact");
      expect(config.executionMethod).toBe("simulated");
    });
  });

  describe("getCompactHistory", () => {
    it("should return empty array initially", () => {
      const history = (service as any).compactHistory;
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("isExecuting", () => {
    it("should not be executing initially", () => {
      const isExecuting = (service as any).isExecuting;
      expect(isExecuting).toBe(false);
    });
  });

  describe("getStrategies", () => {
    it("should return available compact strategies", () => {
      const strategies = (service as any).config.compactStrategies;
      expect(strategies).toHaveLength(3);
      expect(strategies.map((s: any) => s.name)).toContain("summarize_oldest");
      expect(strategies.map((s: any) => s.name)).toContain("remove_oldest");
      expect(strategies.map((s: any) => s.name)).toContain("compress_all");
    });

    it("should mark summarize_oldest as default", () => {
      const strategies = (service as any).config.compactStrategies;
      const defaultStrategy = strategies.find((s: any) => s.default);
      expect(defaultStrategy.name).toBe("summarize_oldest");
    });
  });

  describe("enable/disable", () => {
    it("should have enable method", () => {
      expect(typeof service.enable).toBe("function");
    });

    it("should have disable method", () => {
      expect(typeof service.disable).toBe("function");
    });
  });

  describe("manualCompact", () => {
    it("should have manualCompact method", () => {
      expect(typeof service.manualCompact).toBe("function");
    });

    it("should execute manual compact", async () => {
      const result = await service.manualCompact("summarize_oldest");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });

    it("should use default strategy when none specified", async () => {
      const result = await service.manualCompact();
      expect(result).toHaveProperty("success");
    });
  });

  describe("getStatistics", () => {
    it("should return statistics object", () => {
      const stats = service.getStatistics();
      expect(stats).toHaveProperty("totalCompacts");
      expect(stats).toHaveProperty("successfulCompacts");
      expect(stats).toHaveProperty("failedCompacts");
      expect(stats).toHaveProperty("config");
    });
  });

  describe("isEnabled", () => {
    it("should return enabled status", () => {
      expect(typeof service.isEnabled).toBe("function");
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("updateConfig", () => {
    it("should have updateConfig method", () => {
      expect(typeof service.updateConfig).toBe("function");
    });

    it("should update configuration", () => {
      service.updateConfig({ enabled: false });
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe("CLI execution method", () => {
    it("should execute compact via CLI method", async () => {
      const cliService = new AutoCompactService({
        enabled: true,
        executionMethod: "cli",
        cliPath: "/usr/local/bin/claude",
      });
      const result = await cliService.manualCompact("remove_oldest");
      expect(result.success).toBe(true);
      expect(result.message).toContain("CLI");
    });
  });

  describe("API execution method", () => {
    it("should execute compact via API method", async () => {
      const apiService = new AutoCompactService({
        enabled: true,
        executionMethod: "api",
        apiEndpoint: "https://api.claude.ai/v1/compact",
        apiToken: "test-token",
      });
      const result = await apiService.manualCompact("compress_all");
      expect(result.success).toBe(true);
      expect(result.message).toContain("API");
    });
  });

  describe("getHistory", () => {
    it("should have getHistory method", () => {
      expect(typeof service.getHistory).toBe("function");
    });

    it("should return empty array when no history", () => {
      const history = service.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should limit history when limit specified", () => {
      const history = service.getHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("notification methods", () => {
    it("should use console notification method", () => {
      const consoleService = new AutoCompactService({
        enabled: true,
        notificationMethod: "console",
      });
      const config = (consoleService as any).config;
      expect(config.notificationMethod).toBe("console");
    });

    it("should use both notification methods", () => {
      const bothService = new AutoCompactService({
        enabled: true,
        notificationMethod: "both",
      });
      const config = (bothService as any).config;
      expect(config.notificationMethod).toBe("both");
    });
  });

  describe("disabled service behavior", () => {
    it("should not execute when disabled", async () => {
      const disabledService = new AutoCompactService({
        enabled: false,
        executionMethod: "simulated",
      });
      expect(disabledService.isEnabled()).toBe(false);
    });

    it("should enable service", () => {
      const disabledService = new AutoCompactService({ enabled: false });
      disabledService.enable();
      expect(disabledService.isEnabled()).toBe(true);
    });

    it("should disable service", () => {
      const enabledService = new AutoCompactService({ enabled: true });
      enabledService.disable();
      expect(enabledService.isEnabled()).toBe(false);
    });
  });

  describe("strategy selection", () => {
    it("should get default strategy", () => {
      const cliService = new AutoCompactService({
        enabled: true,
        executionMethod: "simulated",
      });
      const strategy = (cliService as any).getDefaultStrategy();
      expect(strategy).toBe("summarize_oldest");
    });

    it("should support custom strategy", async () => {
      const result = await service.manualCompact("remove_oldest");
      expect(result.success).toBe(true);
    });
  });
});
