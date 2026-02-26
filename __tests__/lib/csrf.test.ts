import { describe, it, expect, beforeEach } from "@jest/globals";

import { generateToken, verifyToken, CSRFTokenError } from "@/lib/csrf";

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
});
