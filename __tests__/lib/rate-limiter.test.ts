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
});
