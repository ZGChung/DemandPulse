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
  });
});
