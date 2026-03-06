import { hookManager } from "./hook-manager";

import type { HookHandler } from "@/types/claude-code";

export interface ContextMonitorConfig {
  // Context window size in tokens
  contextWindowSize: number;

  // Thresholds (0.0 to 1.0)
  warningThreshold: number;
  compactThreshold: number;
  criticalThreshold: number;

  // Monitoring settings
  checkInterval: number; // milliseconds
  maxConversationLength: number; // maximum messages to track

  // Auto-compact settings
  autoCompactEnabled: boolean;
  compactStrategy: "summarize_oldest" | "remove_oldest" | "compress_all";
  preserveImportantMessages: boolean;
  maxPreservedMessages: number;

  // Estimation settings
  tokensPerChar: number; // approximate tokens per character
  tokensPerMessage: number; // approximate tokens per message exchange
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  estimatedTokens: number;
  important: boolean; // Whether this message should be preserved during compact
  metadata?: {
    containsRequirements?: boolean;
    containsCode?: boolean;
    containsInstructions?: boolean;
  };
}

export interface ContextStatus {
  currentTokens: number;
  estimatedTokens: number;
  messageCount: number;
  usagePercentage: number;
  status: "ok" | "warning" | "critical" | "limit_reached";
  shouldCompact: boolean;
  shouldWarn: boolean;
  recommendations: string[];
}

export class ContextMonitorService {
  private config: ContextMonitorConfig;
  private conversation: ConversationMessage[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  // Default configuration
  private defaultConfig: ContextMonitorConfig = {
    contextWindowSize: 128000, // Claude 3.5 Sonnet
    warningThreshold: 0.75, // 75%
    compactThreshold: 0.85, // 85%
    criticalThreshold: 0.95, // 95%
    checkInterval: 30000, // 30 seconds
    maxConversationLength: 1000,
    autoCompactEnabled: true,
    compactStrategy: "summarize_oldest",
    preserveImportantMessages: true,
    maxPreservedMessages: 10,
    tokensPerChar: 0.25, // 4 chars ≈ 1 token
    tokensPerMessage: 1000, // approximate tokens per message exchange
  };

  constructor(config?: Partial<ContextMonitorConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.setupHooks();
  }

  private setupHooks(): void {
    // Register hook handlers for context monitoring
    const messageHandler: HookHandler = {
      event: "message_received",
      handler: async (data: Record<string, unknown>) => {
        await this.handleNewMessage(data);
      },
      priority: 10,
    };

    const conversationStartHandler: HookHandler = {
      event: "conversation_start",
      handler: async () => {
        this.startMonitoring();
      },
      priority: 10,
    };

    const conversationEndHandler: HookHandler = {
      event: "conversation_end",
      handler: async () => {
        this.stopMonitoring();
      },
      priority: 10,
    };

    hookManager.register(messageHandler);
    hookManager.register(conversationStartHandler);
    hookManager.register(conversationEndHandler);
  }

  private async handleNewMessage(data: Record<string, unknown>): Promise<void> {
    if (!data || !data.content) return;

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: (data.role as "user" | "assistant" | "system") || "user",
      content: data.content as string,
      timestamp: new Date(),
      estimatedTokens: this.estimateTokens(data.content as string),
      important: this.isImportantMessage(data.content as string),
      metadata: this.extractMessageMetadata(data.content as string),
    };

    this.conversation.push(message);

    // Keep conversation within limits
    if (this.conversation.length > this.config.maxConversationLength) {
      this.conversation = this.conversation.slice(-this.config.maxConversationLength);
    }

    // Check context status
    await this.checkContextStatus();
  }

  private estimateTokens(text: string): number {
    // Simple token estimation
    const chars = text.length;
    return Math.ceil(chars * this.config.tokensPerChar);
  }

  private isImportantMessage(text: string): boolean {
    // Check if message contains important content that should be preserved
    const importantPatterns = [
      /\b(requirement|spec|specification|instruction|todo|task|goal|objective)\b/i,
      /\b(build|create|make|develop|implement|fix|solve)\b.*\b(please|can you|could you)\b/i,
      /\b(I need|I want|I wish|I would like)\b/i,
      /\b(important|critical|essential|must|should)\b/i,
    ];

    return importantPatterns.some((pattern) => pattern.test(text));
  }

  private extractMessageMetadata(text: string): ConversationMessage["metadata"] {
    return {
      containsRequirements: /\b(requirement|need|want|wish|should have|would be great)\b/i.test(
        text
      ),
      containsCode:
        /```[\s\S]*?```|function\s+\w+|class\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+/.test(text),
      containsInstructions:
        /\b(do|make|create|build|implement|fix|add|remove|change)\b.*\b(please|can you|could you)\b/i.test(
          text
        ),
    };
  }

  public getContextStatus(): ContextStatus {
    const currentTokens = this.conversation.reduce((sum, msg) => sum + msg.estimatedTokens, 0);
    const messageCount = this.conversation.length;
    const estimatedTokens = currentTokens;
    const usagePercentage = estimatedTokens / this.config.contextWindowSize;

    let status: ContextStatus["status"] = "ok";
    let shouldCompact = false;
    let shouldWarn = false;
    const recommendations: string[] = [];

    if (usagePercentage >= this.config.criticalThreshold) {
      status = "limit_reached";
      shouldCompact = true;
      shouldWarn = true;
      recommendations.push("CRITICAL: Context limit reached! Run /compact immediately.");
    } else if (usagePercentage >= this.config.compactThreshold) {
      status = "critical";
      shouldCompact = this.config.autoCompactEnabled;
      shouldWarn = true;
      recommendations.push("Context usage high. Consider running /compact soon.");
    } else if (usagePercentage >= this.config.warningThreshold) {
      status = "warning";
      shouldWarn = true;
      recommendations.push("Context usage approaching limits. Monitor conversation length.");
    }

    // Additional recommendations based on conversation characteristics
    if (messageCount > 50) {
      recommendations.push("Long conversation detected. Consider summarizing or compacting.");
    }

    const importantMessages = this.conversation.filter((msg) => msg.important).length;
    if (importantMessages > this.config.maxPreservedMessages) {
      recommendations.push(
        `Many important messages (${importantMessages}). Consider manual review before compacting.`
      );
    }

    return {
      currentTokens,
      estimatedTokens,
      messageCount,
      usagePercentage,
      status,
      shouldCompact,
      shouldWarn,
      recommendations,
    };
  }

  private async checkContextStatus(): Promise<void> {
    const status = this.getContextStatus();

    // Trigger appropriate hooks based on status
    if (status.status === "limit_reached") {
      await hookManager.trigger("context_limit_reached", {
        status,
        conversationSnapshot: this.getConversationSnapshot(),
      });

      if (this.config.autoCompactEnabled) {
        await this.triggerAutoCompact();
      }
    } else if (status.status === "critical") {
      await hookManager.trigger("context_limit_approaching", {
        status,
        conversationSnapshot: this.getConversationSnapshot(),
      });

      if (this.config.autoCompactEnabled && status.shouldCompact) {
        await this.triggerAutoCompact();
      }
    } else if (status.status === "warning") {
      await hookManager.trigger("context_limit_approaching", {
        status,
        conversationSnapshot: this.getConversationSnapshot(),
      });
    }
  }

  private async triggerAutoCompact(): Promise<void> {
    console.log("Auto-compact triggered based on context limits");

    await hookManager.trigger("auto_compact_triggered", {
      timestamp: new Date(),
      strategy: this.config.compactStrategy,
      conversationBefore: this.getConversationSnapshot(),
    });

    // In a real implementation, this would execute the /compact command
    // For now, we just trigger the event and log it
    console.log(`Would execute compact with strategy: ${this.config.compactStrategy}`);

    // Simulate compact execution
    await this.executeCompact();
  }

  private async executeCompact(): Promise<void> {
    // This is where the actual /compact command would be executed
    // Since we can't directly execute CLI commands from here,
    // we would need to integrate with Claude Code's API

    console.log("Executing compact...");

    // For demonstration, we'll simulate compact by removing old non-important messages
    if (this.config.compactStrategy === "remove_oldest") {
      this.removeOldestMessages();
    } else if (this.config.compactStrategy === "summarize_oldest") {
      this.summarizeOldestMessages();
    }

    await hookManager.trigger("compact_command_executed", {
      timestamp: new Date(),
      strategy: this.config.compactStrategy,
      conversationAfter: this.getConversationSnapshot(),
    });
  }

  private removeOldestMessages(): void {
    if (this.config.preserveImportantMessages) {
      // Keep important messages, remove oldest non-important ones
      const importantMessages = this.conversation.filter((msg) => msg.important);
      const nonImportantMessages = this.conversation.filter((msg) => !msg.important);

      // Keep only recent non-important messages
      const recentNonImportant = nonImportantMessages.slice(-this.config.maxPreservedMessages);
      this.conversation = [...importantMessages, ...recentNonImportant];
    } else {
      // Keep only recent messages
      this.conversation = this.conversation.slice(-this.config.maxPreservedMessages);
    }
  }

  private summarizeOldestMessages(): void {
    // In a real implementation, this would use AI to summarize old messages
    // For now, we'll just mark them as summarized
    console.log("Summarizing oldest messages (simulated)");

    // Keep all messages but mark old ones as summarized
    const cutoffIndex = Math.max(0, this.conversation.length - this.config.maxPreservedMessages);
    for (let i = 0; i < cutoffIndex; i++) {
      this.conversation[i].content =
        `[Summarized: ${this.conversation[i].content.substring(0, 100)}...]`;
      this.conversation[i].estimatedTokens = 50; // Reduced token count for summary
    }
  }

  private getConversationSnapshot(): Array<{ role: string; content: string; timestamp: Date }> {
    return this.conversation.map((msg) => ({
      role: msg.role,
      content: msg.content.substring(0, 200) + (msg.content.length > 200 ? "..." : ""),
      timestamp: msg.timestamp,
    }));
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkContextStatus().catch(() => {});
    }, this.config.checkInterval);
    if (
      this.monitoringInterval &&
      typeof this.monitoringInterval === "object" &&
      "unref" in this.monitoringInterval
    ) {
      (this.monitoringInterval as NodeJS.Timeout).unref();
    }

    console.log("Context monitoring started");
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    console.log("Context monitoring stopped");
  }

  public updateConfig(newConfig: Partial<ContextMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("Context monitor configuration updated:", this.config);
  }

  public getConfig(): ContextMonitorConfig {
    return { ...this.config };
  }

  public getConversation(): ConversationMessage[] {
    return [...this.conversation];
  }

  public clearConversation(): void {
    this.conversation = [];
    console.log("Conversation cleared");
  }

  public getStatistics(): {
    totalMessages: number;
    totalTokens: number;
    importantMessages: number;
    monitoringActive: boolean;
    config: ContextMonitorConfig;
  } {
    const importantMessages = this.conversation.filter((msg) => msg.important).length;
    const totalTokens = this.conversation.reduce((sum, msg) => sum + msg.estimatedTokens, 0);

    return {
      totalMessages: this.conversation.length,
      totalTokens,
      importantMessages,
      monitoringActive: this.isMonitoring,
      config: this.getConfig(),
    };
  }
}

// Singleton instance
export const contextMonitor = new ContextMonitorService();
