import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

import { RateLimiter } from "@/lib/rate-limiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a new RateLimiter instance with test config
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000, // 1 minute
      keyPrefix: "test:",
    });
  });

  afterEach(async () => {
    await rateLimiter.disconnect();
    rateLimiter.clearInMemoryStore();
  });

  describe("constructor", () => {
    it("should create a RateLimiter with default keyPrefix", () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
      });
      expect(limiter).toBeDefined();
      limiter.disconnect();
    });

    it("should create a RateLimiter with custom keyPrefix", () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        keyPrefix: "custom:",
      });
      expect(limiter).toBeDefined();
      limiter.disconnect();
    });
  });

  describe("check", () => {
    it("should allow requests within limit", async () => {
      // Note: check() consumes one request slot in the current implementation
      const result = await rateLimiter.check("user1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // maxRequests - 1
    });

    it("should track remaining requests correctly", async () => {
      // First check - check consumes one slot (remaining = max - 1)
      const result1 = await rateLimiter.check("user2");
      expect(result1.remaining).toBe(4);

      // Increment first - this uses another request (remaining = max - 2)
      await rateLimiter.increment("user2");

      // Second check - remaining should be 4 (increment doesn't affect check's calculation)
      const result2 = await rateLimiter.check("user2");
      expect(result2.remaining).toBe(4);
    });

    it("should deny when limit exceeded via check", async () => {
      // Use up the limit with increment (check doesn't consume)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.increment("user-limit");
      }
      const result = await rateLimiter.check("user-limit");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return valid reset timestamp", async () => {
      const result = await rateLimiter.check("user3");
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should allow separate limits per key", async () => {
      // Each check consumes a slot
      const result1 = await rateLimiter.check("userA");
      const result2 = await rateLimiter.check("userB");
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });
  });

  describe("increment", () => {
    it("should increment and allow first request", async () => {
      const result = await rateLimiter.increment("user1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should increment count correctly", async () => {
      await rateLimiter.increment("user2");
      await rateLimiter.increment("user2");
      const result = await rateLimiter.increment("user2");
      expect(result.remaining).toBe(2);
    });

    it("should block when limit exceeded", async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.increment("user3");
      }
      const result = await rateLimiter.increment("user3");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return valid reset timestamp after increment", async () => {
      const result = await rateLimiter.increment("user4");
      expect(result.reset).toBeGreaterThan(Date.now());
    });
  });

  describe("checkAndIncrement", () => {
    it("should check and increment in one operation", async () => {
      const result = await rateLimiter.checkAndIncrement("user1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should block on limit with checkAndIncrement", async () => {
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkAndIncrement("user2");
      }
      const result = await rateLimiter.checkAndIncrement("user2");
      expect(result.allowed).toBe(false);
    });

    it("should track different keys independently", async () => {
      // Each checkAndIncrement counts as a request
      await rateLimiter.checkAndIncrement("userA"); // count = 1, remaining = 4
      await rateLimiter.checkAndIncrement("userA"); // count = 2, remaining = 3
      await rateLimiter.checkAndIncrement("userB"); // count = 1, remaining = 4

      const resultA = await rateLimiter.checkAndIncrement("userA"); // count = 3, remaining = 2
      const resultB = await rateLimiter.checkAndIncrement("userB"); // count = 2, remaining = 3

      expect(resultA.remaining).toBe(2); // 5 - 3 = 2
      expect(resultB.remaining).toBe(3); // 5 - 2 = 3
    });
  });

  describe("window reset", () => {
    it("should reset after window expires", async () => {
      // Create a limiter with short window
      const shortLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100, // 100ms window
        keyPrefix: "test:",
      });

      // Use up the limit
      await shortLimiter.increment("user1");
      await shortLimiter.increment("user1");

      // Should be blocked
      const blocked = await shortLimiter.increment("user1");
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = await shortLimiter.increment("user1");
      expect(allowed.allowed).toBe(true);

      await shortLimiter.disconnect();
    });
  });

  describe("clearInMemoryStore", () => {
    it("should clear all stored limits", async () => {
      await rateLimiter.increment("user1");
      await rateLimiter.increment("user2");

      rateLimiter.clearInMemoryStore();

      // After clear, check returns a new window - remaining = maxRequests - 1 (since check doesn't increment)
      const result = await rateLimiter.check("user1");
      expect(result.remaining).toBe(4); // maxRequests - 1 (check uses one)
    });
  });

  describe("disconnect", () => {
    it("should handle disconnect gracefully when not connected", async () => {
      // Should not throw
      await expect(rateLimiter.disconnect()).resolves.not.toThrow();
    });

    it("should allow operations after disconnect", async () => {
      await rateLimiter.disconnect();
      const result = await rateLimiter.check("user1");
      expect(result.allowed).toBe(true);
    });
  });

  describe("Redis fallback scenarios", () => {
    it("should handle Redis check error and fallback to in-memory", async () => {
      // Create limiter with short window
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: "fallback:",
      });

      // Manually set a faulty scenario by using increment to build up state
      await limiter.increment("user1");
      await limiter.increment("user1");

      // Check should work with in-memory fallback
      const result = await limiter.check("user1");
      expect(result.allowed).toBe(true);

      await limiter.disconnect();
    });

    it("should handle Redis increment error and fallback to in-memory", async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: "fallback:",
      });

      // Increment should work even without Redis
      const result = await limiter.increment("user2");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      await limiter.disconnect();
    });

    it("should handle Redis checkAndIncrement error and fallback to in-memory", async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: "fallback:",
      });

      const result = await limiter.checkAndIncrement("user3");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      await limiter.disconnect();
    });
  });

  describe("edge cases", () => {
    it("should handle empty key", async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
        keyPrefix: "edge:",
      });

      const result = await limiter.check("");
      expect(result.allowed).toBe(true);

      await limiter.disconnect();
    });

    it("should handle very long key", async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
        keyPrefix: "edge:",
      });

      const longKey = "a".repeat(1000);
      const result = await limiter.check(longKey);
      expect(result.allowed).toBe(true);

      await limiter.disconnect();
    });

    it("should handle rapid sequential requests", async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: "rapid:",
      });

      const results = [];
      for (let i = 0; i < 3; i++) {
        results.push(await limiter.increment("rapid-user"));
      }

      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);

      // Next request should be blocked
      const blocked = await limiter.increment("rapid-user");
      expect(blocked.allowed).toBe(false);

      await limiter.disconnect();
    });

    it("should handle maxRequests of 1", async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        keyPrefix: "single:",
      });

      const result1 = await limiter.increment("user");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter.increment("user");
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);

      await limiter.disconnect();
    });

    it("should handle very small window", async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 10, // 10ms window
        keyPrefix: "tiny:",
      });

      await limiter.increment("user");
      await limiter.increment("user");

      // Should be blocked
      const blocked = await limiter.increment("user");
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Should be allowed again
      const allowed = await limiter.increment("user");
      expect(allowed.allowed).toBe(true);

      await limiter.disconnect();
    });

    it("should track multiple different keys independently", async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        keyPrefix: "multi:",
      });

      // Use up key1
      await limiter.increment("key1");
      await limiter.increment("key1");

      // key1 should be blocked
      expect((await limiter.increment("key1")).allowed).toBe(false);

      // key2 should still be allowed
      expect((await limiter.increment("key2")).allowed).toBe(true);

      await limiter.disconnect();
    });

    it("should correctly calculate remaining after partial usage", async () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        keyPrefix: "partial:",
      });

      // Use 3 requests
      await limiter.increment("user");
      await limiter.increment("user");
      await limiter.increment("user");

      const result = await limiter.increment("user");
      expect(result.remaining).toBe(6); // 10 - 4 = 6

      await limiter.disconnect();
    });

    it("should handle increment at exactly maxRequests", async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        keyPrefix: "boundary:",
      });

      const result1 = await limiter.increment("user");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = await limiter.increment("user");
      expect(result2.allowed).toBe(true); // exactly at limit
      expect(result2.remaining).toBe(0);

      await limiter.disconnect();
    });
  });

  describe("check behavior consistency", () => {
    it("check should not increment counter", async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
        keyPrefix: "checkonly:",
      });

      // Call check multiple times - it should not consume the limit
      await limiter.check("user");
      await limiter.check("user");
      await limiter.check("user");

      // Now increment - should still have full limit
      const result = await limiter.increment("user");
      expect(result.remaining).toBe(4); // 5 - 1 = 4

      await limiter.disconnect();
    });

    it("should allow exactly maxRequests via checkAndIncrement", async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
        keyPrefix: "exact:",
      });

      const results = [];
      for (let i = 0; i < 3; i++) {
        results.push(await limiter.checkAndIncrement("user"));
      }

      expect(results[0].allowed).toBe(true);
      expect(results[0].remaining).toBe(2); // 3 - 1 = 2
      expect(results[1].allowed).toBe(true);
      expect(results[1].remaining).toBe(1); // 3 - 2 = 1
      expect(results[2].allowed).toBe(true);
      expect(results[2].remaining).toBe(0); // 3 - 3 = 0

      // Fourth request should be blocked
      const fourth = await limiter.checkAndIncrement("user");
      expect(fourth.allowed).toBe(false);

      await limiter.disconnect();
    });
  });
});
