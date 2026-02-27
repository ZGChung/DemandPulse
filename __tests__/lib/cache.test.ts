import { describe, it, expect, beforeEach } from "@jest/globals";

import { cacheGet, cacheSet, cacheDelete, cacheKey } from "@/lib/cache";

describe("Cache Utilities", () => {
  beforeEach(() => {
    // Clear cache before each test
    jest.restoreAllMocks();
  });

  describe("cacheKey", () => {
    it("should generate cache key with prefix and parts", () => {
      expect(cacheKey("user", "123")).toBe("user:123");
      expect(cacheKey("req", "abc", "def")).toBe("req:abc:def");
      expect(cacheKey("test", 1, 2, 3)).toBe("test:1:2:3");
    });
  });

  describe("cacheSet and cacheGet", () => {
    it("should store and retrieve value", () => {
      cacheSet("test-key", { foo: "bar" });
      const result = cacheGet<{ foo: string }>("test-key");
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return undefined for non-existent key", () => {
      const result = cacheGet("non-existent");
      expect(result).toBeUndefined();
    });

    it("should respect custom TTL", () => {
      cacheSet("ttl-key", "value", 100); // 100ms TTL
      expect(cacheGet("ttl-key")).toBe("value");
    });
  });

  describe("cacheDelete", () => {
    it("should delete value from cache", () => {
      cacheSet("delete-me", "value");
      expect(cacheGet("delete-me")).toBe("value");
      cacheDelete("delete-me");
      expect(cacheGet("delete-me")).toBeUndefined();
    });
  });
});
