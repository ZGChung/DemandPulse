import { autoCompactService } from "./auto-compact-service";
import { contextMonitor } from "./context-monitor";
import { hookManager } from "./hook-manager";

import { HookEvent, HookHandler } from "@/types/claude-code";

export interface ClaudeCodeIntegrationConfig {
  // Feature toggles
  enableContextMonitoring: boolean;
  enableAutoCompact: boolean;
  enableRequirementDetection: boolean;

  // Integration settings
  autoStart: boolean;
  verboseLogging: boolean;
  persistenceEnabled: boolean;

  // Performance settings
  monitoringInterval: number;
  maxConversationSize: number;
  compactThreshold: number;
}

export class ClaudeCodeIntegrationService {
  private config: ClaudeCodeIntegrationConfig;
  private isInitialized: boolean = false;
  private isActive: boolean = false;

  // Default configuration
  private defaultConfig: ClaudeCodeIntegrationConfig = {
    enableContextMonitoring: true,
    enableAutoCompact: true,
    enableRequirementDetection: true,
    autoStart: true,
    verboseLogging: false,
    persistenceEnabled: true,
    monitoringInterval: 30000,
    maxConversationSize: 1000,
    compactThreshold: 0.85,
  };

  constructor(config?: Partial<ClaudeCodeIntegrationConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Claude Code integration already initialized");
      return;
    }

    console.log("Initializing Claude Code integration...");

    try {
      // Initialize services
      this.initializeServices();

      // Setup hooks
      this.setupIntegrationHooks();

      // Apply configuration
      this.applyConfiguration();

      this.isInitialized = true;
      console.log("Claude Code integration initialized successfully");

      // Auto-start if configured
      if (this.config.autoStart) {
        await this.start();
      }
    } catch (error) {
      console.error("Failed to initialize Claude Code integration:", error);
      throw error;
    }
  }

  private initializeServices(): void {
    // Services are already singletons, just ensure they're ready
    console.log("Initializing integration services...");

    // Update context monitor config based on integration config
    if (this.config.enableContextMonitoring) {
      contextMonitor.updateConfig({
        checkInterval: this.config.monitoringInterval,
        maxConversationLength: this.config.maxConversationSize,
        compactThreshold: this.config.compactThreshold,
        autoCompactEnabled: this.config.enableAutoCompact,
      });
    }

    // Update auto-compact service config
    if (this.config.enableAutoCompact) {
      autoCompactService.updateConfig({
        enabled: this.config.enableAutoCompact,
      });
    }
  }

  private setupIntegrationHooks(): void {
    console.log("Setting up integration hooks...");

    // Hook for conversation lifecycle
    const conversationLifecycleHandler: HookHandler = {
      event: "conversation_start",
      handler: async () => {
        if (this.config.enableContextMonitoring) {
          contextMonitor.startMonitoring();
        }
        this.log("Conversation started");
      },
      priority: 5,
    };

    const conversationEndHandler: HookHandler = {
      event: "conversation_end",
      handler: async () => {
        if (this.config.enableContextMonitoring) {
          contextMonitor.stopMonitoring();
        }
        this.log("Conversation ended");

        // Generate conversation summary
        await this.generateConversationSummary();
      },
      priority: 5,
    };

    // Hook for monitoring status changes
    const contextStatusHandler: HookHandler = {
      event: "context_limit_approaching",
      handler: async (data) => {
        this.log("Context limit approaching:", data);

        // Could trigger notifications or UI updates here
        if (this.config.enableAutoCompact) {
          this.log("Auto-compact will handle context warning");
        }
      },
      priority: 20,
    };

    // Hook for compact execution
    const compactExecutedHandler: HookHandler = {
      event: "compact_command_executed",
      handler: async (data) => {
        this.log("Compact command executed:", data);

        // Record compact event
        await this.recordCompactEvent(data);
      },
      priority: 30,
    };

    // Register hooks
    hookManager.register(conversationLifecycleHandler);
    hookManager.register(conversationEndHandler);
    hookManager.register(contextStatusHandler);
    hookManager.register(compactExecutedHandler);
  }

  private applyConfiguration(): void {
    console.log("Applying integration configuration...");

    // Enable/disable features based on config
    if (!this.config.enableContextMonitoring) {
      contextMonitor.stopMonitoring();
    }

    if (!this.config.enableAutoCompact) {
      autoCompactService.disable();
    }

    // Set logging level
    // (Implementation would depend on logging system)
  }

  public async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isActive) {
      console.log("Claude Code integration already active");
      return;
    }

    console.log("Starting Claude Code integration...");

    // Start context monitoring if enabled
    if (this.config.enableContextMonitoring) {
      contextMonitor.startMonitoring();
    }

    // Enable auto-compact if configured
    if (this.config.enableAutoCompact) {
      autoCompactService.enable();
    }

    this.isActive = true;
    console.log("Claude Code integration started");

    // Trigger conversation start if we're in a conversation
    await hookManager.trigger("conversation_start", {
      integrationStarted: true,
      timestamp: new Date(),
    });
  }

  public async stop(): Promise<void> {
    if (!this.isActive) {
      console.log("Claude Code integration already stopped");
      return;
    }

    console.log("Stopping Claude Code integration...");

    // Stop context monitoring
    contextMonitor.stopMonitoring();

    // Disable auto-compact
    autoCompactService.disable();

    // Trigger conversation end
    await hookManager.trigger("conversation_end", {
      integrationStopped: true,
      timestamp: new Date(),
    });

    this.isActive = false;
    console.log("Claude Code integration stopped");
  }

  private async generateConversationSummary(): Promise<void> {
    if (!this.config.persistenceEnabled) {
      return;
    }

    try {
      const statistics = contextMonitor.getStatistics();
      const compactStats = autoCompactService.getStatistics();
      const hookStats = hookManager.getStatistics();

      const summary = {
        timestamp: new Date(),
        conversationDuration: "unknown", // Would calculate from timestamps
        totalMessages: statistics.totalMessages,
        totalTokens: statistics.totalTokens,
        compactsPerformed: compactStats.totalCompacts,
        successfulCompacts: compactStats.successfulCompacts,
        hookEvents: hookStats.totalEvents,
        contextStatus: contextMonitor.getContextStatus(),
      };

      this.log("Conversation summary:", summary);

      // In a real implementation, this would save to database or file
      // For now, just log it
    } catch (error) {
      console.error("Failed to generate conversation summary:", error);
    }
  }

  private async recordCompactEvent(data: Record<string, unknown>): Promise<void> {
    if (!this.config.persistenceEnabled) {
      return;
    }

    try {
      const compactEvent = {
        timestamp: new Date(),
        ...data,
        integrationVersion: "1.0.0",
        configSnapshot: {
          contextMonitoring: this.config.enableContextMonitoring,
          autoCompact: this.config.enableAutoCompact,
          compactThreshold: this.config.compactThreshold,
        },
      };

      this.log("Compact event recorded:", compactEvent);

      // In a real implementation, this would save to database or file
    } catch (error) {
      console.error("Failed to record compact event:", error);
    }
  }

  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.verboseLogging) {
      if (data) {
        console.log(`[ClaudeCodeIntegration] ${message}`, data);
      } else {
        console.log(`[ClaudeCodeIntegration] ${message}`);
      }
    }
  }

  public updateConfig(newConfig: Partial<ClaudeCodeIntegrationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log("Claude Code integration configuration updated:", {
      from: oldConfig,
      to: this.config,
    });

    // Re-apply configuration if active
    if (this.isActive) {
      this.applyConfiguration();
    }
  }

  public getConfig(): ClaudeCodeIntegrationConfig {
    return { ...this.config };
  }

  public getStatus(): {
    initialized: boolean;
    active: boolean;
    contextMonitoring: boolean;
    autoCompact: boolean;
    requirementDetection: boolean;
    statistics: {
      context: any;
      autoCompact: any;
      hooks: any;
    };
  } {
    return {
      initialized: this.isInitialized,
      active: this.isActive,
      contextMonitoring: this.config.enableContextMonitoring,
      autoCompact: this.config.enableAutoCompact,
      requirementDetection: this.config.enableRequirementDetection,
      statistics: {
        context: contextMonitor.getStatistics(),
        autoCompact: autoCompactService.getStatistics(),
        hooks: hookManager.getStatistics(),
      },
    };
  }

  public triggerTestEvent(event: HookEvent, data?: Record<string, unknown>): Promise<void> {
    return hookManager.trigger(event, data);
  }

  public getHookManager() {
    return hookManager;
  }

  public getContextMonitor() {
    return contextMonitor;
  }

  public getAutoCompactService() {
    return autoCompactService;
  }

  public isIntegrationActive(): boolean {
    return this.isActive;
  }
}

// Singleton instance
export const claudeCodeIntegration = new ClaudeCodeIntegrationService();
