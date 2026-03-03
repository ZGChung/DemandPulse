import { RateLimiter, RateLimitResult } from "@/lib/rate-limiter";

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    multi: jest.fn().mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], // incr result
        [null, 1], // expire result
        [null, 1], // get result
      ]),
    }),
    quit: jest.fn().mockResolvedValue("OK"),
  }));
});

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 60000,
      keyPrefix: "test:",
    });
  });

  afterEach(async () => {
    await limiter.disconnect();
    limiter.clearInMemoryStore();
  });

  describe("constructor", () => {
    it("should create rate limiter with config", () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 30000,
      });
      expect(limiter).toBeDefined();
    });

    it("should use default keyPrefix", () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 30000,
      });
      expect(limiter).toBeDefined();
    });
  });

  describe("checkInMemory", () => {
    it("should allow first request when under limit", async () => {
      const result = await limiter.check("user1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should track requests correctly", async () => {
      await limiter.increment("user1");
      await limiter.increment("user1");
      const result = await limiter.check("user1");

      // After 2 increments, remaining should be 7 (10 - 2 - 1 for the check)
      // Actually check() doesn't increment, it just checks
      // So after 2 increments, remaining should be 8 - 1 = 7? No
      // check() returns remaining based on current count
      // After 2 increments, count is 2, so remaining = 10 - 2 = 8
      expect(result.remaining).toBe(8);
    });

    it("should block when limit exceeded", async () => {
      for (let i = 0; i < 10; i++) {
        await limiter.increment("user1");
      }

      const result = await limiter.check("user1");

      // After 10 increments, count = 10, remaining = 10 - 10 = 0
      // But allowed is count < maxRequests, so 10 < 10 = false
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", async () => {
      const limiter2 = new RateLimiter({
        maxRequests: 2,
        windowMs: 50,
        keyPrefix: "test2:",
      });

      await limiter2.increment("user1");
      await limiter2.increment("user1");

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      const result = await limiter2.check("user1");
      expect(result.allowed).toBe(true);
    });

    it("should track different keys separately", async () => {
      await limiter.increment("user1");
      await limiter.increment("user2");

      const result1 = await limiter.check("user1");
      const result2 = await limiter.check("user2");

      // After 1 increment each, remaining = 10 - 1 = 9
      expect(result1.remaining).toBe(9);
      expect(result2.remaining).toBe(9);
    });
  });

  describe("incrementInMemory", () => {
    it("should increment and return correct result", async () => {
      const result = await limiter.increment("user1");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should track count correctly", async () => {
      await limiter.increment("user1");
      await limiter.increment("user1");
      await limiter.increment("user1");

      const result = await limiter.check("user1");
      // After 3 increments, remaining = 10 - 3 = 7
      expect(result.remaining).toBe(7);
    });
  });

  describe("checkAndIncrementInMemory", () => {
    it("should check and increment in one operation", async () => {
      const result = await limiter.checkAndIncrement("user1");

      // First call: count = 1, remaining = 10 - 1 = 9
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should block at exact limit", async () => {
      const limiter3 = new RateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        keyPrefix: "test3:",
      });

      await limiter3.checkAndIncrement("user1");
      const result = await limiter3.checkAndIncrement("user1");

      expect(result.allowed).toBe(true); // 2 <= 2 is allowed
      expect(result.remaining).toBe(0);

      const result2 = await limiter3.checkAndIncrement("user1");
      expect(result2.allowed).toBe(false); // 3 > 2 is blocked
    });
  });

  describe("clearInMemoryStore", () => {
    it("should clear all stored data", async () => {
      await limiter.increment("user1");
      await limiter.increment("user2");

      limiter.clearInMemoryStore();

      const result1 = await limiter.check("user1");
      const result2 = await limiter.check("user2");

      expect(result1.remaining).toBe(9);
      expect(result2.remaining).toBe(9);
    });
  });

  describe("disconnect", () => {
    it("should handle disconnect when no Redis", async () => {
      await expect(limiter.disconnect()).resolves.toBeUndefined();
    });
  });
});
