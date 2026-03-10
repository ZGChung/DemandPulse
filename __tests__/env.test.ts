import { validateEnv, getEnv, getEnvAsBoolean, getEnvAsNumber, env } from "@/lib/env";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("should not throw when no required env vars (DEEPSEEK/MINIMAX optional)", () => {
      delete process.env.MINIMAX_API_KEY;
      delete process.env.GEMINI_API_KEY;

      expect(() => validateEnv()).not.toThrow();
    });

    it("should not throw when GEMINI or MINIMAX is set", () => {
      process.env.GEMINI_API_KEY = "test-key";

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("getEnv", () => {
    it("should return environment variable value", () => {
      process.env.DATABASE_URL = "test-value";
      expect(getEnv("DATABASE_URL")).toBe("test-value");
    });

    it("should return empty string for missing optional env var", () => {
      delete process.env.DEEPSEEK_API_KEY;
      expect(getEnv("DEEPSEEK_API_KEY")).toBe("");
    });

    it("should return default value for missing optional env var", () => {
      // Temporarily delete the env var to test default value
      const originalValue = process.env.NEXT_PUBLIC_APP_NAME;
      delete process.env.NEXT_PUBLIC_APP_NAME;
      expect(getEnv("NEXT_PUBLIC_APP_NAME", "DefaultApp")).toBe("DefaultApp");
      // Restore the original value
      if (originalValue !== undefined) {
        process.env.NEXT_PUBLIC_APP_NAME = originalValue;
      }
    });
  });

  describe("getEnvAsBoolean", () => {
    it('should return true for "true" string', () => {
      process.env.TEST_BOOL = "true";
      expect(getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN")).toBe(true);
    });

    it('should return false for "false" string', () => {
      process.env.ENABLE_CLAUDE_CODE_PLUGIN = "false";
      expect(getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN")).toBe(false);
    });

    it("should return default value for missing env var", () => {
      expect(getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN", true)).toBe(true);
    });
  });

  describe("getEnvAsNumber", () => {
    it("should parse numeric string", () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = "123";
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS")).toBe(123);
    });

    it("should return default for invalid number", () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = "not-a-number";
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS", 999)).toBe(999);
    });

    it("should return default for missing env var", () => {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      expect(getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS", 456)).toBe(456);
    });
  });

  describe("env convenience object", () => {
    beforeEach(() => {
      process.env.DEEPSEEK_API_KEY = "sk-test-key";
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_APP_NAME = "TestApp";
      process.env.RATE_LIMIT_MAX_REQUESTS = "50";
      process.env.ENABLE_CLAUDE_CODE_PLUGIN = "false";
    });

    it("should provide access to deepseekApiKey", () => {
      expect(env.deepseekApiKey()).toBe("sk-test-key");
    });

    it("should provide access to appUrl", () => {
      expect(env.appUrl()).toBe("http://localhost:3000");
    });

    it("should provide access to appName with default", () => {
      delete process.env.NEXT_PUBLIC_APP_NAME;
      expect(env.appName()).toBe("DemandPulse");
    });

    it("should parse numeric env vars", () => {
      expect(env.rateLimitMaxRequests()).toBe(50);
    });

    it("should parse boolean env vars", () => {
      expect(env.enableClaudeCodePlugin()).toBe(false);
    });
  });
});
