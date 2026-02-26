import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  validateRequirementText,
  validateConsent,
  validateConversationId,
  validateWorkspacePath,
  sanitizeText,
  ValidationError,
} from "./validation";

// Zod schemas for type-safe validation
export const claudeCodeContextSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().optional(),
  workspacePath: z.string().optional(),
  timestamp: z.string().datetime().or(z.date()),
});

export const userConsentSchema = z.object({
  requirementId: z.string().min(1, "Requirement ID is required"),
  consentedAt: z.string().datetime().or(z.date()),
  consentOptions: z.object({
    dataCollection: z.boolean(),
    contact: z.boolean(),
    anonymization: z.boolean(),
  }),
  userProvidedEmail: z.string().email().optional().or(z.literal("")),
});

export const requirementSubmissionSchema = z.object({
  requirementId: z.string().min(1, "Requirement ID is required"),
  originalRequirement: z.string().min(1, "Original requirement text is required"),
  summarizedRequirement: z.string().min(1, "Summarized requirement text is required"),
  context: claudeCodeContextSchema,
  consent: userConsentSchema,
});

// Type inference from schemas
export type RequirementSubmission = z.infer<typeof requirementSubmissionSchema>;
export type ClaudeCodeContext = z.infer<typeof claudeCodeContextSchema>;
export type UserConsent = z.infer<typeof userConsentSchema>;

/**
 * Validation middleware for Next.js route handlers
 * Validates request body against Zod schema and runs custom validation functions
 */
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  options: {
    customValidators?: Array<(data: z.infer<T>) => { valid: boolean; errors: string[] }>;
    sanitizeFields?: string[];
  } = {}
) {
  return async function validationMiddleware(
    request: NextRequest,
    next: (validatedData: z.infer<T>) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Parse and validate JSON body
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
      }

      // Validate against Zod schema
      const validatedData = schema.parse(body);

      // Run custom validation functions
      if (options.customValidators) {
        for (const validator of options.customValidators) {
          const result = validator(validatedData);
          if (!result.valid) {
            return NextResponse.json(
              { error: "Validation failed", details: result.errors },
              { status: 400 }
            );
          }
        }
      }

      // Sanitize fields if specified
      if (options.sanitizeFields) {
        const sanitizedData = Object.assign({}, validatedData) as Record<string, any>;
        for (const field of options.sanitizeFields) {
          if (field in sanitizedData && typeof sanitizedData[field] === "string") {
            sanitizedData[field] = sanitizeText(sanitizedData[field]);
          }
        }
        return next(sanitizedData as any);
      }

      return next(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
      }

      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: "Validation failed", message: error.message },
          { status: 400 }
        );
      }

      console.error("Validation middleware error:", error);
      return NextResponse.json({ error: "Internal validation error" }, { status: 500 });
    }
  };
}

/**
 * Custom validator for requirement submission
 * Integrates existing validation utilities
 */
export function validateRequirementSubmission(data: RequirementSubmission): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate requirement text using existing utility
  const textValidation = validateRequirementText(data.originalRequirement);
  if (!textValidation.valid) {
    errors.push(...textValidation.errors);
  }

  // Validate summarized requirement text
  const summaryValidation = validateRequirementText(data.summarizedRequirement);
  if (!summaryValidation.valid) {
    errors.push(...summaryValidation.errors.map((err) => `Summary: ${err}`));
  }

  // Validate conversation ID
  if (!validateConversationId(data.context.conversationId)) {
    errors.push("Invalid conversation ID format");
  }

  // Validate workspace path if provided
  if (data.context.workspacePath && !validateWorkspacePath(data.context.workspacePath)) {
    errors.push("Invalid workspace path");
  }

  // Validate consent using existing utility
  const consentValidation = validateConsent(data.consent);
  if (!consentValidation.valid) {
    errors.push(...consentValidation.errors);
  }

  // Additional validation: If contact consent is true, email should be provided and valid
  if (data.consent.consentOptions.contact && !data.consent.userProvidedEmail) {
    errors.push("Email is required when contact consent is given");
  }

  // If anonymization is true, email should not be provided
  if (data.consent.consentOptions.anonymization && data.consent.userProvidedEmail) {
    errors.push("Email cannot be provided when anonymization consent is given");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Pre-configured validation middleware for requirement submissions
 */
export const validateRequirementRequest = withValidation(requirementSubmissionSchema, {
  customValidators: [validateRequirementSubmission],
  sanitizeFields: ["originalRequirement", "summarizedRequirement"],
});

/**
 * Standalone validation function for requirement submission requests
 * Returns validated data or throws ValidationError
 */
export async function validateRequirementBody(request: Request): Promise<RequirementSubmission> {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }

  // Validate against Zod schema
  const validatedData = requirementSubmissionSchema.parse(body);

  // Run custom validation
  const customValidation = validateRequirementSubmission(validatedData);
  if (!customValidation.valid) {
    throw new ValidationError(`Validation failed: ${customValidation.errors.join(", ")}`);
  }

  // Sanitize text fields
  const sanitizedData = { ...validatedData };
  sanitizedData.originalRequirement = sanitizeText(sanitizedData.originalRequirement);
  sanitizedData.summarizedRequirement = sanitizeText(sanitizedData.summarizedRequirement);

  return sanitizedData;
}

/**
 * Utility function to validate query parameters
 */
export function validateQueryParams<T extends Record<string, unknown>>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError["issues"] } {
  const params = Object.fromEntries(searchParams.entries());

  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues };
    }
    throw error;
  }
}

// Query parameter schemas
export const requirementQuerySchema = z.object({
  status: z.enum(["pending", "processed", "rejected"]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
  sort: z.enum(["recent", "priority"]).optional(),
});

export type RequirementQueryParams = z.infer<typeof requirementQuerySchema>;
