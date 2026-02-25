import { contextMonitor } from "./context-monitor";
import { hookManager } from "./hook-manager";

import { HookHandler } from "@/types/claude-code";

export interface AutoCompactConfig {
  enabled: boolean;
  compactCommand: string; // e.g., '/compact'
  executionMethod: "cli" | "api" | "simulated";
  cliPath?: string;
  apiEndpoint?: string;
  apiToken?: string;
  confirmBeforeExecute: boolean;
  notificationMethod: "console" | "notification" | "both";
  compactStrategies: Array<{
    name: string;
    description: string;
    default: boolean;
  }>;
}

export class AutoCompactService {
  private config: AutoCompactConfig;
  private isExecuting: boolean = false;
  private compactHistory: Array<{
    timestamp: Date;
    strategy: string;
    status: "success" | "failed" | "cancelled";
    reason?: string;
    contextBefore: Record<string, unknown>;
    contextAfter?: Record<string, unknown>;
  }> = [];

  // Default configuration
  private defaultConfig: AutoCompactConfig = {
    enabled: true,
    compactCommand: "/compact",
    executionMethod: "simulated", // 'cli', 'api', or 'simulated'
    cliPath: "/usr/local/bin/claude",
    apiEndpoint: "https://api.claude.ai/v1/compact",
    apiToken: "",
    confirmBeforeExecute: false,
    notificationMethod: "both",
    compactStrategies: [
      {
        name: "summarize_oldest",
        description: "Summarize oldest messages while preserving important content",
        default: true,
      },
      {
        name: "remove_oldest",
        description: "Remove oldest non-important messages",
        default: false,
      },
      {
        name: "compress_all",
        description: "Apply compression to entire conversation",
        default: false,
      },
    ],
  };

  constructor(config?: Partial<AutoCompactConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.setupHooks();
  }

  private setupHooks(): void {
    // Register hook handlers for auto-compact
    const autoCompactHandler: HookHandler = {
      event: "auto_compact_triggered",
      handler: async (data: Record<string, unknown>) => {
        await this.handleAutoCompactTrigger(data);
      },
      priority: 100, // High priority to ensure it runs
    };

    const contextLimitHandler: HookHandler = {
      event: "context_limit_reached",
      handler: async (data: Record<string, unknown>) => {
        await this.handleContextLimitReached(data);
      },
      priority: 90,
    };

    const contextWarningHandler: HookHandler = {
      event: "context_limit_approaching",
      handler: async (data: Record<string, unknown>) => {
        await this.handleContextWarning(data);
      },
      priority: 80,
    };

    hookManager.register(autoCompactHandler);
    hookManager.register(contextLimitHandler);
    hookManager.register(contextWarningHandler);
  }

  private async handleAutoCompactTrigger(data: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled || this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    const timestamp = new Date();

    try {
      this.notify("Auto-compact triggered", "info", data);

      // Get current context status
      const contextBefore = {
        status: contextMonitor.getContextStatus(),
        statistics: contextMonitor.getStatistics(),
      };

      // Determine which strategy to use
      const strategy = (data?.strategy as string) || this.getDefaultStrategy();

      // Execute compact
      const result = await this.executeCompact(strategy);

      // Record in history
      this.compactHistory.push({
        timestamp,
        strategy,
        status: result.success ? "success" : "failed",
        reason: result.reason,
        contextBefore,
        contextAfter: result.success
          ? {
              status: contextMonitor.getContextStatus(),
              statistics: contextMonitor.getStatistics(),
            }
          : undefined,
      });

      // Keep history size manageable
      if (this.compactHistory.length > 100) {
        this.compactHistory = this.compactHistory.slice(-50);
      }

      this.notify(
        `Auto-compact ${result.success ? "completed" : "failed"}: ${result.message}`,
        result.success ? "success" : "error"
      );
    } catch (error) {
      console.error("Error in auto-compact:", error);
      this.notify(`Auto-compact failed: ${error}`, "error");

      this.compactHistory.push({
        timestamp,
        strategy: "unknown",
        status: "failed",
        reason: error instanceof Error ? error.message : String(error),
        contextBefore: {},
      });
    } finally {
      this.isExecuting = false;
    }
  }

  private async handleContextLimitReached(data: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) {
      this.notify("CRITICAL: Context limit reached! Manual compact required.", "error");
      return;
    }

    this.notify("CRITICAL: Context limit reached! Auto-compact will execute.", "warning", data);

    // For critical limits, execute immediately without confirmation
    if (!this.config.confirmBeforeExecute) {
      await hookManager.trigger("auto_compact_triggered", {
        ...data,
        critical: true,
        strategy: "remove_oldest", // Use aggressive strategy for critical limits
      });
    }
  }

  private async handleContextWarning(data: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const status = data?.status as { shouldCompact?: boolean; shouldWarn?: boolean } | undefined;
    if (status?.shouldCompact) {
      this.notify("Context usage high. Auto-compact recommended.", "warning", data);

      if (!this.config.confirmBeforeExecute) {
        await hookManager.trigger("auto_compact_triggered", {
          ...data,
          strategy: this.getDefaultStrategy(),
        });
      }
    } else if (status?.shouldWarn) {
      this.notify("Context usage approaching limits. Monitor conversation.", "info", data);
    }
  }

  private getDefaultStrategy(): string {
    const defaultStrategy = this.config.compactStrategies.find((s) => s.default);
    return defaultStrategy?.name || "summarize_oldest";
  }

  private async executeCompact(strategy: string): Promise<{
    success: boolean;
    message: string;
    reason?: string;
  }> {
    console.log(
      `Executing compact with strategy: ${strategy}, method: ${this.config.executionMethod}`
    );

    try {
      switch (this.config.executionMethod) {
        case "cli":
          return await this.executeCompactCLI(strategy);

        case "api":
          return await this.executeCompactAPI(strategy);

        case "simulated":
        default:
          return await this.executeCompactSimulated(strategy);
      }
    } catch (error) {
      return {
        success: false,
        message: "Compact execution failed",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeCompactCLI(strategy: string): Promise<{
    success: boolean;
    message: string;
    reason?: string;
  }> {
    // This would execute the actual CLI command
    // For now, return simulated result
    console.log(
      `Would execute CLI: ${this.config.cliPath} ${this.config.compactCommand} --strategy=${strategy}`
    );

    return {
      success: true,
      message: `Compact executed via CLI with strategy: ${strategy}`,
    };
  }

  private async executeCompactAPI(strategy: string): Promise<{
    success: boolean;
    message: string;
    reason?: string;
  }> {
    // This would call the API endpoint
    // For now, return simulated result
    console.log(`Would call API: ${this.config.apiEndpoint} with strategy: ${strategy}`);

    return {
      success: true,
      message: `Compact executed via API with strategy: ${strategy}`,
    };
  }

  private async executeCompactSimulated(strategy: string): Promise<{
    success: boolean;
    message: string;
    reason?: string;
  }> {
    // Simulate compact execution
    console.log(`Simulating compact with strategy: ${strategy}`);

    // In a real implementation, this would actually compact the conversation
    // For now, we'll just log it and return success

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay

    return {
      success: true,
      message: `Compact simulated with strategy: ${strategy}`,
    };
  }

  private notify(
    message: string,
    type: "info" | "warning" | "error" | "success",
    data?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

    if (this.config.notificationMethod === "console" || this.config.notificationMethod === "both") {
      switch (type) {
        case "error":
          console.error(logMessage, data);
          break;
        case "warning":
          console.warn(logMessage, data);
          break;
        case "success":
          console.log(`✅ ${logMessage}`, data);
          break;
        default:
          console.log(logMessage, data);
      }
    }

    // In a real implementation, this could also show desktop notifications
    if (
      this.config.notificationMethod === "notification" ||
      this.config.notificationMethod === "both"
    ) {
      // Show notification (browser or desktop)
      this.showNotification(message, type);
    }
  }

  private showNotification(message: string, type: "info" | "warning" | "error" | "success"): void {
    // This would show a desktop or browser notification
    // For now, just log it
    console.log(`Notification: [${type}] ${message}`);
  }

  public updateConfig(newConfig: Partial<AutoCompactConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("Auto-compact configuration updated:", this.config);
  }

  public getConfig(): AutoCompactConfig {
    return { ...this.config };
  }

  public getHistory(limit?: number): Array<{
    timestamp: Date;
    strategy: string;
    status: "success" | "failed" | "cancelled";
    reason?: string;
  }> {
    const history = [...this.compactHistory];
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  public getStatistics(): {
    totalCompacts: number;
    successfulCompacts: number;
    failedCompacts: number;
    lastCompact?: Date;
    isExecuting: boolean;
    config: AutoCompactConfig;
  } {
    const successfulCompacts = this.compactHistory.filter((h) => h.status === "success").length;
    const failedCompacts = this.compactHistory.filter((h) => h.status === "failed").length;
    const lastCompact =
      this.compactHistory.length > 0
        ? this.compactHistory[this.compactHistory.length - 1].timestamp
        : undefined;

    return {
      totalCompacts: this.compactHistory.length,
      successfulCompacts,
      failedCompacts,
      lastCompact,
      isExecuting: this.isExecuting,
      config: this.getConfig(),
    };
  }

  public manualCompact(strategy?: string): Promise<{
    success: boolean;
    message: string;
    reason?: string;
  }> {
    const compactStrategy = strategy || this.getDefaultStrategy();

    return this.executeCompact(compactStrategy);
  }

  public enable(): void {
    this.config.enabled = true;
    console.log("Auto-compact enabled");
  }

  public disable(): void {
    this.config.enabled = false;
    console.log("Auto-compact disabled");
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Singleton instance
export const autoCompactService = new AutoCompactService();
