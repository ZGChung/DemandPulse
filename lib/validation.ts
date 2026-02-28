// Input validation utilities for security

/**
 * Error details interface for ValidationError
 */
interface ValidationErrorDetails {
  field?: string;
  value?: unknown;
  [key: string]: unknown;
}

export class ValidationError extends Error {
  details?: ValidationErrorDetails;

  constructor(message: string, details?: ValidationErrorDetails) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate requirement text (basic checks)
 */
export function validateRequirementText(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push("Requirement text cannot be empty");
  }

  if (text.length > 10000) {
    errors.push("Requirement text too long (max 10000 characters)");
  }

  // Check for potential XSS attempts
  const xssPatterns = [
    /<script.*?>.*?<\/script>/gi,
    /javascript:/gi,
    /onclick=/gi,
    /onload=/gi,
    /onerror=/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      errors.push("Potential security issue detected in requirement text");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate conversation ID format
 */
export function validateConversationId(id: string): boolean {
  if (!id) return false;
  // Allow alphanumeric, hyphens, underscores
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id);
}

/**
 * Validate workspace path (basic checks)
 */
export function validateWorkspacePath(path: string | undefined): boolean {
  if (!path) return true; // Optional

  // Check for path traversal attempts
  const traversalPatterns = [/\.\.\//, /\.\.\\/, /\/\/\//, /\\\.\./];

  for (const pattern of traversalPatterns) {
    if (pattern.test(path)) {
      return false;
    }
  }

  return path.length <= 500; // Reasonable length limit
}

/**
 * Sanitize input text (basic sanitization)
 */
export function sanitizeText(text: string): string {
  if (!text) return "";

  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, "");

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
}

/**
 * Consent object structure
 */
interface ConsentObject {
  consentOptions?: {
    analytics?: boolean;
    improvements?: boolean;
    [key: string]: unknown;
  };
  userProvidedEmail?: string;
  consentedAt?: string;
  [key: string]: unknown;
}

/**
 * Validate consent object structure
 */
export function validateConsent(consent: ConsentObject): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!consent || typeof consent !== "object") {
    errors.push("Consent object is required");
    return { valid: false, errors };
  }

  const { consentOptions, userProvidedEmail, consentedAt } = consent;

  if (!consentOptions || typeof consentOptions !== "object") {
    errors.push("consentOptions is required");
  } else {
    const { dataCollection, contact, anonymization } = consentOptions;

    if (typeof dataCollection !== "boolean") {
      errors.push("dataCollection must be a boolean");
    }

    if (typeof contact !== "boolean") {
      errors.push("contact must be a boolean");
    }

    if (typeof anonymization !== "boolean") {
      errors.push("anonymization must be a boolean");
    }

    // If contact is true, email should be provided and valid
    if (contact === true && userProvidedEmail) {
      if (!validateEmail(userProvidedEmail)) {
        errors.push("Valid email is required when contact consent is given");
      }
    }

    // If anonymization is true, email should not be provided
    if (anonymization === true && userProvidedEmail) {
      errors.push("Email cannot be provided when anonymization consent is given");
    }
  }

  if (!consentedAt || isNaN(Date.parse(consentedAt))) {
    errors.push("Valid consentedAt timestamp is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
