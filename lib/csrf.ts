import { randomBytes, createHmac, timingSafeEqual } from "crypto";

export interface CSRFTokenPair {
  token: string;
  signedToken: string;
}

export interface CSRFConfig {
  secret: string;
  cookieName?: string;
  headerName?: string;
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
export function generateToken(config: CSRFConfig = defaultConfig): CSRFTokenPair {
  const token = randomBytes(32).toString("hex");
  const signedToken = createHmac("sha256", config.secret).update(token).digest("hex");

  return { token, signedToken };
}

/**
 * Verify a CSRF token against the signed token
 */
export function verifyToken(
  token: string,
  signedToken: string,
  config: CSRFConfig = defaultConfig
): boolean {
  try {
    const expectedSignedToken = createHmac("sha256", config.secret).update(token).digest("hex");
    return timingSafeEqual(
      Buffer.from(signedToken, "hex"),
      Buffer.from(expectedSignedToken, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Middleware to generate and set CSRF token cookie
 * Call this in middleware or API routes that need CSRF protection
 */
export function setCSRFTokenCookie(
  response: Response,
  config: CSRFConfig = defaultConfig
): CSRFTokenPair {
  const { token, signedToken } = generateToken(config);

  const cookieValue = `${token}:${signedToken}`;
  const cookieOptions = config.cookieOptions || defaultConfig.cookieOptions;

  const cookieParts = [
    `${config.cookieName}=${encodeURIComponent(cookieValue)}`,
    cookieOptions.httpOnly ? "HttpOnly" : "",
    cookieOptions.secure ? "Secure" : "",
    `SameSite=${cookieOptions.sameSite}`,
    `Path=${cookieOptions.path}`,
    `Max-Age=${cookieOptions.maxAge}`,
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
export function validateCSRFToken(
  request: Request,
  config: CSRFConfig = defaultConfig
): { valid: boolean; error?: string } {
  // Skip validation for safe methods (GET, HEAD, OPTIONS)
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Get token from header
  const headerToken = request.headers.get(config.headerName);
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

  const cookieValue = cookies[config.cookieName];
  if (!cookieValue) {
    return { valid: false, error: "CSRF cookie not found" };
  }

  // Parse cookie value (token:signedToken)
  const [cookieToken, signedToken] = cookieValue.split(":");
  if (!cookieToken || !signedToken) {
    return { valid: false, error: "Invalid CSRF cookie format" };
  }

  // Verify the token from header matches cookie token
  if (!timingSafeEqual(Buffer.from(headerToken, "hex"), Buffer.from(cookieToken, "hex"))) {
    return { valid: false, error: "CSRF token mismatch" };
  }

  // Verify signed token
  if (!verifyToken(cookieToken, signedToken, config)) {
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

  const cookieValue = cookies[config.cookieName];
  if (!cookieValue) return null;

  const [token, signedToken] = cookieValue.split(":");
  if (!token || !signedToken) return null;

  return { token, signedToken };
}
