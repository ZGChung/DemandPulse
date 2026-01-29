import { HookEvent, HookHandler } from "@/types/claude-code";

export class HookManager {
  private handlers: Map<HookEvent, HookHandler[]> = new Map();
  private eventHistory: Array<{ event: HookEvent; timestamp: Date; data?: any }> = [];

  constructor() {
    // Initialize handlers map for all event types
    const allEvents: HookEvent[] = [
      "conversation_start",
      "message_sent",
      "message_received",
      "conversation_end",
      "code_generated",
      "requirement_detected",
      "context_limit_approaching",
      "context_limit_reached",
      "auto_compact_triggered",
      "compact_command_executed",
    ];

    allEvents.forEach((event) => {
      this.handlers.set(event, []);
    });
  }

  register(handler: HookHandler): void {
    const handlers = this.handlers.get(handler.event);
    if (handlers) {
      // Insert based on priority (higher priority first)
      const index = handlers.findIndex((h) => (h.priority || 0) < (handler.priority || 0));
      if (index === -1) {
        handlers.push(handler);
      } else {
        handlers.splice(index, 0, handler);
      }
    }
  }

  unregister(handler: HookHandler): void {
    const handlers = this.handlers.get(handler.event);
    if (handlers) {
      const index = handlers.findIndex((h) => h.handler === handler.handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  async trigger(event: HookEvent, data?: any): Promise<void> {
    // Record event in history
    this.eventHistory.push({
      event,
      timestamp: new Date(),
      data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone
    });

    // Keep history size manageable
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }

    // Execute handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler.handler(data);
        } catch (error) {
          console.error(`Error executing handler for event ${event}:`, error);
          // Continue with other handlers even if one fails
        }
      }
    }
  }

  getHandlers(event: HookEvent): HookHandler[] {
    return this.handlers.get(event) || [];
  }

  getEventHistory(limit?: number): Array<{ event: HookEvent; timestamp: Date; data?: any }> {
    const history = [...this.eventHistory];
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  clearHandlers(event?: HookEvent): void {
    if (event) {
      this.handlers.set(event, []);
    } else {
      // Clear all handlers
      this.handlers.forEach((_, key) => {
        this.handlers.set(key, []);
      });
    }
  }

  getStatistics(): {
    totalEvents: number;
    handlersByEvent: Record<string, number>;
    recentEvents: Array<{ event: HookEvent; timestamp: Date }>;
  } {
    const handlersByEvent: Record<string, number> = {};
    this.handlers.forEach((handlers, event) => {
      handlersByEvent[event] = handlers.length;
    });

    return {
      totalEvents: this.eventHistory.length,
      handlersByEvent,
      recentEvents: this.eventHistory
        .slice(-10)
        .map(({ event, timestamp }) => ({ event, timestamp })),
    };
  }
}

// Singleton instance
export const hookManager = new HookManager();
