import { describe, it, expect } from "@jest/globals";

describe("Cache Module", () => {
  describe("cacheGet", () => {
    it("should export cacheGet function", async () => {
      const { cacheGet } = await import("@/lib/cache");
      expect(typeof cacheGet).toBe("function");
    });

    it("should return undefined for non-existent key", async () => {
      const { cacheGet } = await import("@/lib/cache");
      const result = cacheGet("non-existent-key");
      expect(result).toBeUndefined();
    });
  });

  describe("cacheSet", () => {
    it("should export cacheSet function", async () => {
      const { cacheSet } = await import("@/lib/cache");
      expect(typeof cacheSet).toBe("function");
    });
  });

  describe("cacheDelete", () => {
    it("should export cacheDelete function", async () => {
      const { cacheDelete } = await import("@/lib/cache");
      expect(typeof cacheDelete).toBe("function");
    });
  });

  describe("cacheKey", () => {
    it("should export cacheKey function", async () => {
      const { cacheKey } = await import("@/lib/cache");
      expect(typeof cacheKey).toBe("function");
    });

    it("should generate cache key", async () => {
      const { cacheKey } = await import("@/lib/cache");
      const key = cacheKey("user", "123", "profile");
      expect(key).toContain("user");
      expect(key).toContain("123");
    });
  });
});
