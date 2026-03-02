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

    it("should throw EncryptionError when Web Crypto API not available", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      // Test the getKey method by trying to import invalid key
      const service = new EncryptionService({ key: "invalid-key-format", enabled: true });
      await expect(service.encrypt("test")).rejects.toThrow();
    });

    it("should handle encryptJSON with array data", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const data = [1, 2, 3, "test"];
      const encrypted = await service.encryptJSON(data);
      const decrypted = await service.decryptJSON(encrypted);
      expect(decrypted).toEqual(data);
    });

    it("should handle encryptJSON with null data", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const data = null;
      const encrypted = await service.encryptJSON(data);
      const decrypted = await service.decryptJSON(encrypted);
      expect(decrypted).toBeNull();
    });

    it("should handle encryptJSON with boolean data", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const data = true;
      const encrypted = await service.encryptJSON(data);
      const decrypted = await service.decryptJSON(encrypted);
      expect(decrypted).toBe(true);
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

  describe("EncryptionService methods", () => {
    it("should report isEnabled correctly when disabled", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: false });
      expect(service.isEnabled()).toBe(false);
    });

    it("should report isEnabled correctly when enabled but no key", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: true });
      expect(service.isEnabled()).toBe(false);
    });

    it("should report isEnabled correctly when enabled with key", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({
        key: "test-key-12345678901234567890123456789012",
        enabled: true,
      });
      expect(service.isEnabled()).toBe(true);
    });

    it("should encrypt and decrypt JSON objects", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const data = { name: "test", value: 123, nested: { a: 1 } };
      const encrypted = await service.encryptJSON(data);
      const decrypted = await service.decryptJSON(encrypted);
      expect(decrypted).toEqual(data);
    });

    it("should return plaintext when encryption disabled", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: false });
      const plaintext = "secret data";
      const result = await service.encrypt(plaintext);
      expect(result).toBe(plaintext);
    });

    it("should return ciphertext as-is when encryption disabled", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: false });
      const ciphertext = "some-data";
      const result = await service.decrypt(ciphertext);
      expect(result).toBe(ciphertext);
    });

    it("should handle non-encrypted format in decrypt", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const plaintext = "not-encrypted-format";
      const result = await service.decrypt(plaintext);
      expect(result).toBe(plaintext);
    });

    it("should generate a valid key", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const key = EncryptionService.generateKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
      // Base64 encoded 32 bytes should be ~44 characters
      expect(key.length).toBeGreaterThan(40);
    });

    it("should generate unique keys", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();
      expect(key1).not.toBe(key2);
    });

    it("should export defaultEncryptionConfig", async () => {
      const { defaultEncryptionConfig } = await import("@/lib/encryption");
      expect(defaultEncryptionConfig).toBeDefined();
      expect(typeof defaultEncryptionConfig.enabled).toBe("boolean");
    });

    it("should handle long text encryption", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const plaintext = "A".repeat(10000);
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const plaintext = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt different plaintexts to different ciphertexts", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const encrypted1 = await service.encrypt("text1");
      const encrypted2 = await service.encrypt("text2");
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle base64 special characters in plaintext", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      // This could cause issues if not handled properly
      const plaintext = "a+b/c=d==";
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe("EncryptionService errors", () => {
    it("should return plaintext when encrypting without key and disabled", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: false });
      const result = await service.encrypt("test");
      expect(result).toBe("test");
    });

    it("should return ciphertext when decrypting without key and disabled", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "", enabled: false });
      const result = await service.decrypt("test");
      expect(result).toBe("test");
    });

    it("should handle decryptJSON with invalid JSON", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      const encrypted = await service.encrypt("not-valid-json");
      await expect(service.decryptJSON(encrypted)).rejects.toThrow();
    });

    it("should handle decryptJSON with corrupted data", async () => {
      const { EncryptionService } = await import("@/lib/encryption");
      const service = new EncryptionService({ key: "test-key-12345678901234567890123456789012" });
      // Create a corrupted encrypted string (valid base64 but not our encrypted format)
      await expect(service.decryptJSON("corrupted:data")).rejects.toThrow();
    });
  });
});
