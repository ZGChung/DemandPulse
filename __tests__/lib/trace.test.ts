import { describe, it, expect } from "@jest/globals";

import {
  generateTraceId,
  getTraceIdFromHeaders,
  setTraceIdOnHeaders,
  createTraceContext,
  traceStorage,
} from "@/lib/trace";

describe("Trace Utilities", () => {
  describe("generateTraceId", () => {
    it("should generate a valid trace ID", () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^trace_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("should generate unique IDs", () => {
      const id1 = generateTraceId();
      const id2 = generateTraceId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("getTraceIdFromHeaders", () => {
    it("should get trace ID from x-trace-id header", () => {
      const headers = new Headers({ "x-trace-id": "test-trace-123" });
      const traceId = getTraceIdFromHeaders(headers);
      expect(traceId).toBe("test-trace-123");
    });

    it("should get trace ID from x-request-id header", () => {
      const headers = new Headers({ "x-request-id": "request-123" });
      const traceId = getTraceIdFromHeaders(headers);
      expect(traceId).toBe("request-123");
    });

    it("should get trace ID from x-correlation-id header", () => {
      const headers = new Headers({ "x-correlation-id": "corr-123" });
      const traceId = getTraceIdFromHeaders(headers);
      expect(traceId).toBe("corr-123");
    });

    it("should parse traceparent header", () => {
      const headers = new Headers({
        traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      });
      const traceId = getTraceIdFromHeaders(headers);
      expect(traceId).toBe("0af7651916cd43dd8448eb211c80319c");
    });

    it("should generate new trace ID if none found", () => {
      const headers = new Headers();
      const traceId = getTraceIdFromHeaders(headers);
      expect(traceId).toMatch(/^trace_/);
    });
  });

  describe("setTraceIdOnHeaders", () => {
    it("should set trace ID on headers", () => {
      const headers = new Headers();
      setTraceIdOnHeaders(headers, "test-trace-123");
      expect(headers.get("x-trace-id")).toBe("test-trace-123");
      expect(headers.get("x-request-id")).toBe("test-trace-123");
    });
  });

  describe("createTraceContext", () => {
    it("should create trace context", () => {
      const context = createTraceContext("test-trace-123");
      expect(context.traceId).toBe("test-trace-123");
      expect(context.spanId).toMatch(/^span_/);
    });

    it("should use provided spanId", () => {
      const context = createTraceContext("test-trace-123", "custom-span");
      expect(context.spanId).toBe("custom-span");
    });
  });

  describe("traceStorage", () => {
    it("should run callback with store", () => {
      const store = { traceId: "test", spanId: "span1" };
      let result: any;
      traceStorage.run(store, () => {
        result = "executed";
      });
      expect(result).toBe("executed");
    });
  });
});
