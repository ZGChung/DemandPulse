import {
  RequirementDetection,
  ConsentPrompt,
  UserConsent,
  CollectedRequirement,
} from "@/types/claude-code";

import { ConsentService } from "./consent-service";
import { RequirementDetectionService } from "./requirement-detection";

export class DataCollectionFlow {
  private requirementDetection: RequirementDetectionService;
  private consentService: ConsentService;

  constructor() {
    this.requirementDetection = new RequirementDetectionService();
    this.consentService = new ConsentService();
  }

  async processConversationMessage(
    text: string,
    context: any
  ): Promise<{
    detected: RequirementDetection | null;
    prompt: ConsentPrompt | null;
    shouldPrompt: boolean;
  }> {
    // Step 1: Detect requirement in the message
    const detected = this.requirementDetection.detectRequirement(text, context);

    if (!detected) {
      return { detected: null, prompt: null, shouldPrompt: false };
    }

    // Step 2: Check if we should prompt for consent
    // For now, we always prompt if requirement is detected with sufficient confidence
    const shouldPrompt = detected.confidence >= 0.5;

    if (!shouldPrompt) {
      return { detected, prompt: null, shouldPrompt: false };
    }

    // Step 3: Create consent prompt
    const summarized = this.requirementDetection.summarizeRequirement(text);
    const prompt = this.consentService.createConsentPrompt(detected.id, summarized);

    return { detected, prompt, shouldPrompt: true };
  }

  async handleUserConsent(
    requirementId: string,
    originalRequirement: string,
    summarizedRequirement: string,
    context: any,
    userConsent: Partial<UserConsent>
  ): Promise<{
    success: boolean;
    collectedRequirement: CollectedRequirement | null;
    errors: string[];
  }> {
    // Step 1: Validate consent
    const validation = this.consentService.validateConsent(userConsent);

    if (!validation.valid) {
      return {
        success: false,
        collectedRequirement: null,
        errors: validation.errors,
      };
    }

    // Step 2: Create complete consent object
    const completeConsent: UserConsent = {
      requirementId,
      consentedAt: userConsent.consentedAt || new Date(),
      consentOptions: {
        dataCollection: userConsent.consentOptions?.dataCollection ?? false,
        contact: userConsent.consentOptions?.contact ?? false,
        anonymization: userConsent.consentOptions?.anonymization ?? true,
      },
      userProvidedEmail: userConsent.userProvidedEmail,
    };

    // Step 3: Check if we should store the requirement
    if (!this.consentService.shouldStoreRequirement(completeConsent)) {
      return {
        success: false,
        collectedRequirement: null,
        errors: ["Data collection consent is required to store requirement"],
      };
    }

    // Step 4: Create collected requirement
    const collectedRequirement = this.consentService.createCollectedRequirement(
      requirementId,
      originalRequirement,
      summarizedRequirement,
      context,
      completeConsent
    );

    // Step 5: Generate consent summary for logging
    const consentSummary = this.consentService.generateConsentSummary(completeConsent);
    console.log("Consent recorded:", consentSummary);

    return {
      success: true,
      collectedRequirement,
      errors: [],
    };
  }

  async simulateClaudeCodeIntegration(
    conversation: Array<{ role: "user" | "assistant"; content: string }>,
    context: any
  ): Promise<
    Array<{
      message: string;
      detection: RequirementDetection | null;
      prompt: ConsentPrompt | null;
    }>
  > {
    const results: Array<{
      message: string;
      detection: RequirementDetection | null;
      prompt: ConsentPrompt | null;
    }> = [];

    for (const message of conversation) {
      if (message.role === "user") {
        const result = await this.processConversationMessage(message.content, context);

        results.push({
          message: message.content,
          detection: result.detected,
          prompt: result.prompt,
        });
      }
    }

    return results;
  }

  getFlowStatistics(): {
    totalMessagesProcessed: number;
    requirementsDetected: number;
    consentPromptsGenerated: number;
    requirementsCollected: number;
  } {
    // This would track statistics in a real implementation
    // For now, return placeholder statistics
    return {
      totalMessagesProcessed: 0,
      requirementsDetected: 0,
      consentPromptsGenerated: 0,
      requirementsCollected: 0,
    };
  }

  resetFlow(): void {
    // Reset any internal state if needed
    // In a real implementation, this might clear temporary storage
  }
}
