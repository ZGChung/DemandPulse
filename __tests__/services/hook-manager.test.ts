import { HookManager } from "@/services/hook-manager";
import { HookEvent } from "@/types/claude-code";

describe("HookManager", () => {
  let manager: HookManager;

  beforeEach(() => {
    manager = new HookManager();
  });

  describe("register", () => {
    it("should register a handler for an event", () => {
      const handler = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler);

      const handlers = manager.getHandlers("message_sent");
      expect(handlers.length).toBe(1);
    });

    it("should register multiple handlers for the same event", () => {
      const handler1 = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };
      const handler2 = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler1);
      manager.register(handler2);

      const handlers = manager.getHandlers("message_sent");
      expect(handlers.length).toBe(2);
    });

    it("should sort handlers by priority (higher first)", () => {
      const results: string[] = [];

      const lowPriority = {
        event: "message_sent" as HookEvent,
        priority: 1,
        handler: async () => {
          results.push("low");
        },
      };
      const highPriority = {
        event: "message_sent" as HookEvent,
        priority: 10,
        handler: async () => {
          results.push("high");
        },
      };

      manager.register(lowPriority);
      manager.register(highPriority);

      // Trigger and wait for handlers to complete
      manager.trigger("message_sent", {}).then(() => {
        expect(results).toEqual(["high", "low"]);
      });
    });
  });

  describe("unregister", () => {
    it("should remove a registered handler", () => {
      const handler = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler);
      manager.unregister(handler);

      const handlers = manager.getHandlers("message_sent");
      expect(handlers.length).toBe(0);
    });
  });

  describe("trigger", () => {
    it("should execute all handlers for an event", async () => {
      let counter = 0;

      const handler1 = {
        event: "message_sent" as HookEvent,
        handler: async () => {
          counter++;
        },
      };
      const handler2 = {
        event: "message_sent" as HookEvent,
        handler: async () => {
          counter++;
        },
      };

      manager.register(handler1);
      manager.register(handler2);

      await manager.trigger("message_sent", { test: true });

      expect(counter).toBe(2);
    });

    it("should pass data to handlers", async () => {
      let receivedData: Record<string, unknown> | undefined;

      const handler = {
        event: "message_sent" as HookEvent,
        handler: async (data: Record<string, unknown>) => {
          receivedData = data;
        },
      };

      manager.register(handler);
      await manager.trigger("message_sent", { testKey: "testValue" });

      expect(receivedData?.testKey).toBe("testValue");
    });

    it("should not trigger handlers for different events", async () => {
      let called = false;

      const handler = {
        event: "message_sent" as HookEvent,
        handler: async () => {
          called = true;
        },
      };

      manager.register(handler);

      // Should not throw, just not call the handler
      await manager.trigger("message_received", {});
      expect(called).toBe(false);
    });

    it("should continue executing handlers even if one throws", async () => {
      let counter = 0;

      const handler1 = {
        event: "message_sent" as HookEvent,
        handler: async () => {
          throw new Error("Handler error");
        },
      };
      const handler2 = {
        event: "message_sent" as HookEvent,
        handler: async () => {
          counter++;
        },
      };

      manager.register(handler1);
      manager.register(handler2);

      // Should not throw
      await manager.trigger("message_sent", {});

      // Second handler should still have been called
      expect(counter).toBe(1);
    });
  });

  describe("getEventHistory", () => {
    it("should return event history", async () => {
      await manager.trigger("message_sent", { id: 1 });
      await manager.trigger("message_received", { id: 2 });

      const history = manager.getEventHistory();

      expect(history.length).toBe(2);
      expect(history[0].event).toBe("message_sent");
      expect(history[1].event).toBe("message_received");
    });

    it("should include timestamp in history", async () => {
      const before = new Date();
      await manager.trigger("message_sent", {});
      const after = new Date();

      const history = manager.getEventHistory();

      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should respect limit parameter", async () => {
      await manager.trigger("message_sent", { id: 1 });
      await manager.trigger("message_sent", { id: 2 });
      await manager.trigger("message_sent", { id: 3 });

      const history = manager.getEventHistory(2);

      expect(history.length).toBe(2);
    });
  });

  describe("clearHandlers", () => {
    it("should clear handlers for a specific event", () => {
      const handler = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler);
      manager.clearHandlers("message_sent");

      const handlers = manager.getHandlers("message_sent");
      expect(handlers.length).toBe(0);
    });

    it("should clear all handlers when no event specified", () => {
      const handler1 = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };
      const handler2 = {
        event: "message_received" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler1);
      manager.register(handler2);
      manager.clearHandlers();

      expect(manager.getHandlers("message_sent").length).toBe(0);
      expect(manager.getHandlers("message_received").length).toBe(0);
    });
  });

  describe("getStatistics", () => {
    it("should return correct statistics", async () => {
      const handler = {
        event: "message_sent" as HookEvent,
        handler: async () => {},
      };

      manager.register(handler);
      await manager.trigger("message_sent", {});

      const stats = manager.getStatistics();

      expect(stats.totalEvents).toBe(1);
      expect(stats.handlersByEvent["message_sent"]).toBe(1);
      expect(stats.recentEvents.length).toBe(1);
    });
  });
});
