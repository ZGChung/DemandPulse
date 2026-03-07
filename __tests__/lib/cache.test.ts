// In-memory cache tests
import { cacheGet, cacheSet, cacheDelete, cacheKey } from "@/lib/cache";

describe("Cache Utilities", () => {
  beforeEach(() => {
    // Clear cache before each test - we need to import fresh
    jest.resetModules();
  });

  describe("cacheKey", () => {
    it("should generate key with prefix and parts", () => {
      const key = cacheKey("users", 123);
      expect(key).toBe("users:123");
    });

    it("should handle multiple parts", () => {
      const key = cacheKey("org", 1, "requirements", "latest");
      expect(key).toBe("org:1:requirements:latest");
    });

    it("should handle string parts", () => {
      const key = cacheKey("cache", "foo", "bar");
      expect(key).toBe("cache:foo:bar");
    });

    it("should handle single prefix", () => {
      const key = cacheKey("simple");
      expect(key).toBe("simple");
    });
  });

  describe("cacheSet and cacheGet", () => {
    it("should store and retrieve string value", () => {
      cacheSet("test:key", "hello");
      const value = cacheGet<string>("test:key");
      expect(value).toBe("hello");
    });

    it("should store and retrieve object value", () => {
      const obj = { id: 1, name: "test" };
      cacheSet("test:obj", obj);
      const value = cacheGet<{ id: number; name: string }>("test:obj");
      expect(value).toEqual(obj);
    });

    it("should return undefined for non-existent key", () => {
      const value = cacheGet("nonexistent");
      expect(value).toBeUndefined();
    });

    it("should overwrite existing key", () => {
      cacheSet("test:overwrite", "first");
      cacheSet("test:overwrite", "second");
      const value = cacheGet<string>("test:overwrite");
      expect(value).toBe("second");
    });
  });

  describe("cacheDelete", () => {
    it("should delete existing key", () => {
      cacheSet("test:delete", "value");
      cacheDelete("test:delete");
      const value = cacheGet("test:delete");
      expect(value).toBeUndefined();
    });

    it("should not throw for non-existent key", () => {
      expect(() => cacheDelete("nonexistent")).not.toThrow();
    });
  });

  describe("TTL expiration", () => {
    it("should return undefined after TTL expires", async () => {
      // Set with very short TTL (10ms)
      cacheSet("test:ttl", "expires", 10);

      // Should exist immediately
      expect(cacheGet<string>("test:ttl")).toBe("expires");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be expired
      expect(cacheGet("test:ttl")).toBeUndefined();
    });

    it("should use default TTL when not specified", () => {
      cacheSet("test:default", "value");
      // Should exist
      expect(cacheGet("test:default")).toBe("value");
    });
  });

  describe("Cache size limits", () => {
    it("should trigger sweep when store is full", () => {
      // Fill cache to trigger sweep (MAX_STORE_SIZE = 1000)
      for (let i = 0; i < 1000; i++) {
        cacheSet(`fill:${i}`, `value${i}`);
      }
      // Should still work after sweep
      expect(cacheGet("fill:999")).toBe("value999");
    });
  });
});
