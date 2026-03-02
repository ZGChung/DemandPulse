import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock the entire health route module
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheKey = jest.fn((key: string) => `test:${key}`);

const mockValidateEnv = jest.fn();
const mockAppName = jest.fn().mockReturnValue("DemandPulse");
const mockAppUrl = jest.fn().mockReturnValue("https://demandpulse.app");
const mockEnableClaudeCodePlugin = jest.fn().mockReturnValue(true);
const mockEnableAiProcessing = jest.fn().mockReturnValue(true);

const mockWithRequestLogging = jest.fn(
  (handler: (request: unknown) => Promise<unknown>) => handler
);

jest.mock("@/lib/cache", () => ({
  cacheGet: (...args: unknown[]) => mockCacheGet(...args),
  cacheKey: (...args: unknown[]) => mockCacheKey(...args),
  cacheSet: (...args: unknown[]) => mockCacheSet(...args),
}));

jest.mock("@/lib/env", () => ({
  validateEnv: (...args: unknown[]) => mockValidateEnv(...args),
  env: {
    appName: (...args: unknown[]) => mockAppName(...args),
    appUrl: (...args: unknown[]) => mockAppUrl(...args),
    enableClaudeCodePlugin: (...args: unknown[]) => mockEnableClaudeCodePlugin(...args),
    enableAiProcessing: (...args: unknown[]) => mockEnableAiProcessing(...args),
  },
}));

jest.mock("@/lib/with-request-logging", () => ({
  withRequestLogging: (...args: unknown[]) => mockWithRequestLogging(...args),
}));

describe("Health API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Health check logic", () => {
    it("should return cached health response when available", async () => {
      const cachedResponse = {
        status: "healthy",
        timestamp: "2026-01-01T00:00:00.000Z",
        app: { name: "DemandPulse", url: "https://demandpulse.app" },
        features: { claudeCodePlugin: true, aiProcessing: true },
        environment: "test",
      };
      mockCacheGet.mockReturnValue(cachedResponse);

      // Import after mocks are set up
      const { GET } = await import("../../app/api/health/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/health" },
        method: "GET",
        headers: { get: () => null },
      } as unknown;

      const response = await GET(mockRequest as never);
      const body = (response as { json: () => Promise<unknown> }).json();

      expect(mockCacheGet).toHaveBeenCalledWith("test:health");
      expect(await body).toEqual(cachedResponse);
    });

    it("should call validateEnv and return healthy status when checks pass", async () => {
      mockCacheGet.mockReturnValue(null);

      const { GET } = await import("../../app/api/health/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/health" },
        method: "GET",
        headers: { get: () => null },
      } as unknown;

      const response = await GET(mockRequest as never);

      expect(mockValidateEnv).toHaveBeenCalled();
      expect(mockCacheSet).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it("should return 500 status when validateEnv throws", async () => {
      mockCacheGet.mockReturnValue(null);
      mockValidateEnv.mockImplementation(() => {
        throw new Error("Missing required env var");
      });

      const { GET } = await import("../../app/api/health/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/health" },
        method: "GET",
        headers: { get: () => null },
      } as unknown;

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(500);
    });
  });

  describe("Health response structure", () => {
    it("should include required fields in healthy response", async () => {
      mockCacheGet.mockReturnValue(null);
      mockValidateEnv.mockReturnValue(true); // Don't throw

      const { GET } = await import("../../app/api/health/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/health" },
        method: "GET",
        headers: { get: () => null },
      } as unknown;

      const response = await GET(mockRequest as never);
      const body = await (response as { json: () => Promise<Record<string, unknown>> }).json();

      expect(body.status).toBe("healthy");
      expect(body.timestamp).toBeDefined();
      expect(body.app).toEqual({
        name: "DemandPulse",
        url: "https://demandpulse.app",
      });
      expect(body.features).toEqual({
        claudeCodePlugin: true,
        aiProcessing: true,
      });
      expect(body.environment).toBe(process.env.NODE_ENV);
    });
  });
});
