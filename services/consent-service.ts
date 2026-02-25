import { ConsentPrompt, UserConsent, CollectedRequirement } from "@/types/claude-code";

export class ConsentService {
  createConsentPrompt(requirementId: string, summarizedRequirement: string): ConsentPrompt {
    return {
      requirementId,
      summarizedRequirement,
      options: {
        allowDataCollection: true,
        allowContact: false,
        anonymizeData: true,
      },
      presentedAt: new Date(),
    };
  }

  validateConsent(consent: Partial<UserConsent>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!consent.requirementId) {
      errors.push("Requirement ID is required");
    }

    if (!consent.consentedAt) {
      errors.push("Consent timestamp is required");
    }

    if (!consent.consentOptions) {
      errors.push("Consent options are required");
    } else {
      if (typeof consent.consentOptions.dataCollection !== "boolean") {
        errors.push("Data collection consent must be a boolean");
      }

      if (typeof consent.consentOptions.contact !== "boolean") {
        errors.push("Contact consent must be a boolean");
      }

      if (typeof consent.consentOptions.anonymization !== "boolean") {
        errors.push("Anonymization consent must be a boolean");
      }

      // Validate that at least data collection is consented to
      if (consent.consentOptions.dataCollection === false) {
        errors.push("Data collection consent is required to submit requirement");
      }
    }

    // Validate email if contact consent is given
    if (consent.consentOptions?.contact === true && consent.userProvidedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(consent.userProvidedEmail)) {
        errors.push("Invalid email format");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  createCollectedRequirement(
    requirementId: string,
    originalRequirement: string,
    summarizedRequirement: string,
    context: Record<string, unknown>,
    consent: UserConsent
  ): CollectedRequirement {
    return {
      id: requirementId,
      originalRequirement,
      summarizedRequirement,
      context: {
        conversationId: (context.conversationId as string) || "unknown",
        userId: context.userId as string | undefined,
        workspacePath: context.workspacePath as string | undefined,
        timestamp: new Date(),
      },
      consent,
      collectedAt: new Date(),
      status: "pending",
    };
  }

  generateConsentSummary(consent: UserConsent): string {
    const parts: string[] = [];

    if (consent.consentOptions.dataCollection) {
      parts.push("✅ Data collection consented");
    } else {
      parts.push("❌ Data collection not consented");
    }

    if (consent.consentOptions.contact) {
      parts.push("✅ Contact consented");
    } else {
      parts.push("❌ Contact not consented");
    }

    if (consent.consentOptions.anonymization) {
      parts.push("✅ Data will be anonymized");
    } else {
      parts.push("❌ Data will not be anonymized");
    }

    if (consent.userProvidedEmail) {
      parts.push(`📧 Contact email: ${consent.userProvidedEmail}`);
    }

    return parts.join("\n");
  }

  shouldStoreRequirement(consent: UserConsent): boolean {
    // Only store if data collection is consented
    return consent.consentOptions.dataCollection === true;
  }

  getDataRetentionPeriod(consent: UserConsent): number {
    // Return data retention period in days based on consent options
    if (consent.consentOptions.anonymization) {
      return 365 * 5; // 5 years for anonymized data
    }

    if (consent.consentOptions.contact) {
      return 365 * 2; // 2 years for data with contact info
    }

    return 365; // 1 year for basic consented data
  }
}
