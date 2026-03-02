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

  describe("RateLimiter boundary conditions", () => {
    it("should allow exactly at limit", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 });

      await limiter.checkAndIncrement("exact-limit");
      await limiter.checkAndIncrement("exact-limit");
      const result = await limiter.checkAndIncrement("exact-limit");

      // At exactly maxRequests, should still be allowed
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("should block when exceeding limit by 1", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 });

      await limiter.checkAndIncrement("exceed-limit");
      await limiter.checkAndIncrement("exceed-limit");
      const result = await limiter.checkAndIncrement("exceed-limit");

      // Exceeding maxRequests should be blocked
      expect(result.allowed).toBe(false);
    });

    it("should handle check returning allowed when at limit", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 });

      // First check
      const r1 = await limiter.check("check-limit");
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(0);

      // Use increment to consume the limit
      await limiter.increment("check-limit");

      // Now check again
      const r2 = await limiter.check("check-limit");
      expect(r2.allowed).toBe(false);
    });

    it("should handle increment when already at limit", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 });

      await limiter.increment("inc-at-limit");
      const result = await limiter.increment("inc-at-limit");

      // Increment still works but should show allowed=false when over
      expect(result.allowed).toBe(false);
    });

    it("should return correct remaining after multiple increments", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      for (let i = 0; i < 5; i++) {
        await limiter.increment("multi-inc");
      }

      const result = await limiter.check("multi-inc");
      expect(result.remaining).toBe(5);
    });

    it("should handle zero maxRequests", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 0, windowMs: 60000 });

      const result = await limiter.checkAndIncrement("zero-limit");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should handle very small windowMs", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 10 });

      await limiter.checkAndIncrement("small-window");
      await limiter.checkAndIncrement("small-window");

      // Should be blocked immediately due to small window
      const result = await limiter.checkAndIncrement("small-window");
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Should be allowed again
      const afterReset = await limiter.checkAndIncrement("small-window");
      expect(afterReset.allowed).toBe(true);
    });
  });

  describe("RateLimiter in-memory store edge cases", () => {
    it("should handle check on expired window correctly", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 30 });

      // Make some requests
      await limiter.increment("expired-key");
      await limiter.increment("expired-key");

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 40));

      // Check should show fresh window
      const result = await limiter.check("expired-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should track increment correctly across window boundaries", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 50 });

      // Fill the window
      await limiter.increment("boundary-key");
      await limiter.increment("boundary-key");
      await limiter.increment("boundary-key");

      const blocked = await limiter.increment("boundary-key");
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be allowed again
      const afterExpiry = await limiter.increment("boundary-key");
      expect(afterExpiry.allowed).toBe(true);
    });

    it("should correctly reset in-memory store on window expiry during checkAndIncrement", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 25 });

      await limiter.checkAndIncrement("expiry-check");
      await limiter.checkAndIncrement("expiry-check");

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 30));

      const result = await limiter.checkAndIncrement("expiry-check");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should handle rapid sequential requests", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      // Rapid requests
      for (let i = 0; i < 8; i++) {
        const result = await limiter.increment("rapid-key");
        expect(result.allowed).toBe(true);
      }

      // Two more to hit limit
      const r9 = await limiter.increment("rapid-key");
      const r10 = await limiter.increment("rapid-key");

      expect(r9.remaining).toBe(1);
      expect(r10.remaining).toBe(0);

      // One more should be blocked
      const blocked = await limiter.increment("rapid-key");
      expect(blocked.allowed).toBe(false);
    });

    it("should maintain separate counters for different keys after expiry", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 30 });

      // Use key1
      await limiter.checkAndIncrement("key1");
      await limiter.checkAndIncrement("key1");

      // Use key2
      await limiter.checkAndIncrement("key2");

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 40));

      // Both should be fresh
      const r1 = await limiter.check("key1");
      const r2 = await limiter.check("key2");

      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
    });

    it("should test check method returning correct remaining without incrementing", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });

      // Make requests via increment
      await limiter.increment("check-remaining");
      await limiter.increment("check-remaining");
      await limiter.increment("check-remaining");

      // Check should show 2 remaining
      const result = await limiter.check("check-remaining");
      expect(result.remaining).toBe(2);
      expect(result.allowed).toBe(true);
    });
  });

  describe("RateLimiter disconnect and cleanup", () => {
    it("should handle disconnect when redis is not initialized", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      // Should not throw
      await expect(limiter.disconnect()).resolves.toBeUndefined();
    });

    it("should clear in-memory store completely", async () => {
      const { RateLimiter } = await import("@/lib/rate-limiter");
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 });

      // Add some requests
      await limiter.checkAndIncrement("clear1");
      await limiter.checkAndIncrement("clear2");

      // Clear
      limiter.clearInMemoryStore();

      // Keys should be reset
      const r1 = await limiter.check("clear1");
      const r2 = await limiter.check("clear2");

      expect(r1.remaining).toBe(9);
      expect(r2.remaining).toBe(9);
    });
  });
});
