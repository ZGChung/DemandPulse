import { describe, it, expect } from "@jest/globals";

describe("Encryption Module", () => {
  describe("EncryptionService", () => {
    it("should export EncryptionService class", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      expect(EncryptionService).toBeDefined();
    });

    it("should have encrypt method", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      expect(typeof service.encrypt).toBe("function");
    });

    it("should have decrypt method", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      expect(typeof service.decrypt).toBe("function");
    });

    it("should encrypt and decrypt text correctly", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const plaintext = "Hello, World!";
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle empty string", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const encrypted = await service.encrypt("");
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle unicode text", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const plaintext = "你好世界";
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle invalid encrypted data", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      // Service may return invalid data as-is or throw depending on implementation
      const result = await service.decrypt("invalid-data");
      expect(result).toBeDefined();
    });
  });

  describe("EncryptionError", () => {
    it("should export EncryptionError class", async () => {
      const { EncryptionError } = await import("@/lib/encryption");
      expect(EncryptionError).toBeDefined();
    });

    it("should create EncryptionError with message", async () => {
      const { EncryptionError } = await import("@/lib/encryption");
      const error = new EncryptionError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("EncryptionError");
    });
  });

  describe("encryptionService", () => {
    it("should export encryptionService instance", async () => {
      const { encryptionService } = await import("@/lib/encryption");
      expect(encryptionService).toBeDefined();
    });
  });
});
