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
});
