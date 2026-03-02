import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fetch globally
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

import { apiClient, RequirementsResponse } from "@/lib/api-client";

describe("ApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRequirements", () => {
    it("should fetch requirements without options", async () => {
      const mockResponse: RequirementsResponse = {
        success: true,
        data: {
          statistics: {
            totalRequirements: 10,
            byStatus: { pending: 5, processed: 3, clustered: 2 },
            privacyMetrics: { withContactConsent: 2, withAnonymization: 8 },
          },
          requirements: [],
          pagination: { total: 10, limit: 10, offset: 0, hasMore: false },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getRequirements();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/requirements"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch requirements with status filter", async () => {
      const mockResponse: RequirementsResponse = {
        success: true,
        data: {
          statistics: {
            totalRequirements: 5,
            byStatus: { pending: 5, processed: 0, clustered: 0 },
            privacyMetrics: { withContactConsent: 1, withAnonymization: 4 },
          },
          requirements: [],
          pagination: { total: 5, limit: 10, offset: 0, hasMore: false },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getRequirements({ status: "PENDING" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=PENDING"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch requirements with pagination options", async () => {
      const mockResponse: RequirementsResponse = {
        success: true,
        data: {
          statistics: {
            totalRequirements: 100,
            byStatus: { pending: 50, processed: 30, clustered: 20 },
            privacyMetrics: { withContactConsent: 10, withAnonymization: 80 },
          },
          requirements: [],
          pagination: { total: 100, limit: 20, offset: 40, hasMore: true },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getRequirements({
        limit: 20,
        offset: 40,
        sort: "priority",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      } as Response);

      await expect(apiClient.getRequirements()).rejects.toThrow(
        "Failed to fetch requirements: Internal Server Error"
      );
    });
  });

  describe("submitRequirement", () => {
    const validSubmissionData = {
      requirementId: "req-123",
      originalRequirement: "Build a REST API",
      summarizedRequirement: "Build REST API",
      context: {
        conversationId: "conv-456",
        workspacePath: "/Users/test/project",
        timestamp: "2026-03-01T10:00:00Z",
      },
      consent: {
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
        userProvidedEmail: undefined,
        consentedAt: "2026-03-01T10:00:00Z",
      },
    };

    it("should submit requirement successfully", async () => {
      const mockResponse = {
        success: true,
        requirementId: "req-123",
        message: "Requirement submitted successfully",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.submitRequirement(validSubmissionData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/requirements"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(validSubmissionData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should submit requirement with email", async () => {
      const dataWithEmail = {
        ...validSubmissionData,
        consent: {
          ...validSubmissionData.consent,
          userProvidedEmail: "test@example.com",
        },
      };

      const mockResponse = {
        success: true,
        requirementId: "req-123",
        message: "Requirement submitted successfully",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.submitRequirement(dataWithEmail);

      expect(result).toEqual(mockResponse);
    });

    it("should throw error when submission fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Validation failed" }),
      } as Response);

      await expect(apiClient.submitRequirement(validSubmissionData)).rejects.toThrow(
        "Validation failed"
      );
    });
  });

  describe("getHealth", () => {
    it("should return health status", async () => {
      const mockResponse = {
        status: "ok",
        timestamp: "2026-03-01T10:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/health"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when health check fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Service Unavailable",
      } as Response);

      await expect(apiClient.getHealth()).rejects.toThrow(
        "Health check failed: Service Unavailable"
      );
    });
  });
});
