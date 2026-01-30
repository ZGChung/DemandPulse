import Redis from "ioredis";

import { env } from "./env";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // timestamp in milliseconds when the limit resets
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

/**
 * Redis-based rate limiter with fallback to in-memory storage
 * Implements fixed window algorithm for simplicity and performance
 */
export class RateLimiter {
  private redis: Redis | null = null;
  private inMemoryStore = new Map<string, { count: number; resetTime: number }>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: "rate-limit:",
      ...config,
    };

    this.initializeRedis();
  }

  private initializeRedis() {
    const redisUrl = env.redisUrl();
    if (!redisUrl) {
      console.log("[RateLimiter] REDIS_URL not set, using in-memory rate limiting");
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn("[RateLimiter] Redis connection failed, falling back to in-memory");
            this.redis = null;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on("error", (error) => {
        console.error("[RateLimiter] Redis error:", error.message);
        // Don't disable Redis on transient errors, just log
      });

      this.redis.on("connect", () => {
        console.log("[RateLimiter] Connected to Redis");
      });
    } catch (error) {
      console.error("[RateLimiter] Failed to initialize Redis:", error);
      this.redis = null;
    }
  }

  /**
   * Check rate limit for a given key
   * Returns whether the request is allowed and remaining requests
   */
  async check(key: string): Promise<RateLimitResult> {
    if (this.redis) {
      return this.checkWithRedis(key);
    }
    return this.checkInMemory(key);
  }

  /**
   * Increment rate limit counter for a given key
   * Returns updated rate limit result
   */
  async increment(key: string): Promise<RateLimitResult> {
    if (this.redis) {
      return this.incrementWithRedis(key);
    }
    return this.incrementInMemory(key);
  }

  /**
   * Check and increment in a single atomic operation
   * This is the recommended method for rate limiting
   */
  async checkAndIncrement(key: string): Promise<RateLimitResult> {
    if (this.redis) {
      return this.checkAndIncrementWithRedis(key);
    }
    return this.checkAndIncrementInMemory(key);
  }

  private async checkWithRedis(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowKey = `${redisKey}:${windowStart}`;

    try {
      const count = await this.redis!.get(windowKey);
      const currentCount = count ? parseInt(count, 10) : 0;

      const remaining = Math.max(0, this.config.maxRequests - currentCount);
      const reset = windowStart + this.config.windowMs;

      return {
        allowed: currentCount < this.config.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      console.error("[RateLimiter] Redis check failed, falling back to in-memory:", error);
      return this.checkInMemory(key);
    }
  }

  private async incrementWithRedis(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowKey = `${redisKey}:${windowStart}`;

    try {
      const multi = this.redis!.multi();
      multi.incr(windowKey);
      multi.expire(windowKey, Math.ceil(this.config.windowMs / 1000));

      const results = await multi.exec();
      if (!results) {
        throw new Error("Redis transaction failed");
      }

      const count = results[0][1] as number;
      const remaining = Math.max(0, this.config.maxRequests - count);
      const reset = windowStart + this.config.windowMs;

      return {
        allowed: count <= this.config.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      console.error("[RateLimiter] Redis increment failed, falling back to in-memory:", error);
      return this.incrementInMemory(key);
    }
  }

  private async checkAndIncrementWithRedis(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const windowKey = `${redisKey}:${windowStart}`;

    try {
      const multi = this.redis!.multi();
      multi.incr(windowKey);
      multi.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
      multi.get(windowKey);

      const results = await multi.exec();
      if (!results) {
        throw new Error("Redis transaction failed");
      }

      // Results: [incrResult, expireResult, getResult]
      const count = results[2][1] as number;
      const remaining = Math.max(0, this.config.maxRequests - count);
      const reset = windowStart + this.config.windowMs;

      return {
        allowed: count <= this.config.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      console.error("[RateLimiter] Redis checkAndIncrement failed, falling back:", error);
      return this.checkAndIncrementInMemory(key);
    }
  }

  private checkInMemory(key: string): RateLimitResult {
    const now = Date.now();
    const userLimit = this.inMemoryStore.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        reset: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - userLimit.count);
    return {
      allowed: userLimit.count < this.config.maxRequests,
      remaining,
      reset: userLimit.resetTime,
    };
  }

  private incrementInMemory(key: string): RateLimitResult {
    const now = Date.now();
    let userLimit = this.inMemoryStore.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userLimit = { count: 1, resetTime: now + this.config.windowMs };
      this.inMemoryStore.set(key, userLimit);
    } else {
      // Increment count
      userLimit.count++;
      this.inMemoryStore.set(key, userLimit);
    }

    const remaining = Math.max(0, this.config.maxRequests - userLimit.count);
    return {
      allowed: userLimit.count <= this.config.maxRequests,
      remaining,
      reset: userLimit.resetTime,
    };
  }

  private checkAndIncrementInMemory(key: string): RateLimitResult {
    const now = Date.now();
    let userLimit = this.inMemoryStore.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userLimit = { count: 1, resetTime: now + this.config.windowMs };
      this.inMemoryStore.set(key, userLimit);
    } else {
      // Increment count
      userLimit.count++;
      this.inMemoryStore.set(key, userLimit);
    }

    const remaining = Math.max(0, this.config.maxRequests - userLimit.count);
    return {
      allowed: userLimit.count <= this.config.maxRequests,
      remaining,
      reset: userLimit.resetTime,
    };
  }

  /**
   * Clean up resources (close Redis connection)
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /**
   * Clear in-memory store (for testing)
   */
  clearInMemoryStore(): void {
    this.inMemoryStore.clear();
  }
}

/**
 * Default rate limiter instance with configuration from environment variables
 */
export const defaultRateLimiter = new RateLimiter({
  maxRequests: env.rateLimitMaxRequests(),
  windowMs: env.rateLimitWindowMs(),
});
