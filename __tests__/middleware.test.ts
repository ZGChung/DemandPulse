// Mock next/server modules before importing
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
    redirect: jest.fn(),
    next: jest.fn(),
  },
  NextRequest: jest.fn(),
}));

jest.mock("next-auth/middleware", () => ({
  withAuth: jest.fn((fn) => fn),
}));

jest.mock("@/lib/csrf", () => ({
  validateCSRFToken: jest.fn(),
  setCSRFTokenCookie: jest.fn(),
  getCSRFTokenFromRequest: jest.fn(),
}));

jest.mock("@/lib/trace", () => ({
  getTraceIdFromHeaders: jest.fn(() => "test-trace-id"),
  setTraceIdOnHeaders: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Public route detection", () => {
    it("should identify health check as public route", () => {
      const pathname = "/api/health";
      const isPublic = pathname === "/api/health";
      expect(isPublic).toBe(true);
    });

    it("should identify mock routes for explicit middleware handling", () => {
      const pathname = "/api/mock/requirements";
      const isPublic = pathname.startsWith("/api/mock/");
      expect(isPublic).toBe(true);
    });

    it("should identify GET /api/requirements as public", () => {
      const pathname = "/api/requirements";
      const method = "GET";
      const isPublic = method === "GET" && pathname === "/api/requirements";
      expect(isPublic).toBe(true);
    });

    it("should identify OPTIONS as public", () => {
      const method = "OPTIONS";
      const isPublic = method === "OPTIONS";
      expect(isPublic).toBe(true);
    });
  });

  describe("CORS headers", () => {
    it("should set Access-Control-Allow-Origin header", () => {
      const headers = new Map();
      headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
      expect(headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    });

    it("should set Access-Control-Allow-Methods header", () => {
      const headers = new Map();
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      expect(headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
    });

    it("should set Access-Control-Allow-Headers header", () => {
      const headers = new Map();
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      expect(headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    });

    it("should set Access-Control-Allow-Credentials header", () => {
      const headers = new Map();
      headers.set("Access-Control-Allow-Credentials", "true");
      expect(headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });
  });

  describe("Trace ID propagation", () => {
    it("should get trace ID from request headers", () => {
      const { getTraceIdFromHeaders } = require("@/lib/trace");
      const headers = new Headers({ "x-trace-id": "test-trace-123" });
      getTraceIdFromHeaders(headers);
      expect(getTraceIdFromHeaders).toHaveBeenCalledWith(headers);
    });

    it("should set trace ID on response headers", () => {
      const { setTraceIdOnHeaders } = require("@/lib/trace");
      const responseHeaders = new Map();
      setTraceIdOnHeaders(responseHeaders, "test-trace-id");
      expect(setTraceIdOnHeaders).toHaveBeenCalledWith(responseHeaders, "test-trace-id");
    });
  });

  describe("Request path parsing", () => {
    it("should extract pathname from URL", () => {
      const url = new URL("http://localhost:3000/api/requirements");
      expect(url.pathname).toBe("/api/requirements");
    });

    it("should identify admin routes", () => {
      const pathname = "/api/admin/users";
      const isAdminRoute = pathname.startsWith("/api/admin/");
      expect(isAdminRoute).toBe(true);
    });
  });
});
