import {
  validateRequirementSubmission,
  validateQueryParams,
  requirementQuerySchema,
} from "@/lib/validation-middleware";

describe("validation-middleware", () => {
  describe("validateRequirementSubmission", () => {
    it("should return valid for correct data", () => {
      const validData = {
        requirementId: "req-123",
        originalRequirement: "This is a valid requirement with enough content.",
        summarizedRequirement: "Valid requirement summary.",
        context: {
          conversationId: "conv-123",
          workspacePath: "/test/workspace",
          timestamp: "2024-01-01T00:00:00Z",
        },
        consent: {
          requirementId: "req-123",
          consentedAt: "2024-01-01T00:00:00Z",
          consentOptions: {
            dataCollection: true,
            contact: false,
            anonymization: false,
          },
        },
      };

      const result = validateRequirementSubmission(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should require email when contact consent is given", () => {
      const dataWithContactConsent = {
        requirementId: "req-123",
        originalRequirement: "This is a valid requirement with enough content.",
        summarizedRequirement: "Valid requirement summary.",
        context: {
          conversationId: "conv-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
        consent: {
          requirementId: "req-123",
          consentedAt: "2024-01-01T00:00:00Z",
          consentOptions: {
            dataCollection: true,
            contact: true, // Contact consent given
            anonymization: false,
          },
          // Missing userProvidedEmail
        },
      };

      const result = validateRequirementSubmission(dataWithContactConsent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Email is required when contact consent is given");
    });

    it("should reject email when anonymization consent is given", () => {
      const dataWithAnonymizationAndEmail = {
        requirementId: "req-123",
        originalRequirement: "This is a valid requirement with enough content.",
        summarizedRequirement: "Valid requirement summary.",
        context: {
          conversationId: "conv-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
        consent: {
          requirementId: "req-123",
          consentedAt: "2024-01-01T00:00:00Z",
          consentOptions: {
            dataCollection: true,
            contact: false,
            anonymization: true, // Anonymization consent given
          },
          userProvidedEmail: "test@example.com", // But email provided - should fail
        },
      };

      const result = validateRequirementSubmission(dataWithAnonymizationAndEmail);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Email cannot be provided when anonymization consent is given"
      );
    });
  });

  describe("validateQueryParams", () => {
    it("should validate valid query params", () => {
      const searchParams = new URLSearchParams({
        status: "pending",
        limit: "10",
        offset: "0",
        sort: "recent",
      });

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("pending");
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
        expect(result.data.sort).toBe("recent");
      }
    });

    it("should reject invalid status value", () => {
      const searchParams = new URLSearchParams({
        status: "invalid_status",
      });

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(false);
    });

    it("should reject limit over 100", () => {
      const searchParams = new URLSearchParams({
        limit: "200",
      });

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(false);
    });

    it("should accept valid optional params", () => {
      const searchParams = new URLSearchParams();

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeUndefined();
        expect(result.data.limit).toBeUndefined();
      }
    });
  });
});
