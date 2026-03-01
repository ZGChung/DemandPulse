import {
  validateRequirementSubmission,
  validateQueryParams,
  requirementQuerySchema,
  claudeCodeContextSchema,
  userConsentSchema,
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

    it("should reject negative offset", () => {
      const searchParams = new URLSearchParams({
        offset: "-1",
      });

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(false);
    });

    it("should accept valid sort values", () => {
      const searchParams = new URLSearchParams({
        sort: "priority",
      });

      const result = validateQueryParams(searchParams, requirementQuerySchema);

      expect(result.success).toBe(true);
    });
  });

  describe("claudeCodeContextSchema", () => {
    it("should parse valid context data", () => {
      const validContext = {
        conversationId: "conv-123",
        userId: "user-456",
        workspacePath: "/test/path",
        timestamp: "2024-01-01T00:00:00Z",
      };
      expect(claudeCodeContextSchema.parse(validContext)).toBeDefined();
    });

    it("should parse context with Date timestamp", () => {
      const validContext = {
        conversationId: "conv-123",
        timestamp: new Date(),
      };
      expect(claudeCodeContextSchema.parse(validContext)).toBeDefined();
    });

    it("should reject empty conversationId", () => {
      const invalidContext = {
        conversationId: "",
      };
      expect(() => claudeCodeContextSchema.parse(invalidContext)).toThrow();
    });

    it("should accept optional fields", () => {
      const minimalContext = {
        conversationId: "conv-123",
        timestamp: "2024-01-01T00:00:00Z",
      };
      expect(claudeCodeContextSchema.parse(minimalContext)).toBeDefined();
    });
  });

  describe("userConsentSchema", () => {
    it("should parse valid consent data", () => {
      const validConsent = {
        requirementId: "req-123",
        consentedAt: "2024-01-01T00:00:00Z",
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };
      expect(userConsentSchema.parse(validConsent)).toBeDefined();
    });

    it("should parse consent with Date timestamp", () => {
      const validConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };
      expect(userConsentSchema.parse(validConsent)).toBeDefined();
    });

    it("should accept optional userProvidedEmail", () => {
      const consentWithEmail = {
        requirementId: "req-123",
        consentedAt: "2024-01-01T00:00:00Z",
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: false,
        },
        userProvidedEmail: "test@example.com",
      };
      expect(userConsentSchema.parse(consentWithEmail)).toBeDefined();
    });

    it("should accept empty email string", () => {
      const consentWithEmptyEmail = {
        requirementId: "req-123",
        consentedAt: "2024-01-01T00:00:00Z",
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
        userProvidedEmail: "",
      };
      expect(userConsentSchema.parse(consentWithEmptyEmail)).toBeDefined();
    });

    it("should reject invalid email format", () => {
      const invalidEmail = {
        requirementId: "req-123",
        consentedAt: "2024-01-01T00:00:00Z",
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
        userProvidedEmail: "not-an-email",
      };
      expect(() => userConsentSchema.parse(invalidEmail)).toThrow();
    });
  });
});
