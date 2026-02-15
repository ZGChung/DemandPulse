// Field-level encryption for sensitive data
// Uses Web Crypto API for Edge Runtime compatibility with fallback to Node.js crypto
// Supports AES-GCM encryption with random IV

export interface EncryptionConfig {
  key: string; // Base64-encoded encryption key (must be 256-bit for AES-GCM)
  enabled: boolean;
}

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionError";
  }
}

/**
 * Encryption service for field-level data protection
 */
export class EncryptionService {
  private config: EncryptionConfig;
  private cryptoKey: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;

  constructor(config: EncryptionConfig) {
    this.config = config;
  }

  /**
   * Check if encryption is enabled and key is available
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.key;
  }

  /**
   * Get or create the CryptoKey instance
   */
  private async getKey(): Promise<CryptoKey> {
    if (!this.isEnabled()) {
      throw new EncryptionError("Encryption is not enabled");
    }

    // Return cached key if available
    if (this.cryptoKey) {
      return this.cryptoKey;
    }

    // Ensure only one key initialization happens at a time
    if (!this.keyPromise) {
      this.keyPromise = this.importKey();
    }

    try {
      this.cryptoKey = await this.keyPromise;
      return this.cryptoKey;
    } catch (error) {
      this.keyPromise = null;
      throw new EncryptionError(
        `Failed to initialize encryption key: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Import the base64-encoded key as a CryptoKey
   */
  private async importKey(): Promise<CryptoKey> {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new EncryptionError("Web Crypto API not available");
    }

    try {
      // Decode base64 key to ArrayBuffer
      const keyBytes = Uint8Array.from(atob(this.config.key), (c) => c.charCodeAt(0));

      return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
      ]);
    } catch (error) {
      throw new EncryptionError(
        `Failed to import encryption key: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  private generateIV(): Uint8Array {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new EncryptionError("Crypto.getRandomValues not available");
    }
    const iv = new Uint8Array(12); // 96-bit IV recommended for AES-GCM
    crypto.getRandomValues(iv);
    return iv;
  }

  /**
   * Encrypt a plaintext string
   * Returns base64-encoded string format: iv.ciphertext.tag
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!this.isEnabled()) {
      return plaintext; // Return plaintext if encryption disabled
    }

    try {
      const key = await this.getKey();
      const iv = this.generateIV();
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv as unknown as BufferSource,
        },
        key,
        data
      );

      // Combine IV, ciphertext, and authentication tag (AES-GCM includes tag)
      const ivArray = Array.from(iv);
      const ciphertextArray = Array.from(new Uint8Array(ciphertext));

      // Format: iv.base64.ciphertext.base64
      const ivBase64 = btoa(String.fromCharCode(...ivArray));
      const ciphertextBase64 = btoa(String.fromCharCode(...ciphertextArray));

      return `${ivBase64}.${ciphertextBase64}`;
    } catch (error) {
      throw new EncryptionError(
        `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Decrypt a ciphertext string
   * Expects format: iv.ciphertext.tag
   */
  async decrypt(ciphertext: string): Promise<string> {
    if (!this.isEnabled()) {
      return ciphertext; // Assume plaintext if encryption disabled
    }

    // Check if the string is in encrypted format (contains dot)
    if (!ciphertext.includes(".")) {
      // Not encrypted, return as-is (for backward compatibility)
      return ciphertext;
    }

    try {
      const key = await this.getKey();
      const [ivBase64, ciphertextBase64] = ciphertext.split(".");

      const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
      const ciphertextBytes = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));

      const plaintext = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        ciphertextBytes
      );

      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    } catch (error) {
      throw new EncryptionError(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Encrypt a JSON-serializable object
   */
  async encryptJSON<T>(data: T): Promise<string> {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt a JSON-encrypted string
   */
  async decryptJSON<T>(ciphertext: string): Promise<T> {
    const jsonString = await this.decrypt(ciphertext);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Generate a random encryption key (base64 encoded)
   * Useful for generating initial key
   */
  static generateKey(): string {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new EncryptionError("Crypto.getRandomValues not available");
    }
    const keyBytes = new Uint8Array(32); // 256-bit key
    crypto.getRandomValues(keyBytes);
    return btoa(String.fromCharCode(...Array.from(keyBytes)));
  }
}

/**
 * Default encryption configuration from environment variables
 */
export const defaultEncryptionConfig: EncryptionConfig = {
  key: process.env.ENCRYPTION_KEY || "",
  enabled: process.env.ENCRYPTION_ENABLED === "true",
};

/**
 * Singleton encryption service instance
 */
export const encryptionService = new EncryptionService(defaultEncryptionConfig);
