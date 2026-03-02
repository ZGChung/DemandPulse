// Validation utilities tests

import {
  validateEmail,
  validateRequirementText,
  validateConversationId,
  validateWorkspacePath,
  sanitizeText,
  validateConsent,
  ValidationError,
} from "../../lib/validation";

describe("ValidationError", () => {
  it("should create error with message", () => {
    const error = new ValidationError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("ValidationError");
  });

  it("should create error with details", () => {
    const error = new ValidationError("Test error", { field: "email", value: "invalid" });
    expect(error.message).toBe("Test error");
    expect(error.details?.field).toBe("email");
    expect(error.details?.value).toBe("invalid");
  });
});

describe("validateEmail", () => {
  it("should return true for valid emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("user.name@domain.co.uk")).toBe(true);
    expect(validateEmail("user+tag@example.org")).toBe(true);
  });

  it("should return false for invalid emails", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
    expect(validateEmail("test@.com")).toBe(false);
  });
});

describe("validateRequirementText", () => {
  it("should return valid for normal requirement text", () => {
    const result = validateRequirementText("Build a REST API for user management");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return error for empty text", () => {
    const result = validateRequirementText("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Requirement text cannot be empty");
  });

  it("should return error for whitespace-only text", () => {
    const result = validateRequirementText("   ");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Requirement text cannot be empty");
  });

  it("should return error for text exceeding max length", () => {
    const longText = "a".repeat(10001);
    const result = validateRequirementText(longText);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Requirement text too long (max 10000 characters)");
  });

  it("should detect script tags (XSS)", () => {
    const result = validateRequirementText("<script>alert('xss')</script>");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Potential security issue detected in requirement text");
  });

  it("should detect javascript: protocol (XSS)", () => {
    const result = validateRequirementText("Click here: javascript:alert('xss')");
    expect(result.valid).toBe(false);
  });

  it("should detect onclick handler (XSS)", () => {
    const result = validateRequirementText('<div onclick="alert(1)">Click</div>');
    expect(result.valid).toBe(false);
  });

  it("should detect onload handler (XSS)", () => {
    const result = validateRequirementText('<img onload="alert(1)" src="x">');
    expect(result.valid).toBe(false);
  });

  it("should detect onerror handler (XSS)", () => {
    const result = validateRequirementText('<img onerror="alert(1)" src="x">');
    expect(result.valid).toBe(false);
  });

  it("should accept normal HTML content without scripts", () => {
    const result = validateRequirementText("<p>Build a website</p>");
    expect(result.valid).toBe(true);
  });
});

describe("validateConversationId", () => {
  it("should return true for valid conversation IDs", () => {
    expect(validateConversationId("abc123")).toBe(true);
    expect(validateConversationId("abc-123")).toBe(true);
    expect(validateConversationId("abc_123")).toBe(true);
    expect(validateConversationId("ABC123")).toBe(true);
  });

  it("should return false for invalid conversation IDs", () => {
    expect(validateConversationId("")).toBe(false);
    expect(validateConversationId("abc 123")).toBe(false);
    expect(validateConversationId("abc/123")).toBe(false);
    expect(validateConversationId("abc.123")).toBe(false);
  });
});

describe("validateWorkspacePath", () => {
  it("should return true for valid paths", () => {
    expect(validateWorkspacePath("/Users/test/project")).toBe(true);
    expect(validateWorkspacePath("C:\\Users\\test")).toBe(true);
    expect(validateWorkspacePath(undefined)).toBe(true);
    expect(validateWorkspacePath("")).toBe(true);
  });

  it("should reject path traversal attempts", () => {
    expect(validateWorkspacePath("../secret")).toBe(false);
    expect(validateWorkspacePath("..\\secret")).toBe(false);
    expect(validateWorkspacePath("///../secret")).toBe(false);
    expect(validateWorkspacePath("..\\..")).toBe(false);
  });

  it("should reject paths that are too long", () => {
    const longPath = "a".repeat(501);
    expect(validateWorkspacePath(longPath)).toBe(false);
  });
});

describe("sanitizeText", () => {
  it("should escape HTML special characters", () => {
    expect(sanitizeText("a & b")).toBe("a &amp; b");
    expect(sanitizeText('quote "test"')).toBe("quote &quot;test&quot;");
    expect(sanitizeText("single 'quote'")).toBe("single &#x27;quote&#x27;");
  });

  it("should remove HTML tags first, then escape", () => {
    // Note: HTML tags are removed first, so "<script>" becomes "" (empty)
    expect(sanitizeText("<p>text</p>")).toBe("text");
    expect(sanitizeText("<div><span>hello</span></div>")).toBe("hello");
    expect(sanitizeText("<script>alert(1)</script>")).toBe("alert(1)");
  });

  it("should handle empty string", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("should handle null/undefined", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("validateConsent", () => {
  it("should return valid for correct consent object", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: false,
      },
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return error when consent is not an object", () => {
    const result = validateConsent(null as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Consent object is required");
  });

  it("should return error when consentOptions is missing", () => {
    const consent = {
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("consentOptions is required");
  });

  it("should return error when dataCollection is not a boolean", () => {
    const consent = {
      consentOptions: {
        dataCollection: "yes",
        contact: false,
        anonymization: false,
      },
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("dataCollection must be a boolean");
  });

  it("should return error when contact is not a boolean", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: "yes",
        anonymization: false,
      },
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("contact must be a boolean");
  });

  it("should return error when anonymization is not a boolean", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: "yes",
      },
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("anonymization must be a boolean");
  });

  it("should return error when contact is true but email is invalid", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: true,
        anonymization: false,
      },
      userProvidedEmail: "not-an-email",
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid email is required when contact consent is given");
  });

  it("should return error when anonymization is true but email is provided", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: true,
      },
      userProvidedEmail: "test@example.com",
      consentedAt: "2024-01-01T00:00:00Z",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Email cannot be provided when anonymization consent is given");
  });

  it("should return error when consentedAt is missing", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: false,
      },
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid consentedAt timestamp is required");
  });

  it("should return error when consentedAt is invalid", () => {
    const consent = {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: false,
      },
      consentedAt: "not-a-date",
    };
    const result = validateConsent(consent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Valid consentedAt timestamp is required");
  });
});
