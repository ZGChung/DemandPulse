import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sanitizeText } from "@/lib/validation";
import {
  requirementSubmissionSchema,
  validateRequirementSubmission,
  validateQueryParams,
} from "@/lib/validation-middleware";
import { DataCollectionFlow } from "@/services/data-collection-flow";
// DatabaseService imported dynamically to avoid Prisma client issues with SQLite

// Initialize services
const dataCollectionFlow = new DataCollectionFlow();

/**
 * Plugin endpoint for Claude Code integration with API key authentication
 * This endpoint accepts submissions from the DemandPulse Claude Code plugin
 */
export async function POST(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.PLUGIN_API_KEY;

    if (!expectedApiKey || !apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Add requirementId if missing (backward compatibility)
    const validatedBody = {
      ...body,
      requirementId: body.requirementId || randomUUID(),
    };

    // Validate against Zod schema
    let validatedData;
    try {
      validatedData = requirementSubmissionSchema.parse(validatedBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
      }
      throw error;
    }

    // Run custom validation
    const customValidation = validateRequirementSubmission(validatedData);
    if (!customValidation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: customValidation.errors },
        { status: 400 }
      );
    }

    // Sanitize text fields
    validatedData.originalRequirement = sanitizeText(validatedData.originalRequirement);
    validatedData.summarizedRequirement = sanitizeText(validatedData.summarizedRequirement);

    // Ensure consent has Date object matching types/claude-code
    const consent = {
      requirementId: validatedData.requirementId,
      consentedAt: new Date(validatedData.consent.consentedAt),
      consentOptions: validatedData.consent.consentOptions,
      userProvidedEmail: validatedData.consent.userProvidedEmail,
    };

    // Process consent and collect requirement
    const result = await dataCollectionFlow.handleUserConsent(
      validatedData.requirementId,
      validatedData.originalRequirement,
      validatedData.summarizedRequirement,
      validatedData.context,
      consent
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Consent validation failed",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // Store the requirement in the database
    let storedRequirementId: string;
    const databaseUrl = process.env.DATABASE_URL || "";

    if (databaseUrl.startsWith("file:")) {
      // SQLite database - use mock storage to avoid Prisma 7.3.0 adapter issues
      storedRequirementId = "plugin-" + randomUUID().slice(0, 8);
      console.log("[Plugin] Requirement collected with mock storage (SQLite):", {
        id: storedRequirementId,
        summary: result.collectedRequirement?.summarizedRequirement,
        consent: result.collectedRequirement?.consent.consentOptions,
        note: "Using mock storage due to SQLite adapter limitations",
      });
    } else {
      // Use real database service for PostgreSQL (dynamic import to avoid Prisma issues)
      try {
        const { DatabaseService } = await import("@/services/database-service");
        const databaseService = new DatabaseService();

        // Use a mock user ID for plugin submissions (no user session)
        const pluginUserId = "plugin-user-" + randomUUID().slice(0, 8);

        storedRequirementId = await databaseService.storeRequirement(
          result.collectedRequirement!,
          pluginUserId
        );

        // Generate embeddings if AI processing is enabled
        if (process.env.ENABLE_AI_PROCESSING === "true") {
          try {
            const { AIProcessingService } = await import("@/services/ai-processing");
            const aiProcessingService = new AIProcessingService();

            const analysis = await aiProcessingService.analyzeRequirement(
              result.collectedRequirement!.originalRequirement
            );

            if (analysis.embeddings) {
              await databaseService.updateRequirementEmbedding(
                storedRequirementId,
                analysis.embeddings
              );
              try {
                const { prisma } = await import("@/lib/prisma");
                if (prisma) {
                  const { ClusteringService } = await import("@/services/clustering-service");
                  await new ClusteringService().assignToCluster({
                    id: storedRequirementId,
                    embedding: analysis.embeddings,
                  });
                }
              } catch (clusterErr) {
                console.error("[Plugin] Assign to cluster failed (non-fatal):", clusterErr);
              }
            }
          } catch (aiError) {
            console.error("[Plugin] Failed to generate AI analysis or embeddings:", aiError);
            // Don't fail the request if AI processing fails
          }
        }

        // Log successful collection
        console.log("[Plugin] Requirement collected and stored:", {
          id: storedRequirementId,
          summary: result.collectedRequirement?.summarizedRequirement,
          consent: result.collectedRequirement?.consent.consentOptions,
        });
      } catch (error) {
        console.error("[Plugin] Failed to store requirement:", error);
        return NextResponse.json(
          {
            error: "Failed to store requirement",
            message: error instanceof Error ? error.message : "Database error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        requirementId: storedRequirementId,
        message: "Requirement successfully collected and stored via plugin",
        retentionDays: 365,
        privacyNotice: "Your requirement has been stored with the privacy controls you selected.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("[Plugin] Error processing requirement submission:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate plugin requirements for testing (optional)
 */
export async function GET(request: NextRequest) {
  // API key authentication for GET as well
  const apiKey = request.headers.get("x-api-key");
  const expectedApiKey = process.env.PLUGIN_API_KEY;

  if (!expectedApiKey || !apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Define schema for query parameters
    const pluginQuerySchema = z.object({
      count: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().min(1).max(100))
        .optional(),
    });

    // Validate query parameters
    const validationResult = validateQueryParams(searchParams, pluginQuerySchema);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.errors.map((err: z.ZodIssue) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { count = 1 } = validationResult.data;

    // Generate plugin requirements (similar to mock endpoint)
    const pluginRequirements = Array.from({ length: Math.min(Number(count), 10) }, (_, i) => {
      const templates = [
        {
          original:
            "I need to add user authentication to my Next.js app. Can you help me set up NextAuth.js with Google OAuth?",
          summary: "Add NextAuth.js authentication with Google OAuth provider",
          intent: "feature_request",
        },
        {
          original:
            "There's a bug where the API returns 500 error when the database connection times out. Need to add proper error handling and retry logic.",
          summary: "Fix database connection timeout error with retry logic",
          intent: "bug_fix",
        },
        {
          original:
            "The current dashboard is slow when loading large datasets. Can we implement virtual scrolling or pagination?",
          summary: "Optimize dashboard performance with virtual scrolling",
          intent: "improvement",
        },
      ];

      const template = templates[i % templates.length];
      const now = new Date().toISOString();

      return {
        requirementId: randomUUID(),
        originalRequirement: template.original,
        summarizedRequirement: template.summary,
        context: {
          conversationId: randomUUID(),
          workspacePath: "/Users/dev/projects/my-app",
          timestamp: now,
        },
        consent: {
          consentOptions: {
            dataCollection: true,
            contact: i % 3 === 0, // 33% chance of contact consent
            anonymization: i % 2 === 0, // 50% chance of anonymization
          },
          userProvidedEmail: i % 4 === 0 ? `user${i}@example.com` : undefined,
          consentedAt: now,
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: pluginRequirements.length,
      requirements: pluginRequirements,
      endpoint: "POST /api/plugin/requirements - Submit a requirement via plugin API",
      note: "This endpoint requires valid API key authentication",
    });
  } catch (error) {
    console.error("[Plugin] Error generating plugin requirements:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
