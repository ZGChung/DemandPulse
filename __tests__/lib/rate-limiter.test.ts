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
  });

  describe("defaultRateLimiter", () => {
    it("should export defaultRateLimiter instance", async () => {
      const { defaultRateLimiter } = await import("@/lib/rate-limiter");
      expect(defaultRateLimiter).toBeDefined();
    });
  });
});
