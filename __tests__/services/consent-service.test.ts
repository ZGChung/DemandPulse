import { ConsentService } from "@/services/consent-service";

describe("ConsentService", () => {
  let service: ConsentService;

  beforeEach(() => {
    service = new ConsentService();
  });

  describe("createConsentPrompt", () => {
    it("should create a consent prompt with default options", () => {
      const requirementId = "req-123";
      const summarizedRequirement = "Build a login system";

      const prompt = service.createConsentPrompt(requirementId, summarizedRequirement);

      expect(prompt.requirementId).toBe(requirementId);
      expect(prompt.summarizedRequirement).toBe(summarizedRequirement);
      expect(prompt.options.allowDataCollection).toBe(true);
      expect(prompt.options.allowContact).toBe(false);
      expect(prompt.options.anonymizeData).toBe(true);
      expect(prompt.presentedAt).toBeInstanceOf(Date);
    });
  });

  describe("validateConsent", () => {
    it("should validate complete and valid consent", () => {
      const consent = {
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

    it("should reject consent without requirement ID", () => {
      const consent = {
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

    it("should reject consent without timestamp", () => {
      const consent = {
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

    it("should reject consent without data collection consent", () => {
      const consent = {
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

    it("should validate email when contact consent is given", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "invalid-email",
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid email format");
    });

    it("should accept valid email when contact consent is given", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "user@example.com",
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("createCollectedRequirement", () => {
    it("should create a collected requirement from consent", () => {
      const requirementId = "req-123";
      const originalRequirement = "I need to build a comprehensive login system with 2FA";
      const summarizedRequirement = "Build a login system with 2FA";
      const context = {
        conversationId: "conv-456",
        userId: "user-789",
        workspacePath: "/projects/auth",
      };
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };

      const collected = service.createCollectedRequirement(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        context,
        consent
      );

      expect(collected.id).toBe(requirementId);
      expect(collected.originalRequirement).toBe(originalRequirement);
      expect(collected.summarizedRequirement).toBe(summarizedRequirement);
      expect(collected.context.conversationId).toBe("conv-456");
      expect(collected.context.userId).toBe("user-789");
      expect(collected.context.workspacePath).toBe("/projects/auth");
      expect(collected.consent).toBe(consent);
      expect(collected.status).toBe("pending");
      expect(collected.collectedAt).toBeInstanceOf(Date);
    });
  });

  describe("generateConsentSummary", () => {
    it("should generate consent summary with all options", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        userProvidedEmail: "user@example.com",
      };

      const summary = service.generateConsentSummary(consent);

      expect(summary).toContain("✅ Data collection consented");
      expect(summary).toContain("✅ Contact consented");
      expect(summary).toContain("✅ Data will be anonymized");
      expect(summary).toContain("📧 Contact email: user@example.com");
    });

    it("should generate consent summary with denied options", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };

      const summary = service.generateConsentSummary(consent);

      expect(summary).toContain("✅ Data collection consented");
      expect(summary).toContain("❌ Contact not consented");
      expect(summary).toContain("❌ Data will not be anonymized");
      expect(summary).not.toContain("📧 Contact email:");
    });
  });

  describe("shouldStoreRequirement", () => {
    it("should return true when data collection is consented", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };

      expect(service.shouldStoreRequirement(consent)).toBe(true);
    });

    it("should return false when data collection is not consented", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: false,
          contact: true,
          anonymization: true,
        },
      };

      expect(service.shouldStoreRequirement(consent)).toBe(false);
    });
  });

  describe("getDataRetentionPeriod", () => {
    it("should return 5 years for anonymized data", () => {
      const consent = {
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
      const consent = {
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
      const consent = {
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

  describe("edge cases and branch coverage", () => {
    it("should handle missing consentOptions in validation", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Consent options are required");
    });

    it("should validate dataCollection consent type", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: "true" as any,
          contact: false,
          anonymization: true,
        },
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Data collection consent must be a boolean");
    });

    it("should validate contact consent type", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: "yes" as any,
          anonymization: true,
        },
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Contact consent must be a boolean");
    });

    it("should validate anonymization consent type", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: 1 as any,
        },
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Anonymization consent must be a boolean");
    });

    it("should validate email format when contact is true but email is missing", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: true,
          anonymization: true,
        },
        // No userProvidedEmail provided
      };

      const result = service.validateConsent(consent);

      // This should still be valid (email is optional even if contact is true)
      expect(result.valid).toBe(true);
    });

    it("should handle createCollectedRequirement with missing context values", () => {
      const requirementId = "req-123";
      const originalRequirement = "Build login system";
      const summarizedRequirement = "Build login";
      const context = {}; // Empty context
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: true,
        },
      };

      const collected = service.createCollectedRequirement(
        requirementId,
        originalRequirement,
        summarizedRequirement,
        context,
        consent
      );

      expect(collected.context.conversationId).toBe("unknown");
      expect(collected.context.userId).toBeUndefined();
      expect(collected.context.workspacePath).toBeUndefined();
      expect(collected.context.timestamp).toBeInstanceOf(Date);
    });

    it("should handle createCollectedRequirement with partial context", () => {
      const context = {
        conversationId: "conv-123",
        // Missing userId and workspacePath
      };

      const collected = service.createCollectedRequirement(
        "req-1",
        "original",
        "summarized",
        context,
        {
          requirementId: "req-1",
          consentedAt: new Date(),
          consentOptions: {
            dataCollection: true,
            contact: false,
            anonymization: true,
          },
        }
      );

      expect(collected.context.conversationId).toBe("conv-123");
      expect(collected.context.userId).toBeUndefined();
    });

    it("should generate summary with only data collection consented", () => {
      const consent = {
        requirementId: "req-123",
        consentedAt: new Date(),
        consentOptions: {
          dataCollection: true,
          contact: false,
          anonymization: false,
        },
      };

      const summary = service.generateConsentSummary(consent);

      expect(summary).toContain("✅ Data collection consented");
      expect(summary).toContain("❌ Contact not consented");
      expect(summary).toContain("❌ Data will not be anonymized");
      expect(summary).not.toContain("📧");
    });

    it("should handle validateConsent with all errors", () => {
      const consent = {
        // Missing requirementId
        // Missing consentedAt
        consentOptions: {
          // Missing dataCollection
          contact: "invalid" as any,
          anonymization: 123 as any,
        },
      };

      const result = service.validateConsent(consent);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
