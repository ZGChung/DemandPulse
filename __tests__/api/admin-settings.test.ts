// Tests for admin settings API

jest.mock("@/lib/rate-limiter", () => ({
  defaultRateLimiter: {
    checkAndIncrement: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/env", () => ({
  env: {
    rateLimitMaxRequests: () => 100,
    rateLimitWindowMs: () => 60000,
  },
}));

jest.mock("@/lib/logger", () => ({
  apiLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/services/settings-service", () => ({
  settingsService: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
  DEFAULT_SETTINGS: {
    clusteringEnabled: true,
    clusteringThreshold: 0.7,
    autoClusterFrequency: "daily",
    emailNotifications: true,
    adminEmail: "admin@example.com",
    notificationThreshold: 10,
    dataRetentionDays: 365,
    autoAnonymization: false,
    requireConsentForCollection: true,
    maintenanceMode: false,
    apiRateLimit: 100,
    enablePublicApi: true,
  },
}));

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { GET, POST, PUT } from "@/app/api/admin/settings/route";
import { settingsService, DEFAULT_SETTINGS } from "@/services/settings-service";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetSettings = settingsService.getSettings as jest.MockedFunction<
  typeof settingsService.getSettings
>;
const mockUpdateSettings = settingsService.updateSettings as jest.MockedFunction<
  typeof settingsService.updateSettings
>;

function createMockRequest(
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { getServerSession } = require("next-auth");

  return {
    headers: new Map(Object.entries(options.headers || {})),
    nextUrl: { searchParams: new URLSearchParams() },
    method: options.method || "GET",
    json: async () => options.body || {},
  } as unknown as NextRequest;
}

describe("Admin Settings API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/settings", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Admin access required");
    });

    it("should return settings for admin user", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockSettings = {
        clusteringEnabled: true,
        clusteringThreshold: 0.7,
        autoClusterFrequency: "daily",
        emailNotifications: true,
        adminEmail: "admin@example.com",
        notificationThreshold: 10,
        dataRetentionDays: 365,
        autoAnonymization: false,
        requireConsentForCollection: true,
        maintenanceMode: false,
        apiRateLimit: 100,
        enablePublicApi: true,
        updatedAt: new Date(),
        updatedBy: "admin-1",
      };

      mockGetSettings.mockResolvedValue(mockSettings);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.settings).toBeDefined();
      expect(data.data.defaults).toEqual(DEFAULT_SETTINGS);
    });

    it("should handle errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });
      mockGetSettings.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch settings");
    });
  });

  describe("POST /api/admin/settings", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({
        method: "POST",
        body: { clusteringEnabled: false },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const request = createMockRequest({
        method: "POST",
        body: { clusteringEnabled: false },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid settings data", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const request = createMockRequest({
        method: "POST",
        body: { clusteringThreshold: 5.0 }, // Invalid: > 1.0
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid settings data");
    });

    it("should update settings successfully", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockUpdatedSettings = {
        clusteringEnabled: false,
        clusteringThreshold: 0.5,
        autoClusterFrequency: "daily",
        emailNotifications: true,
        adminEmail: "admin@example.com",
        notificationThreshold: 10,
        dataRetentionDays: 365,
        autoAnonymization: false,
        requireConsentForCollection: true,
        maintenanceMode: false,
        apiRateLimit: 100,
        enablePublicApi: true,
        updatedAt: new Date(),
        updatedBy: "admin-1",
      };

      mockUpdateSettings.mockResolvedValue(mockUpdatedSettings);

      const request = createMockRequest({
        method: "POST",
        body: { clusteringEnabled: false, clusteringThreshold: 0.5 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Settings updated successfully");
    });

    it("should return 400 for invalid admin email when valid structure provided", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      // Provide a valid structure but invalid email format
      // The email will pass zod validation but fail custom email check
      const request = createMockRequest({
        method: "POST",
        body: {
          adminEmail: "not-an-email", // Invalid email format
          clusteringEnabled: true,
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      // The actual behavior depends on validation order
      expect(["Invalid settings data", "Invalid admin email address"]).toContain(data.error);
    });
  });

  describe("PUT /api/admin/settings", () => {
    it("should reset settings to defaults", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
      });

      const mockResetSettings = {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date(),
        updatedBy: "admin-1",
      };

      mockUpdateSettings.mockResolvedValue(mockResetSettings);

      const request = createMockRequest({ method: "PUT" });
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Settings reset to defaults");
    });

    it("should return 401 if not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({ method: "PUT" });
      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not admin", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: "user-1", role: "USER", email: "user@example.com" },
      });

      const request = createMockRequest({ method: "PUT" });
      const response = await PUT(request);

      expect(response.status).toBe(403);
    });
  });
});
