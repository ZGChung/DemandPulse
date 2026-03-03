// ConsentService tests

import { ConsentService } from "../../services/consent-service";

import { UserConsent } from "@/types/claude-code";

describe("ConsentService", () => {
  let service: ConsentService;

  beforeEach(() => {
    service = new ConsentService();
  });

  describe("createConsentPrompt", () => {
    it("should create a consent prompt with requirement ID", () => {
      const prompt = service.createConsentPrompt("req-123", "Test requirement");
      expect(prompt.requirementId).toBe("req-123");
      expect(prompt.summarizedRequirement).toBe("Test requirement");
    });

    it("should set default options", () => {
      const prompt = service.createConsentPrompt("req-123", "Test requirement");
      expect(prompt.options.allowDataCollection).toBe(true);
      expect(prompt.options.allowContact).toBe(false);
      expect(prompt.options.anonymizeData).toBe(true);
    });

    it("should set presentedAt timestamp", () => {
      const before = new Date();
      const prompt = service.createConsentPrompt("req-123", "Test requirement");
      const after = new Date();
      expect(prompt.presentedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(prompt.presentedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("validateConsent", () => {
    it("should return valid for complete consent", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing requirement ID", () => {
      const consent: Partial<UserConsent> = {
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Requirement ID is required");
    });

    it("should reject missing consent timestamp", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Consent timestamp is required");
    });

    it("should reject missing consent options", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Consent options are required");
    });

    it("should reject invalid data collection consent type", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: "yes" as any,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Data collection consent must be a boolean");
    });

    it("should reject invalid contact consent type", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: 1 as any,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Contact consent must be a boolean");
    });

    it("should reject when data collection is not consented", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Data collection consent is required to submit requirement");
    });

    it("should accept contact consent without email (email validation only when provided)", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
      };
      const result = service.validateConsent(consent);
      // Contact consent is allowed without email - email is only validated when provided
      expect(result.valid).toBe(true);
    });

    it("should accept valid email when contact consent is given", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "test@example.com",
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(true);
    });

    it("should reject invalid email format", () => {
      const consent: Partial<UserConsent> = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "not-an-email",
      };
      const result = service.validateConsent(consent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid email format");
    });
  });
});
