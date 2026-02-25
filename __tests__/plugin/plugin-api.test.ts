import { POST, GET } from "@/app/api/plugin/requirements/route";

// Mock the DataCollectionFlow
jest.mock("@/services/data-collection-flow", () => {
  return {
    DataCollectionFlow: jest.fn().mockImplementation(() => ({
      handleUserConsent: jest.fn().mockResolvedValue({
        success: true,
        collectedRequirement: {
          requirementId: "test-req-id",
          originalRequirement: "Test requirement",
          summarizedRequirement: "Test summary",
          context: {
            conversationId: "test-conv-id",
            timestamp: new Date(),
          },
          consent: {
            requirementId: "test-req-id",
            consentedAt: new Date(),
            consentOptions: {
              dataCollection: true,
              contact: false,
              anonymization: true,
            },
            userProvidedEmail: undefined,
          },
        },
        errors: [],
      }),
    })),
  };
});

// Mock database service (dynamic import in route)
jest.mock("@/services/database-service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    storeRequirement: jest.fn().mockResolvedValue("stored-test-id"),
    updateRequirementEmbedding: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock AIProcessingService
jest.mock("@/services/ai-processing", () => ({
  AIProcessingService: jest.fn().mockImplementation(() => ({
    analyzeRequirement: jest.fn().mockResolvedValue({
      embeddings: [0.1, 0.2, 0.3],
    }),
  })),
}));

// Mock crypto.randomUUID
jest.mock("crypto", () => ({
  randomUUID: jest.fn().mockReturnValue("mock-uuid"),
}));

// Helper to create a mock request object
function createMockRequest(options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}): any {
  const urlObj = new URL(options.url);
  return {
    method: options.method,
    url: options.url,
    headers: {
      get: (name: string) => {
        const lowerName = name.toLowerCase();
        const header = Object.entries(options.headers || {}).find(
          ([key]) => key.toLowerCase() === lowerName
        );
        return header ? header[1] : null;
      },
    },
    json: async () => options.body,
  };
}

describe("Plugin API Endpoint", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (process.env as any).NODE_ENV = "test";
    (process.env as any).DATABASE_URL = "file:./test.db";
    (process.env as any).PLUGIN_API_KEY = "test-plugin-api-key-123";
    (process.env as any).ENABLE_AI_PROCESSING = "false";
  });

  afterEach(() => {
    (process.env as any) = originalEnv;
  });

  describe("POST /api/plugin/requirements", () => {
    it("should reject requests without API key", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/plugin/requirements",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          requirementId: "test-id",
          originalRequirement: "Test requirement",
          summarizedRequirement: "Test summary",
          context: {
            conversationId: "conv-id",
            timestamp: new Date().toISOString(),
          },
          consent: {
            requirementId: "test-id",
            consentedAt: new Date().toISOString(),
            consentOptions: {
              dataCollection: true,
              contact: false,
              anonymization: true,
            },
            userProvidedEmail: "",
          },
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("API key");
    });

    it("should reject requests with invalid API key", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/plugin/requirements",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "wrong-key",
        },
        body: {
          requirementId: "test-id",
          originalRequirement: "Test requirement",
          summarizedRequirement: "Test summary",
          context: {
            conversationId: "conv-id",
            timestamp: new Date().toISOString(),
          },
          consent: {
            requirementId: "test-id",
            consentedAt: new Date().toISOString(),
            consentOptions: {
              dataCollection: true,
              contact: false,
              anonymization: true,
            },
            userProvidedEmail: "",
          },
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("API key");
    });

    it("should accept valid requests with correct API key", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/plugin/requirements",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-plugin-api-key-123",
        },
        body: {
          requirementId: "test-id",
          originalRequirement: "Test requirement",
          summarizedRequirement: "Test summary",
          context: {
            conversationId: "conv-id",
            timestamp: new Date().toISOString(),
          },
          consent: {
            requirementId: "test-id",
            consentedAt: new Date().toISOString(),
            consentOptions: {
              dataCollection: true,
              contact: false,
              anonymization: true,
            },
            userProvidedEmail: "",
          },
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requirementId).toBeDefined();
      expect(data.message).toContain("plugin");
    });

    it("should validate request body", async () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/plugin/requirements",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-plugin-api-key-123",
        },
        body: {},
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Validation");
    });
  });

  describe("GET /api/plugin/requirements", () => {
    it("should require API key", async () => {
      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/plugin/requirements",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return mock requirements with valid API key", async () => {
      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/plugin/requirements",
        headers: {
          "x-api-key": "test-plugin-api-key-123",
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requirements).toBeDefined();
      expect(Array.isArray(data.requirements)).toBe(true);
    });

    it("should respect count query parameter", async () => {
      const request = createMockRequest({
        method: "GET",
        url: "http://localhost:3000/api/plugin/requirements?count=3",
        headers: {
          "x-api-key": "test-plugin-api-key-123",
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.count).toBe(3);
      expect(data.requirements.length).toBe(3);
    });
  });
});
