import { describe, it, expect } from "@jest/globals";

import {
  generateToken,
  verifyToken,
  CSRFTokenError,
  setCSRFTokenCookie,
  validateCSRFToken,
  getCSRFTokenFromRequest,
  CSRFConfig,
} from "@/lib/csrf";

describe("CSRF Token", () => {
  describe("generateToken", () => {
    it("should generate a valid token pair", async () => {
      const { token, signedToken } = await generateToken();
      expect(token).toBeDefined();
      expect(signedToken).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(signedToken.length).toBe(64);
    });

    it("should generate unique tokens each time", async () => {
      const token1 = await generateToken();
      const token2 = await generateToken();
      expect(token1.token).not.toBe(token2.token);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      const { token, signedToken } = await generateToken();
      const isValid = await verifyToken(token, signedToken);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid token", async () => {
      const { signedToken } = await generateToken();
      const isValid = await verifyToken("invalid-token", signedToken);
      expect(isValid).toBe(false);
    });

    it("should reject tampered signed token", async () => {
      const { token, signedToken } = await generateToken();
      const tamperedSigned = signedToken.slice(0, -2) + "ff";
      const isValid = await verifyToken(token, tamperedSigned);
      expect(isValid).toBe(false);
    });
  });

  describe("CSRFTokenError", () => {
    it("should create error with message", () => {
      const error = new CSRFTokenError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("CSRFTokenError");
    });
  });

  describe("setCSRFTokenCookie", () => {
    it("should generate and set CSRF token cookie", async () => {
      const response = new Response();
      const result = await setCSRFTokenCookie(response);
      expect(result.token).toBeDefined();
      expect(result.signedToken).toBeDefined();
      const cookieHeader = response.headers.get("Set-Cookie");
      expect(cookieHeader).toContain("csrf-token");
    });

    it("should use custom cookie name", async () => {
      const customConfig: CSRFConfig = {
        secret: "test-secret",
        cookieName: "custom-csrf",
        headerName: "X-Custom-CSRF",
      };
      const response = new Response();
      await setCSRFTokenCookie(response, customConfig);
      const cookieHeader = response.headers.get("Set-Cookie");
      expect(cookieHeader).toContain("custom-csrf");
    });

    it("should set cookie with correct options", async () => {
      const customConfig: CSRFConfig = {
        secret: "test-secret",
        cookieName: "test-cookie",
        headerName: "X-Test-CSRF",
        cookieOptions: {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/api",
          maxAge: 3600,
        },
      };
      const response = new Response();
      await setCSRFTokenCookie(response, customConfig);
      const cookieHeader = response.headers.get("Set-Cookie");
      expect(cookieHeader).toContain("Secure");
      expect(cookieHeader).toContain("SameSite=lax");
      expect(cookieHeader).toContain("Path=/api");
      expect(cookieHeader).toContain("Max-Age=3600");
    });
  });

  describe("validateCSRFToken", () => {
    it("should allow safe methods without validation", async () => {
      const request = new Request("http://example.com/api", { method: "GET" });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should allow HEAD method", async () => {
      const request = new Request("http://example.com/api", { method: "HEAD" });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should allow OPTIONS method", async () => {
      const request = new Request("http://example.com/api", { method: "OPTIONS" });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should reject POST without token header", async () => {
      const request = new Request("http://example.com/api", { method: "POST" });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("CSRF token missing from header");
    });

    it("should reject POST without cookie", async () => {
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: { "X-CSRF-Token": "abc123" },
      });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("CSRF cookie missing");
    });

    it("should validate valid token pair", async () => {
      const { token, signedToken } = await generateToken();
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          Cookie: `csrf-token=${token}:${signedToken}`,
        },
      });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(true);
    });

    it("should reject mismatched token", async () => {
      const { signedToken } = await generateToken();
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "mismatched-token",
          Cookie: `csrf-token=mismatched-token:${signedToken}`,
        },
      });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(false);
      // Token mismatch is detected as invalid signature when HMAC verification fails
      expect(result.error).toMatch(/mismatch|signature/i);
    });

    it("should reject invalid cookie format", async () => {
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "abc123",
          Cookie: "csrf-token=invalid-format",
        },
      });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid CSRF cookie format");
    });

    it("should reject invalid signed token", async () => {
      const { token } = await generateToken();
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          Cookie: `csrf-token=${token}:invalidsignature`,
        },
      });
      const result = await validateCSRFToken(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid CSRF token signature");
    });

    it("should use custom header name", async () => {
      const customConfig: CSRFConfig = {
        secret: "test-secret",
        cookieName: "custom-csrf",
        headerName: "X-Custom-CSRF",
      };
      const { token, signedToken } = await generateToken(customConfig);
      const request = new Request("http://example.com/api", {
        method: "POST",
        headers: {
          "X-Custom-CSRF": token,
          Cookie: `custom-csrf=${token}:${signedToken}`,
        },
      });
      const result = await validateCSRFToken(request, customConfig);
      expect(result.valid).toBe(true);
    });
  });

  describe("getCSRFTokenFromRequest", () => {
    it("should extract token from cookie", async () => {
      const { token, signedToken } = await generateToken();
      const request = new Request("http://example.com/api", {
        headers: {
          Cookie: `csrf-token=${token}:${signedToken}`,
        },
      });
      const result = getCSRFTokenFromRequest(request);
      expect(result).not.toBeNull();
      expect(result?.token).toBe(token);
      expect(result?.signedToken).toBe(signedToken);
    });

    it("should return null without cookie", () => {
      const request = new Request("http://example.com/api");
      const result = getCSRFTokenFromRequest(request);
      expect(result).toBeNull();
    });

    it("should return null for invalid cookie format", () => {
      const request = new Request("http://example.com/api", {
        headers: {
          Cookie: "csrf-token=invalid",
        },
      });
      const result = getCSRFTokenFromRequest(request);
      expect(result).toBeNull();
    });

    it("should use custom cookie name", async () => {
      const customConfig: CSRFConfig = {
        secret: "test-secret",
        cookieName: "my-csrf",
        headerName: "X-CSRF-Token",
      };
      const { token, signedToken } = await generateToken(customConfig);
      const request = new Request("http://example.com/api", {
        headers: {
          Cookie: `my-csrf=${token}:${signedToken}`,
        },
      });
      const result = getCSRFTokenFromRequest(request, customConfig);
      expect(result?.token).toBe(token);
    });
  });
});
