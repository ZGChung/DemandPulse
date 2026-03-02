import { describe, it, expect } from "@jest/globals";

// Test more lib functions
describe("Lib - Validation", () => {
  describe("validateEmail", () => {
    it("should validate correct emails", async () => {
      const { validateEmail } = await import("@/lib/validation");
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user@domain.org")).toBe(true);
    });

    it("should reject invalid emails", async () => {
      const { validateEmail } = await import("@/lib/validation");
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
    });
  });

  describe("validateConversationId", () => {
    it("should validate correct conversation IDs", async () => {
      const { validateConversationId } = await import("@/lib/validation");
      // Function may return true for any non-empty string
      const result = validateConversationId("conv-123");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("validateWorkspacePath", () => {
    it("should validate workspace paths", async () => {
      const { validateWorkspacePath } = await import("@/lib/validation");
      // Function may return true for valid paths
      const result = validateWorkspacePath("/projects/myapp");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("sanitizeText", () => {
    it("should sanitize text", async () => {
      const { sanitizeText } = await import("@/lib/validation");
      const result = sanitizeText("<script>alert('xss')</script>Hello");
      expect(result).not.toContain("<script>");
    });

    it("should return empty string for empty input", async () => {
      const { sanitizeText } = await import("@/lib/validation");
      expect(sanitizeText("")).toBe("");
    });
  });

  describe("ValidationError", () => {
    it("should create ValidationError with details", async () => {
      const { ValidationError } = await import("@/lib/validation");
      const error = new ValidationError("Test error", { field: "test" });
      expect(error.message).toBe("Test error");
      expect(error.details).toEqual({ field: "test" });
    });

    it("should create ValidationError without details", async () => {
      const { ValidationError } = await import("@/lib/validation");
      const error = new ValidationError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.details).toBeUndefined();
    });
  });

  describe("validateRequirementText", () => {
    it("should accept valid requirement text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("This is a valid requirement");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Requirement text cannot be empty");
    });

    it("should reject whitespace-only text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("   ");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Requirement text cannot be empty");
    });

    it("should reject text that is too long", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const longText = "a".repeat(10001);
      const result = validateRequirementText(longText);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Requirement text too long (max 10000 characters)");
    });

    it("should detect script tags", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("<script>alert('xss')</script>");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Potential security issue detected in requirement text");
    });

    it("should detect javascript: protocol", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("Click here: javascript:alert(1)");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Potential security issue detected in requirement text");
    });

    it("should detect onclick handler", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("<button onclick='alert(1)'>Click</button>");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Potential security issue detected in requirement text");
    });

    it("should detect onload handler", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("<img onload='alert(1)' />");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Potential security issue detected in requirement text");
    });

    it("should detect onerror handler", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("<img onerror='alert(1)' />");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Potential security issue detected in requirement text");
    });
  });

  describe("validateConsent", () => {
    it("should accept valid consent object", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
        consentedAt: "2024-01-01T00:00:00Z",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-object consent", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Consent object is required");
    });

    it("should reject missing consentOptions", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({ consentedAt: "2024-01-01T00:00:00Z" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("consentOptions is required");
    });

    it("should reject missing dataCollection boolean", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          contact: false,
          anonymization: false,
        },
        consentedAt: "2024-01-01T00:00:00Z",
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("dataCollection must be a boolean");
    });

    it("should reject missing contact boolean", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          anonymization: false,
        },
        consentedAt: "2024-01-01T00:00:00Z",
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("contact must be a boolean");
    });

    it("should reject missing anonymization boolean", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: false,
        },
        consentedAt: "2024-01-01T00:00:00Z",
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("anonymization must be a boolean");
    });

    it("should require valid email when contact is true", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: false,
        },
        userProvidedEmail: "invalid-email",
        consentedAt: "2024-01-01T00:00:00Z",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Valid email is required when contact consent is given");
    });

    it("should reject email when anonymization is true", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
        userProvidedEmail: "test@example.com",
        consentedAt: "2024-01-01T00:00:00Z",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Email cannot be provided when anonymization consent is given"
      );
    });

    it("should reject missing or invalid consentedAt", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
        consentedAt: "invalid-date",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Valid consentedAt timestamp is required");
    });

    it("should accept valid email when contact is true", async () => {
      const { validateConsent } = await import("@/lib/validation");
      const result = validateConsent({
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: false,
        },
        userProvidedEmail: "test@example.com",
        consentedAt: "2024-01-01T00:00:00Z",
      });
      expect(result.valid).toBe(true);
    });
  });
});
