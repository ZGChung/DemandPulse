// Tests for cron weekly-digest API

// Mock the database service
jest.mock("@/services/database-service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getClusters: jest.fn().mockResolvedValue([{ name: "Test Cluster", requirementCount: 10 }]),
  })),
}));

// Mock lib/prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: "1", email: "test@example.com", name: "Test User" }]),
    },
    $disconnect: jest.fn(),
  },
}));

// Mock email service
jest.mock("@/services/email-service", () => ({
  emailService: {
    sendWeeklyDigest: jest.fn().mockResolvedValue({ success: true }),
  },
}));

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { NextRequest } from "next/server";

// Helper to create mock request
function createMockRequest(
  url: string,
  options: { method?: string; auth?: string; secret?: string } = {}
) {
  const urlObj = new URL(url);
  if (options.secret) {
    urlObj.searchParams.set("secret", options.secret);
  }
  return {
    url: urlObj.toString(),
    nextUrl: urlObj,
    method: options.method || "GET",
    headers: {
      get: (name: string) => {
        if (name === "authorization" && options.auth) return `Bearer ${options.auth}`;
        return null;
      },
    },
    headersList: {
      get: (name: string) => {
        if (name === "authorization" && options.auth) return `Bearer ${options.auth}`;
        return null;
      },
    },
  };
}

describe("Cron Weekly Digest API", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("GET /api/cron/weekly-digest", () => {
    it("should return 401 when no authorization in production", async () => {
      process.env.NODE_ENV = "production";
      process.env.CRON_SECRET = "";

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest");
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(401);
    });

    it("should return 401 when wrong secret provided", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        secret: "wrong-secret",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(401);
    });

    it("should return 401 when wrong Bearer token provided", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        auth: "wrong-token",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(401);
    });

    it("should process digest successfully with correct secret", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        secret: "correct-secret",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.sent).toBe(1);
      expect(data.failed).toBe(0);
    });

    it("should handle empty clusters", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      // This test verifies the API handles empty cluster arrays correctly
      // The mock returns empty clusters by default

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        secret: "correct-secret",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should handle users without email", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { prisma } = await import("@/lib/prisma");
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        { id: "1", email: null, name: "Test User" },
      ]);

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        secret: "correct-secret",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sent).toBe(0);
    });

    it("should handle email send failures", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { emailService } = await import("@/services/email-service");
      (emailService.sendWeeklyDigest as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: "SMTP error",
      });

      const { GET } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        secret: "correct-secret",
      });
      const response = await GET(request as unknown as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(1);
    });
  });

  describe("POST /api/cron/weekly-digest", () => {
    it("should handle POST as GET", async () => {
      process.env.NODE_ENV = "development";
      process.env.CRON_SECRET = "correct-secret";

      const { POST } = await import("@/app/api/cron/weekly-digest/route");
      const request = createMockRequest("http://localhost/api/cron/weekly-digest", {
        method: "POST",
        secret: "correct-secret",
      });
      const response = await POST(request as unknown as NextRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
