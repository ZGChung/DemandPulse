import { describe, it, expect, jest } from "@jest/globals";

describe("withRequestLogging", () => {
  it("should export withRequestLogging function", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");
    expect(typeof withRequestLogging).toBe("function");
  });

  it("should return a function that wraps a handler", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const wrapped = withRequestLogging(mockHandler);
    expect(typeof wrapped).toBe("function");
  });

  it("should create wrapped handler that preserves handler behavior", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const mockHandler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const wrapped = withRequestLogging(mockHandler);

    // Create minimal mock request
    const mockRequest = {
      nextUrl: { pathname: "/api/test" },
      method: "GET",
      headers: { get: () => null },
    } as any;

    await wrapped(mockRequest);

    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
  });

  it("should handle different HTTP methods", async () => {
    const { withRequestLogging } = await import("@/lib/with-request-logging");

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    for (const method of methods) {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ method }), { status: 200 }));

      const wrapped = withRequestLogging(mockHandler);
      const mockRequest = {
        nextUrl: { pathname: "/api/test" },
        method,
        headers: { get: () => null },
      } as any;

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
    } as any;

    // Should not throw, should return error response
    const response = await wrapped(mockRequest);

    expect(response.status).toBe(500);
  });
});
