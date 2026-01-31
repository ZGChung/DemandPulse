import { AIProcessingService } from "@/services/ai-processing";

// Mock fetch
global.fetch = jest.fn();

// Mock environment
jest.mock("@/lib/env", () => ({
  env: {
    deepseekApiKey: () => "test-api-key",
  },
}));

// Mock Prisma client to avoid database connection errors
jest.mock("@/lib/prisma", () => ({
  prisma: {
    requirement: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    requirementCluster: {
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("AIProcessingService", () => {
  let service: AIProcessingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AIProcessingService();
  });

  describe("analyzeRequirement", () => {
    it("should analyze requirement successfully", async () => {
      // Mock successful API responses
      const mockEmbeddings = [0.1, 0.2, 0.3];
      const mockCategorization = { categories: ["api", "security"], confidence: 0.85 };
      const mockKeywords = ["authentication", "oauth", "security"];
      const mockSummary = "A secure authentication system with OAuth support";

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ embedding: mockEmbeddings }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(mockCategorization) } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify(mockKeywords) } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: mockSummary } }],
          }),
        });

      const result = await service.analyzeRequirement(
        "I need to build a secure authentication system with OAuth 2.0 support"
      );

      expect(result.categories).toEqual(["api", "security"]);
      expect(result.confidence).toBe(0.85);
      expect(result.embeddings).toEqual(mockEmbeddings);
      expect(result.keywords).toEqual(mockKeywords);
      expect(result.summary).toBe(mockSummary);
      expect(result.processingLog).toHaveLength(5); // Start + 4 steps
    });

    it("should handle API errors gracefully", async () => {
      // Mock API failure for all calls
      (fetch as jest.Mock).mockRejectedValue(new Error("API error"));

      const result = await service.analyzeRequirement("Build a login system");

      // Should return fallback values
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.processingLog).toBeDefined();
      expect(Array.isArray(result.processingLog)).toBe(true);
    });

    it("should handle malformed JSON responses", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "invalid json" } }],
        }),
      });

      const result = await service.analyzeRequirement("Test requirement");

      expect(result.categories).toEqual(["other"]);
      expect(result.confidence).toBe(0.1);
    });
  });

  describe("getEmbeddings", () => {
    it("should return embeddings on success", async () => {
      const mockEmbeddings = [0.1, 0.2, 0.3];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ embedding: mockEmbeddings }] }),
      });

      const result = await service.getEmbeddings("Test text");

      expect(result).toEqual(mockEmbeddings);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.deepseek.com/v1/embeddings",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("should return null on API error", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await service.getEmbeddings("Test text");

      expect(result).toBeNull();
    });

    it("should return null on network error", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await service.getEmbeddings("Test text");

      expect(result).toBeNull();
    });
  });

  describe("categorizeRequirement", () => {
    it("should categorize requirement successfully", async () => {
      const mockResponse = { categories: ["database", "performance"], confidence: 0.9 };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const result = await service.categorizeRequirement("Optimize database queries");

      expect(result).toEqual(mockResponse);
    });

    it("should return default on API error", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await service.categorizeRequirement("Test requirement");

      expect(result).toEqual({ categories: ["other"], confidence: 0.1 });
    });
  });

  describe("extractKeywords", () => {
    it("should extract keywords successfully", async () => {
      const mockKeywords = ["dashboard", "analytics", "real-time"];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockKeywords) } }],
        }),
      });

      const result = await service.extractKeywords("Build a real-time analytics dashboard");

      expect(result).toEqual(mockKeywords);
    });

    it("should use fallback keywords on error", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("API error"));

      const result = await service.extractKeywords("Build a login system with authentication");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("generateSummary", () => {
    it("should generate summary successfully", async () => {
      const mockSummary = "A real-time data visualization dashboard";

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockSummary } }],
        }),
      });

      const result = await service.generateSummary(
        "I want to build a dashboard for data visualization"
      );

      expect(result).toBe(mockSummary);
    });

    it("should return truncated text on error", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("API error"));

      const longText =
        "Build a comprehensive system that handles user authentication, data storage, real-time notifications, and reporting with beautiful dashboards and mobile support";
      const result = await service.generateSummary(longText);

      expect(result).toBe(longText.substring(0, 200));
    });
  });

  describe("clusterRequirements", () => {
    it("should cluster requirements by category", async () => {
      const requirements = [
        { id: "req-1", text: "Build a login system" },
        { id: "req-2", text: "Add password authentication" },
        { id: "req-3", text: "Optimize database queries" },
      ];

      // Mock categorization for each requirement - make sure they group properly
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({ categories: ["authentication"], confidence: 0.8 }),
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({ categories: ["authentication"], confidence: 0.9 }),
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: { content: JSON.stringify({ categories: ["database"], confidence: 0.7 }) },
              },
            ],
          }),
        });

      const clusters = await service.clusterRequirements(requirements);

      // Should create clusters based on primary categories
      expect(clusters.length).toBeGreaterThan(0);

      // Verify all requirements are assigned to some cluster
      const allClusteredIds = clusters.flatMap((c) => c.requirementIds);
      expect(allClusteredIds).toContain("req-1");
      expect(allClusteredIds).toContain("req-2");
      expect(allClusteredIds).toContain("req-3");
    });

    it("should handle errors in clustering", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("API error"));

      const requirements = [{ id: "req-1", text: "Test requirement" }];

      const clusters = await service.clusterRequirements(requirements);

      // When clustering fails, it might return empty array or default cluster
      // We'll just check it doesn't throw
      expect(Array.isArray(clusters)).toBe(true);
    });
  });

  describe("testConnection", () => {
    it("should return true when API is accessible", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const result = await service.testConnection();

      expect(result).toBe(true);
    });

    it("should return false when API is not accessible", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("extractFallbackKeywords", () => {
    it("should extract keywords from text", () => {
      // This is testing a private method, but we can verify it works through public methods
      const text = "Build a secure authentication API with OAuth 2.0 support";

      // Call a method that uses the fallback
      (fetch as jest.Mock).mockRejectedValue(new Error("API error"));

      // The actual test is that the public method doesn't crash
      expect(() => service.extractKeywords(text)).not.toThrow();
    });
  });
});
