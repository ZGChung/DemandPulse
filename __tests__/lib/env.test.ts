import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock process.env before importing
const mockEnv: Record<string, string | undefined> = {
  NODE_ENV: "test",
  DEEPSEEK_API_KEY: "sk-test-key-123",
  NEXT_PUBLIC_APP_URL: "https://example.com",
  DATABASE_URL: "postgresql://localhost:5432/test",
  NEXTAUTH_SECRET: "test-secret",
  NEXTAUTH_URL: "https://example.com",
  RATE_LIMIT_MAX_REQUESTS: "50",
  RATE_LIMIT_WINDOW_MS: "60000",
  ENABLE_CLAUDE_CODE_PLUGIN: "true",
  ENABLE_AI_PROCESSING: "false",
  NEXT_PUBLIC_APP_NAME: "TestApp",
};

describe("Env Module", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...mockEnv } as NodeJS.ProcessEnv;
  });

  describe("validateEnv", () => {
    it("should pass validation when required env vars are set", async () => {
      const { validateEnv } = await import("@/lib/env");
      expect(validateEnv()).toBe(true);
    });

    it("should throw when required env vars are missing", async () => {
      process.env.DEEPSEEK_API_KEY = undefined;
      jest.resetModules();

      const { validateEnv } = await import("@/lib/env");
      expect(() => validateEnv()).toThrow("Missing required environment variables");
    });
  });

  describe("getEnv", () => {
    it("should return env value when present", async () => {
      const { getEnv } = await import("@/lib/env");
      expect(getEnv("DEEPSEEK_API_KEY")).toBe("sk-test-key-123");
    });

    it("should return default value when env var is not set and optional", async () => {
      const { getEnv } = await import("@/lib/env");
      expect(getEnv("DATABASE_URL", "default-db")).toBe("postgresql://localhost:5432/test");
    });

    it("should throw for missing required env var", async () => {
      process.env.DEEPSEEK_API_KEY = undefined;
      jest.resetModules();

      const { getEnv } = await import("@/lib/env");
      expect(() => getEnv("DEEPSEEK_API_KEY")).toThrow();
    });
  });

  describe("getEnvAsBoolean", () => {
    it("should return boolean true for 'true' string", async () => {
      const { getEnvAsBoolean } = await import("@/lib/env");
      expect(getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN")).toBe(true);
    });

    it("should return boolean false for 'false' string", async () => {
      const { getEnvAsBoolean } = await import("@/lib/env");
      expect(getEnvAsBoolean("ENABLE_AI_PROCESSING")).toBe(false);
    });

    it("should return default value when env var is not set", async () => {
      const { getEnvAsBoolean } = await import("@/lib/env");
      expect(getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN", true)).toBe(true);
    });
  });

  describe("getEnvAsNumber", () => {
    it("should return number value", async () => {
      const { getEnvAsNumber } = await import("@/lib/env");
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS")).toBe(50);
    });

    it("should return default value when env var is not set", async () => {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      jest.resetModules();

      const { getEnvAsNumber } = await import("@/lib/env");
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS", 100)).toBe(100);
    });

    it("should return default value when env var is not a valid number", async () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = "not-a-number";
      jest.resetModules();

      const { getEnvAsNumber } = await import("@/lib/env");
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS", 100)).toBe(100);
    });
  });

  describe("env convenience exports", () => {
    it("should export deepseekApiKey", async () => {
      const { env } = await import("@/lib/env");
      expect(env.deepseekApiKey()).toBe("sk-test-key-123");
    });

    it("should export appUrl", async () => {
      const { env } = await import("@/lib/env");
      expect(env.appUrl()).toBe("https://example.com");
    });

    it("should export rateLimitMaxRequests with default", async () => {
      const { env } = await import("@/lib/env");
      expect(env.rateLimitMaxRequests()).toBe(50);
    });

    it("should export enableClaudeCodePlugin as boolean", async () => {
      const { env } = await import("@/lib/env");
      expect(env.enableClaudeCodePlugin()).toBe(true);
    });
  });
});
