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

  describe("createCollectedRequirement", () => {
    it("should create collected requirement with all fields", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const context = {
        conversationId: "conv-123",
        userId: "user-456",
        workspacePath: "/path/to/workspace",
      };
      const result = service.createCollectedRequirement(
        "req-123",
        "Original requirement",
        "Summarized requirement",
        context,
        consent
      );
      expect(result.id).toBe("req-123");
      expect(result.originalRequirement).toBe("Original requirement");
      expect(result.summarizedRequirement).toBe("Summarized requirement");
      expect(result.context.conversationId).toBe("conv-123");
      expect(result.context.userId).toBe("user-456");
      expect(result.context.workspacePath).toBe("/path/to/workspace");
      expect(result.status).toBe("pending");
      expect(result.collectedAt).toBeInstanceOf(Date);
    });

    it("should use default conversationId when not provided", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      const result = service.createCollectedRequirement(
        "req-123",
        "Original",
        "Summarized",
        {},
        consent
      );
      expect(result.context.conversationId).toBe("unknown");
    });
  });

  describe("generateConsentSummary", () => {
    it("should generate summary with all options enabled", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "test@example.com",
      };
      const summary = service.generateConsentSummary(consent);
      expect(summary).toContain("✅ Data collection consented");
      expect(summary).toContain("✅ Contact consented");
      expect(summary).toContain("✅ Data will be anonymized");
      expect(summary).toContain("📧 Contact email: test@example.com");
    });

    it("should generate summary with all options disabled", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: false,
          anonymization: false,
        },
      };
      const summary = service.generateConsentSummary(consent);
      expect(summary).toContain("❌ Data collection not consented");
      expect(summary).toContain("❌ Contact not consented");
      expect(summary).toContain("❌ Data will not be anonymized");
    });
  });

  describe("shouldStoreRequirement", () => {
    it("should return true when data collection is consented", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      expect(service.shouldStoreRequirement(consent)).toBe(true);
    });

    it("should return false when data collection is not consented", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: false,
          anonymization: true,
        },
      };
      expect(service.shouldStoreRequirement(consent)).toBe(false);
    });
  });

  describe("getDataRetentionPeriod", () => {
    it("should return 5 years for anonymized data", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };
      expect(service.getDataRetentionPeriod(consent)).toBe(365 * 5);
    });

    it("should return 2 years for data with contact info", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: false,
        },
      };
      expect(service.getDataRetentionPeriod(consent)).toBe(365 * 2);
    });

    it("should return 1 year for basic consented data", () => {
      const consent: UserConsent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };
      expect(service.getDataRetentionPeriod(consent)).toBe(365);
    });
  });
});
