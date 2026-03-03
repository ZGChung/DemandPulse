import { describe, it, expect, jest } from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

import type { RouteHandler } from "@/lib/with-request-logging";

describe("withRequestLogging", () => {
  it("should export withRequestLogging function", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");
    expect(typeof withRequestLogging).toBe("function");
  });

  it("should return a function that wraps a handler", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler: RouteHandler = async () => {
      return NextResponse.json({ ok: true });
    };

    const wrapped = withRequestLogging(mockHandler);
    expect(typeof wrapped).toBe("function");
  });

  it("should create wrapped handler that preserves handler behavior", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

    const wrapped = withRequestLogging(mockHandler);

    // Create minimal mock request
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: { get: () => null },
    } as unknown as NextRequest;

    await wrapped(mockRequest);

    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it("should handle different HTTP methods", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    for (const method of methods) {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ method }));

      const wrapped = withRequestLogging(mockHandler);
      const mockRequest = {
        nextUrl: { pathname: "/api/test" },
        method,
        headers: { get: () => null },
      } as unknown as NextRequest;

      await wrapped(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
    }
  });

  it("should handle handler errors gracefully", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockRejectedValue(new Error("Test error"));

    const wrapped = withRequestLogging(mockHandler);
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: { get: () => null },
    } as unknown as NextRequest;

    // Should not throw, should return error response
    const response = await wrapped(mockRequest);

    expect(response.status).toBe(500);
  });

  it("should handle request with URL object when nextUrl is undefined", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

    const wrapped = withRequestLogging(mockHandler);
    const mockRequest = {
      nextUrl: null,
      url: "http://localhost:3000/api/test",
      method: "GET",
      headers: { get: () => null },
    } as unknown as NextRequest;

    await wrapped(mockRequest);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("should propagate trace ID in response headers", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

    const wrapped = withRequestLogging(mockHandler);
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: new Headers({ "x-trace-id": "test-trace-123" }),
    } as unknown as NextRequest;

    const response = await wrapped(mockRequest);

    // Should have trace ID in headers
    expect(response.headers.get("x-trace-id")).toBe("test-trace-123");
  });

  it("should handle context with params", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));

    const wrapped = withRequestLogging(mockHandler);
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: { get: () => null },
    } as unknown as NextRequest;
    const context = { params: { id: "123" } };

    await wrapped(mockRequest, context);

    expect(mockHandler).toHaveBeenCalledWith(mockRequest, context);
  });

  it("should return error response with trace ID when handler throws", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockRejectedValue(new Error("Test error"));

    const wrapped = withRequestLogging(mockHandler);
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: new Headers({ "x-trace-id": "error-trace-456" }),
    } as unknown as NextRequest;

    const response = await wrapped(mockRequest);

    expect(response.status).toBe(500);
    expect(response.headers.get("x-trace-id")).toBe("error-trace-456");
  });
});
