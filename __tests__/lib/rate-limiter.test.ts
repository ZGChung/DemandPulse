import { describe, it, expect } from "@jest/globals";

describe("Rate Limiter Module", () => {
  describe("RateLimiter", () => {
    it("should export RateLimiter class", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      expect(RateLimiter).toBeDefined();
    });

    it("should create RateLimiter instance", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      expect(limiter).toBeDefined();
    });

    it("should have check method", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      expect(typeof limiter.check).toBe("function");
    });

    it("should have increment method", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      expect(typeof limiter.increment).toBe("function");
    });

    it("should have checkAndIncrement method", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      expect(typeof limiter.checkAndIncrement).toBe("function");
    });

    it("should allow requests under limit", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      const result = await limiter.checkAndIncrement("test-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should track remaining requests correctly", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 });

      await limiter.checkAndIncrement("track-key");
      await limiter.checkAndIncrement("track-key");
      const result = await limiter.checkAndIncrement("track-key");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("should block requests over limit", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });

      await limiter.checkAndIncrement("block-key");
      await limiter.checkAndIncrement("block-key");
      const result = await limiter.checkAndIncrement("block-key");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return reset timestamp", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      const result = await limiter.check("reset-key");

      expect(result.reset).toBeGreaterThan(0);
    });

    it("should use custom keyPrefix", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        keyPrefix: "custom:",
      });
      const result = await limiter.check("custom-key");

      expect(result.allowed).toBe(true);
    });

    it("should reset after window expires", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      // Use very short window for testing
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 50 });

      // Fill up the limit
      await limiter.checkAndIncrement("reset-key");
      await limiter.checkAndIncrement("reset-key");
      const blocked = await limiter.checkAndIncrement("reset-key");
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be allowed again
      const allowed = await limiter.checkAndIncrement("reset-key");
      expect(allowed.allowed).toBe(true);
    });

    it("should handle increment separately from check", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });

      // Increment first (this consumes 2)
      await limiter.increment("inc-key");
      await limiter.increment("inc-key");

      // Then check - remaining should be 3 (5 - 2 = 3)
      const result = await limiter.check("inc-key");
      expect(result.remaining).toBe(3);
    });

    it("should clear in-memory store", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      await limiter.checkAndIncrement("clear-key");
      expect(limiter.clearInMemoryStore).toBeDefined();
      limiter.clearInMemoryStore();
    });

    it("should have disconnect method", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });
      expect(typeof limiter.disconnect).toBe("function");
      // Should not throw
      await expect(limiter.disconnect()).resolves.not.toThrow();
    });
  });

  describe("RateLimiter edge cases", () => {
    it("should handle multiple different keys independently", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });

      await limiter.checkAndIncrement("key1");
      await limiter.checkAndIncrement("key1");
      const key1Blocked = await limiter.checkAndIncrement("key1");

      // Key2 should still be allowed
      const key2Allowed = await limiter.checkAndIncrement("key2");

      expect(key1Blocked.allowed).toBe(false);
      expect(key2Allowed.allowed).toBe(true);
    });

    it("should return correct reset time for in-memory store", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      const result = await limiter.check("reset-time-key");
      const expectedReset = Date.now() + 60000;
      expect(result.reset).toBeGreaterThanOrEqual(expectedReset - 1000);
      expect(result.reset).toBeLessThanOrEqual(expectedReset + 1000);
    });

    it("should increment count properly for in-memory", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });

      const r1 = await limiter.increment("inc-test");
      const r2 = await limiter.increment("inc-test");
      const r3 = await limiter.increment("inc-test");

      expect(r1.remaining).toBe(4);
      expect(r2.remaining).toBe(3);
      expect(r3.remaining).toBe(2);
    });

    it("should track remaining correctly when check doesn't increment", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });

      // check() returns current state without incrementing
      const r1 = await limiter.check("check-no-inc");
      // Second check - count is still 1, remaining is 4
      const r2 = await limiter.check("check-no-inc");

      // check() doesn't increment, so remaining stays the same
      expect(r1.remaining).toBe(4);
      expect(r2.remaining).toBe(4);
    });

    it("should use keyPrefix in results", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        keyPrefix: "test-prefix:",
      });

      const result = await limiter.check("prefix-test");
      expect(result.allowed).toBe(true);
    });
  });

  describe("defaultRateLimiter", () => {
    it("should export defaultRateLimiter instance", async () => {
      const { defaultRateLimiter } = await import("@/lib/rate-limiter");
      expect(defaultRateLimiter).toBeDefined();
    });

    it("should have check method", async () => {
      const { defaultRateLimiter } = await import("@/lib/rate-limiter");
      expect(typeof defaultRateLimiter.check).toBe("function");
    });
  });

  describe("RateLimiter with custom configuration", () => {
    it("should use custom keyPrefix", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        keyPrefix: "custom:",
      });

      const result = await limiter.check("custom-key");
      expect(result.allowed).toBe(true);
    });
  });
});
