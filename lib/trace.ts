/**
 * Trace ID utilities for request tracing and observability
 */

/**
 * Generate a unique trace ID for request correlation
 */
export function generateTraceId(): string {
  // Use timestamp and random bytes for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `trace_${timestamp}_${random}`;
}

/**
 * Get or generate trace ID from request headers
 */
export function getTraceIdFromHeaders(headers: Headers): string {
  // Check for common trace headers
  const traceId =
    headers.get("x-trace-id") ||
    headers.get("x-request-id") ||
    headers.get("x-correlation-id") ||
    headers.get("traceparent")?.split("-")[1]; // W3C Trace Context

  return traceId || generateTraceId();
}

/**
 * Set trace ID on response headers
 */
export function setTraceIdOnHeaders(headers: Headers, traceId: string): void {
  headers.set("x-trace-id", traceId);
  headers.set("x-request-id", traceId);
}

/**
 * Create a trace context object for logging
 */
export function createTraceContext(traceId: string, spanId?: string): Record<string, string> {
  return {
    traceId,
    spanId: spanId || generateTraceId().replace("trace_", "span_"),
  };
}

export interface TraceStore {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// Stub for client bundle; server uses trace-server.ts for AsyncLocalStorage
let _traceContext: TraceStore | undefined;
export const traceStorage = {
  run<T>(store: TraceStore, callback: () => T): T {
    const prev = _traceContext;
    _traceContext = store;
    try {
      return callback();
    } finally {
      _traceContext = prev;
    }
  },
  getStore(): TraceStore | undefined {
    return _traceContext;
  },
};

/**
 * Run a function with trace context
 */
export function runWithTrace<T>(traceId: string, callback: () => T): T {
  const store: TraceStore = {
    traceId,
    spanId: generateTraceId().replace("trace_", "span_"),
  };
  return traceStorage.run(store, callback);
}

/**
 * Get current trace context
 */
export function getTraceContext(): TraceStore | undefined {
  return traceStorage.getStore();
}

/**
 * Get trace ID for current context
 */
export function getCurrentTraceId(): string | undefined {
  return getTraceContext()?.traceId;
}

/**
 * Create a new span within current trace
 */
export function createSpan(name: string): { end: () => void } {
  const parentContext = getTraceContext();
  const spanId = generateTraceId().replace("trace_", "span_");

  // In a real implementation, this would record span start time
  // and send to tracing system (OpenTelemetry, Jaeger, etc.)
  const startTime = performance.now();

  return {
    end: () => {
      const duration = performance.now() - startTime;
      // Log span completion
      console.debug(`Span "${name}" completed`, {
        traceId: parentContext?.traceId,
        spanId,
        parentSpanId: parentContext?.spanId,
        durationMs: Math.round(duration),
      });
    },
  };
}
