// Trace ID utilities tests
import {
  generateTraceId,
  getTraceIdFromHeaders,
  setTraceIdOnHeaders,
  createTraceContext,
  traceStorage,
  runWithTrace,
  getTraceContext,
  getCurrentTraceId,
  createSpan,
} from "@/lib/trace";

describe("Trace ID Utilities", () => {
  describe("generateTraceId", () => {
    it("should generate a trace ID with trace_ prefix", () => {
      const traceId = generateTraceId();

      expect(traceId).toMatch(/^trace_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateTraceId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe("getTraceIdFromHeaders", () => {
    it("should return x-trace-id when present", () => {
      const headers = new Headers({ "x-trace-id": "custom-trace-id" });
      const result = getTraceIdFromHeaders(headers);

      expect(result).toBe("custom-trace-id");
    });

    it("should return x-request-id as fallback", () => {
      const headers = new Headers({ "x-request-id": "request-id-123" });
      const result = getTraceIdFromHeaders(headers);

      expect(result).toBe("request-id-123");
    });

    it("should return x-correlation-id as fallback", () => {
      const headers = new Headers({ "x-correlation-id": "correlation-id-456" });
      const result = getTraceIdFromHeaders(headers);

      expect(result).toBe("correlation-id-456");
    });

    it("should parse traceparent (W3C format)", () => {
      const headers = new Headers({
        traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      });
      const result = getTraceIdFromHeaders(headers);

      expect(result).toBe("0af7651916cd43dd8448eb211c80319c");
    });

    it("should generate new trace ID when none present", () => {
      const headers = new Headers();
      const result = getTraceIdFromHeaders(headers);

      expect(result).toMatch(/^trace_/);
    });
  });

  describe("setTraceIdOnHeaders", () => {
    it("should set x-trace-id and x-request-id headers", () => {
      const headers = new Headers();
      setTraceIdOnHeaders(headers, "test-trace-id");

      expect(headers.get("x-trace-id")).toBe("test-trace-id");
      expect(headers.get("x-request-id")).toBe("test-trace-id");
    });
  });

  describe("createTraceContext", () => {
    it("should create context with given trace ID", () => {
      const context = createTraceContext("test-trace");

      expect(context.traceId).toBe("test-trace");
      expect(context.spanId).toMatch(/^span_/);
    });

    it("should use provided spanId when given", () => {
      const context = createTraceContext("test-trace", "custom-span");

      expect(context.traceId).toBe("test-trace");
      expect(context.spanId).toBe("custom-span");
    });
  });
});

describe("traceStorage", () => {
  describe("run", () => {
    it("should run callback with given store", () => {
      const store = { traceId: "test-trace", spanId: "test-span" };
      let captured: ReturnType<typeof getTraceContext>;

      traceStorage.run(store, () => {
        captured = getTraceContext();
      });

      expect(captured).toEqual(store);
    });

    it("should restore previous store after callback", () => {
      const initial = { traceId: "initial", spanId: "initial-span" };
      const newStore = { traceId: "new", spanId: "new-span" };
      let afterStore: ReturnType<typeof getTraceContext>;

      traceStorage.run(initial, () => {
        traceStorage.run(newStore, () => {
          // Nested call
        });
        afterStore = getTraceContext();
      });

      expect(afterStore).toEqual(initial);
    });

    it("should restore store even on error", () => {
      const initial = { traceId: "initial", spanId: "initial-span" };

      try {
        traceStorage.run(initial, () => {
          throw new Error("test error");
        });
      } catch {
        // Expected
      }

      const afterStore = getTraceContext();
      expect(afterStore).toBeUndefined();
    });
  });

  describe("getStore", () => {
    it("should return undefined when no context", () => {
      const store = traceStorage.getStore();
      expect(store).toBeUndefined();
    });

    it("should return current store when set", () => {
      const store = { traceId: "test", spanId: "span" };
      let result: ReturnType<typeof traceStorage.getStore>;

      traceStorage.run(store, () => {
        result = traceStorage.getStore();
      });

      expect(result).toEqual(store);
    });
  });
});

describe("runWithTrace", () => {
  it("should run callback with trace context", () => {
    let context: ReturnType<typeof getTraceContext>;

    runWithTrace("my-trace-id", () => {
      context = getTraceContext();
    });

    expect(context?.traceId).toBe("my-trace-id");
    expect(context?.spanId).toMatch(/^span_/);
  });

  it("should return callback result", () => {
    const result = runWithTrace("trace", () => 42);
    expect(result).toBe(42);
  });
});

describe("getTraceContext", () => {
  it("should return undefined outside runWithTrace", () => {
    const context = getTraceContext();
    expect(context).toBeUndefined();
  });

  it("should return context inside runWithTrace", () => {
    let context: ReturnType<typeof getTraceContext>;

    runWithTrace("trace", () => {
      context = getTraceContext();
    });

    expect(context).toBeDefined();
    expect(context?.traceId).toBe("trace");
  });
});

describe("getCurrentTraceId", () => {
  it("should return undefined when no context", () => {
    const traceId = getCurrentTraceId();
    expect(traceId).toBeUndefined();
  });

  it("should return trace ID in context", () => {
    let traceId: string | undefined;

    runWithTrace("trace-id-123", () => {
      traceId = getCurrentTraceId();
    });

    expect(traceId).toBe("trace-id-123");
  });
});

describe("createSpan", () => {
  it("should return object with end method", () => {
    const span = createSpan("test-span");

    expect(span).toHaveProperty("end");
    expect(typeof span.end).toBe("function");
  });

  it("should end span without error", () => {
    const span = createSpan("test-span");

    expect(() => span.end()).not.toThrow();
  });

  it("should have parent context", () => {
    runWithTrace("parent-trace", () => {
      const span = createSpan("child-span");
      span.end();
      // Should not throw - logs to console.debug
    });
  });
});
