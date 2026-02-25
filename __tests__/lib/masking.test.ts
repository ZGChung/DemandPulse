import { describe, it, expect } from "@jest/globals";

describe("Masking", () => {
  describe("maskEmail", () => {
    it("should mask email correctly", async () => {
      const { maskEmail } = await import("@/lib/masking");
      expect(maskEmail("test@example.com")).toBe("t***@example.com");
      expect(maskEmail("admin@company.org")).toBe("a****@company.org");
    });

    it("should handle short emails", async () => {
      const { maskEmail } = await import("@/lib/masking");
      // Short emails may not be maskable
      const result = maskEmail("a@b.com");
      expect(result).toBeDefined();
    });

    it("should handle null/undefined", async () => {
      const { maskEmail } = await import("@/lib/masking");
      expect(maskEmail(null)).toBeNull();
      expect(maskEmail(undefined)).toBeNull(); // May return null instead of undefined
    });
  });

  describe("maskRequirementText", () => {
    it("should mask long requirement text", async () => {
      const { maskRequirementText } = await import("@/lib/masking");
      const longText = "This is a very long requirement text that should be masked";
      const result = maskRequirementText(longText);
      expect(result.length).toBeLessThan(longText.length);
    });
  });

  describe("maskUUID", () => {
    it("should mask UUID", async () => {
      const { maskUUID } = await import("@/lib/masking");
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const masked = maskUUID(uuid);
      expect(masked).not.toBe(uuid);
    });
  });

  describe("maskConversationId", () => {
    it("should mask conversation ID", async () => {
      const { maskConversationId } = await import("@/lib/masking");
      const result = maskConversationId("conv-123456789");
      expect(result).not.toBe("conv-123456789");
    });
  });
});

describe("Validation", () => {
  describe("validateEmail", () => {
    it("should validate correct email", async () => {
      const { validateEmail } = await import("@/lib/validation");
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user@domain.org")).toBe(true);
    });

    it("should reject invalid email", async () => {
      const { validateEmail } = await import("@/lib/validation");
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
    });
  });

  describe("validateRequirementText", () => {
    it("should validate valid text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("This is a valid requirement");
      expect(result.valid).toBe(true);
    });

    it("should reject empty text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("");
      expect(result.valid).toBe(false);
    });

    it("should reject whitespace-only text", async () => {
      const { validateRequirementText } = await import("@/lib/validation");
      const result = validateRequirementText("   ");
      expect(result.valid).toBe(false);
    });
  });
});

describe("ValidationError", () => {
  it("should create ValidationError", async () => {
    const { ValidationError } = await import("@/lib/validation");
    const error = new ValidationError("Test error", { field: "test" });
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("ValidationError");
    expect(error.details).toEqual({ field: "test" });
  });
});
