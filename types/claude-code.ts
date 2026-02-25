// Types for Claude Code hook system integration

export interface ClaudeCodeContext {
  conversationId: string;
  userId?: string;
  workspacePath?: string;
  timestamp: Date;
}

export interface RequirementDetection {
  id: string;
  context: ClaudeCodeContext;
  requirementText: string;
  detectedAt: Date;
  confidence: number;
  metadata: {
    conversationLength: number;
    keywords: string[];
    intent: "feature_request" | "bug_fix" | "improvement" | "new_tool" | "other";
  };
}

export interface ConsentPrompt {
  requirementId: string;
  summarizedRequirement: string;
  options: {
    allowDataCollection: boolean;
    allowContact: boolean;
    anonymizeData: boolean;
  };
  presentedAt: Date;
}

export interface UserConsent {
  requirementId: string;
  consentedAt: Date;
  consentOptions: {
    dataCollection: boolean;
    contact: boolean;
    anonymization: boolean;
  };
  userProvidedEmail?: string;
}

export interface CollectedRequirement {
  id: string;
  originalRequirement: string;
  summarizedRequirement: string;
  context: ClaudeCodeContext;
  consent: UserConsent;
  collectedAt: Date;
  status: "pending" | "processed" | "rejected";
}

// Hook event types
export type HookEvent =
  | "conversation_start"
  | "message_sent"
  | "message_received"
  | "conversation_end"
  | "code_generated"
  | "requirement_detected"
  | "context_limit_approaching"
  | "context_limit_reached"
  | "auto_compact_triggered"
  | "compact_command_executed";

export interface HookHandler {
  event: HookEvent;
  handler: (data: Record<string, unknown>) => Promise<void> | void;
  priority?: number;
}

// Configuration for Claude Code plugin
export interface ClaudeCodePluginConfig {
  enabled: boolean;
  detectionThreshold: number;
  consentRequired: boolean;
  dataRetentionDays: number;
  endpoints: {
    requirementDetection: string;
    consentPrompt: string;
    requirementSubmission: string;
  };
}
