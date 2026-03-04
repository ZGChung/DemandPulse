// CSRF token tests
import {
  generateToken,
  verifyToken,
  setCSRFTokenCookie,
  validateCSRFToken,
  getCSRFTokenFromRequest,
  _CSRFTokenError,
  defaultConfig,
} from "@/lib/csrf";

describe("CSRF Token Utilities", () => {
  const testSecret = "test-secret-for-csrf";
  const testConfig = {
    ...defaultConfig,
    secret: testSecret,
  };

  describe("generateToken", () => {
    it("should generate token and signedToken", async () => {
      const result = await generateToken(testConfig);

      expect(result.token).toBeDefined();
      expect(result.signedToken).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(result.signedToken.length).toBe(64); // sha256 = 64 hex chars
    });

    it("should generate unique tokens each time", async () => {
      const token1 = await generateToken(testConfig);
      const token2 = await generateToken(testConfig);

      expect(token1.token).not.toBe(token2.token);
    });
  });

  describe("verifyToken", () => {
    it("should return true for valid token pair", async () => {
      const { token, signedToken } = await generateToken(testConfig);
      const isValid = await verifyToken(token, signedToken, testConfig);

      expect(isValid).toBe(true);
    });

    it("should return false for invalid token", async () => {
      const { signedToken } = await generateToken(testConfig);
      const isValid = await verifyToken("invalid-token", signedToken, testConfig);

      expect(isValid).toBe(false);
    });

    it("should return false for tampered signedToken", async () => {
      const { token, signedToken } = await generateToken(testConfig);
      const tamperedSignedToken = signedToken.slice(0, -2) + "ff";
      const isValid = await verifyToken(token, tamperedSignedToken, testConfig);

      expect(isValid).toBe(false);
    });

    it("should return false for wrong secret", async () => {
      const { token, signedToken } = await generateToken(testConfig);
      const wrongConfig = { ...testConfig, secret: "different-secret" };
      const isValid = await verifyToken(token, signedToken, wrongConfig);

      expect(isValid).toBe(false);
    });
  });

  describe("setCSRFTokenCookie", () => {
    it("should set cookie header on response", async () => {
      const response = new Response();
      const result = await setCSRFTokenCookie(response, testConfig);

      expect(result.token).toBeDefined();
      expect(result.signedToken).toBeDefined();

      const cookieHeader = response.headers.get("Set-Cookie");
      expect(cookieHeader).toContain("csrf-token=");
      expect(cookieHeader).toContain("HttpOnly");
    });
  });

  describe("validateCSRFToken", () => {
    it("should skip validation for GET requests", async () => {
      const request = new Request("http://test.com", { method: "GET" });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(true);
    });

    it("should skip validation for HEAD requests", async () => {
      const request = new Request("http://test.com", { method: "HEAD" });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(true);
    });

    it("should skip validation for OPTIONS requests", async () => {
      const request = new Request("http://test.com", { method: "OPTIONS" });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(true);
    });

    it("should fail when CSRF header is missing", async () => {
      const request = new Request("http://test.com", {
        method: "POST",
        headers: {
          Cookie: "csrf-token=test:test",
        },
      });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("missing from header");
    });

    it("should fail when cookie is missing", async () => {
      const request = new Request("http://test.com", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "a".repeat(64),
        },
      });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("cookie missing");
    });

    it("should validate valid token pair", async () => {
      const { token, signedToken } = await generateToken(testConfig);
      const cookieValue = encodeURIComponent(`${token}:${signedToken}`);

      const request = new Request("http://test.com", {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          Cookie: `csrf-token=${cookieValue}`,
        },
      });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(true);
    });

    it("should fail with invalid token format in cookie", async () => {
      const request = new Request("http://test.com", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "a".repeat(64),
          Cookie: "csrf-token=invalid",
        },
      });
      const result = await validateCSRFToken(request, testConfig);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid CSRF cookie format");
    });
  });

  describe("getCSRFTokenFromRequest", () => {
    it("should return token pair from cookie", async () => {
      const { token, signedToken } = await generateToken(testConfig);
      const cookieValue = encodeURIComponent(`${token}:${signedToken}`);

      const request = new Request("http://test.com", {
        headers: {
          Cookie: `csrf-token=${cookieValue}`,
        },
      });

      const result = getCSRFTokenFromRequest(request, testConfig);

      expect(result).toEqual({ token, signedToken });
    });

    it("should return null when no cookie", () => {
      const request = new Request("http://test.com");
      const result = getCSRFTokenFromRequest(request, testConfig);

      expect(result).toBeNull();
    });

    it("should return null for invalid cookie format", () => {
      const request = new Request("http://test.com", {
        headers: {
          Cookie: "csrf-token=invalid",
        },
      });

      const result = getCSRFTokenFromRequest(request, testConfig);

      expect(result).toBeNull();
    });
  });
});

describe("Helper functions", () => {
  it("should handle hex conversions", async () => {
    // This is implicitly tested via generateToken
    const { token } = await generateToken();
    // Token should be valid hex
    expect(token).toMatch(/^[a-f0-9]+$/);
  });
});
