// Use Web Crypto API for Edge Runtime compatibility
// Fallback to Node.js crypto for Node runtime

// Helper functions
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface CryptoInterface {
  randomBytes(size: number): Uint8Array;
  createHmac(
    algorithm: string,
    secret: string
  ): {
    update(data: string): { digest(encoding: string): Promise<string> };
  };
  timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

// Detect runtime and provide appropriate crypto implementation
let cryptoImpl: CryptoInterface;

if (typeof crypto !== "undefined" && crypto.subtle) {
  // Web Crypto API (Edge Runtime, Browser)
  cryptoImpl = {
    randomBytes(size: number): Uint8Array {
      const array = new Uint8Array(size);
      crypto.getRandomValues(array);
      return array;
    },

    createHmac(algorithm: string, secret: string) {
      // Web Crypto uses subtle crypto for HMAC
      const encoder = new TextEncoder();
      // Import key once and reuse
      let keyPromise: Promise<CryptoKey> | null = null;
      const getKey = async () => {
        if (!keyPromise) {
          keyPromise = crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: algorithm === "sha256" ? "SHA-256" : "SHA-1" },
            false,
            ["sign"]
          );
        }
        return keyPromise;
      };

      return {
        update(data: string) {
          return {
            async digest(_encoding: string): Promise<string> {
              const key = await getKey();
              const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
              const hashArray = new Uint8Array(signature);
              return uint8ArrayToHex(hashArray);
            },
          };
        },
      };
    },

    timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
      // Constant-time comparison for Web Crypto
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    },
  };
} else {
  // Node.js crypto module
  try {
    const nodeCrypto = require("crypto");
    cryptoImpl = {
      randomBytes: nodeCrypto.randomBytes,
      createHmac(algorithm: string, secret: string) {
        const hmac = nodeCrypto.createHmac(algorithm, secret);
        return {
          update(data: string) {
            hmac.update(data);
            return {
              async digest(encoding: string): Promise<string> {
                return Promise.resolve(hmac.digest(encoding));
              },
            };
          },
        };
      },
      timingSafeEqual: nodeCrypto.timingSafeEqual,
    };
  } catch {
    throw new Error("No crypto implementation available");
  }
}

export interface CSRFTokenPair {
  token: string;
  signedToken: string;
}

export interface CSRFConfig {
  secret: string;
  cookieName: string;
  headerName: string;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    path?: string;
    maxAge?: number;
  };
}

export class CSRFTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CSRFTokenError";
  }
}

/**
 * Default CSRF configuration
 */
const defaultConfig: CSRFConfig = {
  secret:
    process.env.CSRF_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "default-csrf-secret-change-in-production",
  cookieName: "csrf-token",
  headerName: "X-CSRF-Token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

/**
 * Generate a CSRF token pair (token + signed token)
 */
export async function generateToken(config: CSRFConfig = defaultConfig): Promise<CSRFTokenPair> {
  const tokenBytes = cryptoImpl.randomBytes(32);
  const token = uint8ArrayToHex(tokenBytes);
  const hmac = cryptoImpl.createHmac("sha256", config.secret);
  const signedToken = await hmac.update(token).digest("hex");
  return { token, signedToken };
}

/**
 * Verify a CSRF token against the signed token
 */
export async function verifyToken(
  token: string,
  signedToken: string,
  config: CSRFConfig = defaultConfig
): Promise<boolean> {
  try {
    const hmac = cryptoImpl.createHmac("sha256", config.secret);
    const expectedSignedToken = await hmac.update(token).digest("hex");
    const signedTokenBytes = hexToUint8Array(signedToken);
    const expectedSignedTokenBytes = hexToUint8Array(expectedSignedToken);
    return cryptoImpl.timingSafeEqual(signedTokenBytes, expectedSignedTokenBytes);
  } catch {
    return false;
  }
}

/**
 * Middleware to generate and set CSRF token cookie
 * Call this in middleware or API routes that need CSRF protection
 */
export async function setCSRFTokenCookie(
  response: Response,
  config: CSRFConfig = defaultConfig
): Promise<CSRFTokenPair> {
  const { token, signedToken } = await generateToken(config);

  const cookieValue = `${token}:${signedToken}`;
  const cookieOptions = config.cookieOptions || defaultConfig.cookieOptions!;
  const cookieName = config.cookieName || defaultConfig.cookieName!;

  const cookieParts = [
    `${cookieName}=${encodeURIComponent(cookieValue)}`,
    cookieOptions.httpOnly! ? "HttpOnly" : "",
    cookieOptions.secure! ? "Secure" : "",
    `SameSite=${cookieOptions.sameSite!}`,
    `Path=${cookieOptions.path!}`,
    `Max-Age=${cookieOptions.maxAge!}`,
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.append("Set-Cookie", cookieParts);

  return { token, signedToken };
}

/**
 * Middleware to validate CSRF token from request
 * Expects token in header and signed token in cookie
 */
export async function validateCSRFToken(
  request: Request,
  config: CSRFConfig = defaultConfig
): Promise<{ valid: boolean; error?: string }> {
  // Skip validation for safe methods (GET, HEAD, OPTIONS)
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Get token from header
  const headerName = config.headerName || defaultConfig.headerName!;
  const headerToken = request.headers.get(headerName);
  if (!headerToken) {
    return { valid: false, error: "CSRF token missing from header" };
  }

  // Get cookie value
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return { valid: false, error: "CSRF cookie missing" };
  }

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>
  );

  const cookieName = config.cookieName || defaultConfig.cookieName!;
  const cookieValue = cookies[cookieName];
  if (!cookieValue) {
    return { valid: false, error: "CSRF cookie not found" };
  }

  // Parse cookie value (token:signedToken)
  const [cookieToken, signedToken] = cookieValue.split(":");
  if (!cookieToken || !signedToken) {
    return { valid: false, error: "Invalid CSRF cookie format" };
  }

  // Verify the token from header matches cookie token
  const headerTokenBytes = hexToUint8Array(headerToken);
  const cookieTokenBytes = hexToUint8Array(cookieToken);
  if (!cryptoImpl.timingSafeEqual(headerTokenBytes, cookieTokenBytes)) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  // Verify signed token
  if (!(await verifyToken(cookieToken, signedToken, config))) {
    return { valid: false, error: "Invalid CSRF token signature" };
  }

  return { valid: true };
}

/**
 * Utility to get CSRF token from request
 */
export function getCSRFTokenFromRequest(
  request: Request,
  config: CSRFConfig = defaultConfig
): { token: string; signedToken: string } | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>
  );

  const cookieName = config.cookieName || defaultConfig.cookieName!;
  const cookieValue = cookies[cookieName];
  if (!cookieValue) return null;

  const [token, signedToken] = cookieValue.split(":");
  if (!token || !signedToken) return null;

  return { token, signedToken };
}
