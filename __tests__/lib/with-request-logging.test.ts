import { describe, it, expect } from "@jest/globals";

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
});
