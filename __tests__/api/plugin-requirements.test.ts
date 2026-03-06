// Tests for plugin requirements API

jest.mock("@/lib/validation", () => ({
  sanitizeText: (text: string) => text,
}));

jest.mock("@/lib/validation-middleware", () => ({
  requirementSubmissionSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
  validateRequirementSubmission: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  validateQueryParams: jest.fn().mockImplementation((params, _schema) => {
    const count = params.get("count");
    if (count && !/^\d+$/.test(count)) {
      return { success: false, errors: [{ path: ["count"], message: "Invalid count" }] };
    }
    return { success: true, data: { count: count ? parseInt(count, 10) : undefined } };
  }),
}));

jest.mock("@/services/data-collection-flow", () => ({
  DataCollectionFlow: jest.fn().mockImplementation(() => ({
    handleUserConsent: jest.fn().mockResolvedValue({
      success: true,
      collectedRequirement: {
        requirementId: "test-id",
        originalRequirement: "test requirement",
        summarizedRequirement: "test summary",
        consent: {
          consentOptions: { dataCollection: true, contact: false, anonymization: true },
          consentedAt: new Date(),
        },
      },
    }),
  })),
}));

describe("Plugin Requirements API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PLUGIN_API_KEY = "test-api-key";
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
  });

  describe("POST", () => {
    it("should return 401 without API key", async () => {
      const { POST } = await import("@/app/api/plugin/requirements/route");
      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid API key", async () => {
      const { POST } = await import("@/app/api/plugin/requirements/route");
      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "POST",
        headers: { "x-api-key": "wrong-key" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid JSON body", async () => {
      const { POST } = await import("@/app/api/plugin/requirements/route");
      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "POST",
        headers: { "x-api-key": "test-api-key" },
        body: "invalid json",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid schema", async () => {
      const { POST } = await import("@/app/api/plugin/requirements/route");
      const { requirementSubmissionSchema } = require("@/lib/validation-middleware");
      const { z } = require("zod");

      // Throw a ZodError to trigger the 400 response
      (requirementSubmissionSchema.parse as jest.Mock).mockImplementation(() => {
        throw new z.ZodError([
          { path: ["originalRequirement"], message: "Invalid", code: "invalid_type" },
        ]);
      });

      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "POST",
        headers: { "x-api-key": "test-api-key" },
        body: JSON.stringify({ originalRequirement: "test" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 when custom validation fails", async () => {
      const { POST } = await import("@/app/api/plugin/requirements/route");
      const { validateRequirementSubmission } = require("@/lib/validation-middleware");

      (validateRequirementSubmission as jest.Mock).mockReturnValue({
        valid: false,
        errors: ["originalRequirement: Required"],
      });

      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "POST",
        headers: { "x-api-key": "test-api-key" },
        body: JSON.stringify({ originalRequirement: "test requirement" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("should return 401 without API key", async () => {
      const { GET } = await import("@/app/api/plugin/requirements/route");
      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid query params", async () => {
      const { GET } = await import("@/app/api/plugin/requirements/route");
      const { validateQueryParams } = require("@/lib/validation-middleware");

      (validateQueryParams as jest.Mock).mockReturnValue({
        success: false,
        errors: [{ path: ["count"], message: "Invalid" }],
      });

      const request = new Request("http://localhost:3000/api/plugin/requirements?count=invalid", {
        method: "GET",
        headers: { "x-api-key": "test-api-key" },
      });

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("should return requirements with valid API key", async () => {
      const { GET } = await import("@/app/api/plugin/requirements/route");
      const { validateQueryParams } = require("@/lib/validation-middleware");

      // Reset mock to return success
      (validateQueryParams as jest.Mock).mockReturnValue({
        success: true,
        data: { count: 1 },
      });

      const request = new Request("http://localhost:3000/api/plugin/requirements", {
        method: "GET",
        headers: { "x-api-key": "test-api-key" },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requirements).toBeDefined();
    });
  });
});
