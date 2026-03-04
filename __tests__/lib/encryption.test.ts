// Field-level encryption tests
import { EncryptionService, EncryptionError, defaultEncryptionConfig } from "@/lib/encryption";

describe("EncryptionService", () => {
  describe("constructor", () => {
    const testKey = "dGVzdGtleTMyYnl0ZXNsb25ndGhlcnRoYW5kb3RoZXJieXRlcw=="; // 32 bytes

    it("should create instance with provided config", () => {
      const service = new EncryptionService({ key: testKey, enabled: true });
      expect(service.isEnabled()).toBe(true);
    });

    it("should be disabled when enabled is false", () => {
      const service = new EncryptionService({ key: testKey, enabled: false });
      expect(service.isEnabled()).toBe(false);
    });

    it("should be disabled when key is empty", () => {
      const service = new EncryptionService({ key: "", enabled: true });
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe("isEnabled", () => {
    const testKey = "dGVzdGtleTMyYnl0ZXNsb25ndGhlcnRoYW5kb3RoZXJieXRlcw==";

    it("should return true when enabled with valid key", () => {
      const service = new EncryptionService({ key: testKey, enabled: true });
      expect(service.isEnabled()).toBe(true);
    });

    it("should return false when disabled", () => {
      const service = new EncryptionService({ key: testKey, enabled: false });
      expect(service.isEnabled()).toBe(false);
    });

    it("should return false when key is missing", () => {
      const service = new EncryptionService({ key: "", enabled: true });
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe("encrypt", () => {
    const testKey = "dGVzdGtleTMyYnl0ZXNsb25ndGhlcnRoYW5kb3RoZXJieXRlcw==";

    it("should return plaintext when encryption is disabled", async () => {
      const service = new EncryptionService({ key: testKey, enabled: false });
      const result = await service.encrypt("sensitive data");
      expect(result).toBe("sensitive data");
    });

    it("should throw EncryptionError when Web Crypto API is not available", async () => {
      // Save original crypto
      const originalCrypto = global.crypto;

      // @ts-expect-error - intentionally deleting global.crypto to test error handling
      delete global.crypto;

      const service = new EncryptionService({ key: testKey, enabled: true });
      await expect(service.encrypt("test")).rejects.toThrow(EncryptionError);

      // Restore
      global.crypto = originalCrypto;
    });
  });

  describe("decrypt", () => {
    const testKey = "dGVzdGtleTMyYnl0ZXNsb25ndGhlcnRoYW5kb3RoZXJieXRlcw==";

    it("should return ciphertext when encryption is disabled", async () => {
      const service = new EncryptionService({ key: testKey, enabled: false });
      const result = await service.decrypt("encrypted data");
      expect(result).toBe("encrypted data");
    });

    it("should return plaintext when input doesn't contain dot", async () => {
      const service = new EncryptionService({ key: testKey, enabled: true });
      const result = await service.decrypt("not-encrypted");
      expect(result).toBe("not-encrypted");
    });

    it("should throw EncryptionError when crypto not available", async () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - intentionally deleting global.crypto to test error handling
      delete global.crypto;

      const service = new EncryptionService({ key: testKey, enabled: true });
      await expect(service.decrypt("a.b")).rejects.toThrow(EncryptionError);

      global.crypto = originalCrypto;
    });
  });

  describe("generateKey", () => {
    it("should generate a valid base64 key", () => {
      const key = EncryptionService.generateKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });

    it("should throw when crypto.getRandomValues is not available", () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - intentionally deleting global.crypto to test error handling
      delete global.crypto;

      expect(() => EncryptionService.generateKey()).toThrow(EncryptionError);

      global.crypto = originalCrypto;
    });
  });
});

describe("EncryptionError", () => {
  it("should have correct name and message", () => {
    const error = new EncryptionError("test error");
    expect(error.name).toBe("EncryptionError");
    expect(error.message).toBe("test error");
  });
});

describe("defaultEncryptionConfig", () => {
  it("should have correct structure", () => {
    expect(defaultEncryptionConfig).toHaveProperty("key");
    expect(defaultEncryptionConfig).toHaveProperty("enabled");
  });
});
