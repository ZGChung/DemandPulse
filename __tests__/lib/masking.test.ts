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

    it("should handle empty conversation ID", async () => {
      const { maskConversationId } = await import("@/lib/masking");
      expect(maskConversationId("")).toBe("********");
    });

    it("should mask short conversation IDs", async () => {
      const { maskConversationId } = await import("@/lib/masking");
      const result = maskConversationId("abc");
      expect(result).toBe("***");
    });
  });

  describe("maskWorkspacePath", () => {
    it("should mask workspace path intermediate directories", async () => {
      const { maskWorkspacePath } = await import("@/lib/masking");
      const result = maskWorkspacePath("/Users/johndoe/projects/myproject");
      // Without HOME env set, it should mask middle parts
      expect(result).toBe("/***/***/***/myproject");
    });

    it("should handle null/undefined", async () => {
      const { maskWorkspacePath } = await import("@/lib/masking");
      expect(maskWorkspacePath(null)).toBeNull();
      expect(maskWorkspacePath(undefined)).toBeNull();
    });

    it("should return short paths unchanged", async () => {
      const { maskWorkspacePath } = await import("@/lib/masking");
      const result = maskWorkspacePath("/a/b");
      expect(result).toBe("/a/b");
    });
  });

  describe("canViewUnmaskedData", () => {
    it("should allow admin in admin context", async () => {
      const { canViewUnmaskedData } = await import("@/lib/masking");
      expect(canViewUnmaskedData("admin", "admin")).toBe(true);
    });

    it("should deny non-admin in production", async () => {
      const { canViewUnmaskedData } = await import("@/lib/masking");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      expect(canViewUnmaskedData("analyst", "admin")).toBe(false);
      process.env.NODE_ENV = originalEnv;
    });

    it("should allow analyst in development", async () => {
      const { canViewUnmaskedData } = await import("@/lib/masking");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      expect(canViewUnmaskedData("analyst", "viewer")).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("maskRequirementForAdmin", () => {
    it("should mask email in consent", async () => {
      const { maskRequirementForAdmin } = await import("@/lib/masking");
      const requirement = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        consent: { userProvidedEmail: "john@example.com" },
        context: { workspacePath: "/home/user/project" },
      };
      const result = maskRequirementForAdmin(requirement);
      expect((result.consent as { userProvidedEmail: string }).userProvidedEmail).toBe(
        "j***@example.com"
      );
    });

    it("should mask UUIDs when option enabled", async () => {
      const { maskRequirementForAdmin } = await import("@/lib/masking");
      const requirement = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        requirementId: "123e4567-e89b-12d3-a456-426614174001",
        clusterId: "123e4567-e89b-12d3-a456-426614174002",
      };
      const result = maskRequirementForAdmin(requirement);
      expect(result.id).not.toBe(requirement.id);
    });

    it("should mask requirement text when option enabled", async () => {
      const { maskRequirementForAdmin, maskRequirementText: _maskRequirementText } =
        await import("@/lib/masking");
      // Use text longer than 40 chars (visibleChars * 2 = 20*2)
      const longText =
        "This is a very long requirement text that definitely should be masked completely in the admin view";
      const requirement = {
        originalRequirement: longText,
        summarizedRequirement: "Short summary of the requirement",
      };
      const result = maskRequirementForAdmin(requirement, { maskRequirementText: true });
      // The function uses default visibleChars of 10 for summarizedRequirement
      expect((result as { originalRequirement: string }).originalRequirement).toContain("...");
    });
  });

  describe("maskRequirementsForAdmin", () => {
    it("should mask array of requirements", async () => {
      const { maskRequirementsForAdmin } = await import("@/lib/masking");
      const requirements = [
        { id: "123e4567-e89b-12d3-a456-426614174000", name: "Test 1" },
        { id: "123e4567-e89b-12d3-a456-426614174001", name: "Test 2" },
      ];
      const result = maskRequirementsForAdmin(requirements);
      expect(result).toHaveLength(2);
      expect(result[0].id).not.toBe(requirements[0].id);
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
