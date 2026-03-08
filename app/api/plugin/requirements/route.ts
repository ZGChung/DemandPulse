import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { apiLogger } from "@/lib/logger";
import { RateLimiter } from "@/lib/rate-limiter";
import { sanitizeText } from "@/lib/validation";
import {
  requirementSubmissionSchema,
  validateRequirementSubmission,
  validateQueryParams,
} from "@/lib/validation-middleware";
import { DataCollectionFlow } from "@/services/data-collection-flow";

const dataCollectionFlow = new DataCollectionFlow();

// Stricter rate limiter for anonymous community submissions (10 req / hour / IP)
const communityRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  keyPrefix: "plugin-community:",
});

/**
 * Determine auth mode:
 * - "apikey" if valid x-api-key is provided (trusted integrations)
 * - "community" if no key (public plugin submissions, rate-limited)
 */
function getAuthMode(request: NextRequest): "apikey" | "community" {
  const apiKey = request.headers.get("x-api-key");
  const expectedApiKey = process.env.PLUGIN_API_KEY;
  if (expectedApiKey && apiKey && apiKey === expectedApiKey) return "apikey";
  return "community";
}

export async function POST(request: NextRequest) {
  try {
    const authMode = getAuthMode(request);

    // Rate limit community (anonymous) submissions
    if (authMode === "community") {
      const ip =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      try {
        const rl = await communityRateLimiter.checkAndIncrement(`community:${ip}`);
        if (!rl.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded. Try again later.",
              retryAfter: Math.ceil((rl.reset - Date.now()) / 1000),
            },
            {
              status: 429,
              headers: {
                "Retry-After": Math.ceil((rl.reset - Date.now()) / 1000).toString(),
              },
            }
          );
        }
      } catch {
        // Fail open — allow the request if rate limiter errors
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validatedBody = {
      ...body,
      requirementId: body.requirementId || randomUUID(),
    };

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

    const customValidation = validateRequirementSubmission(validatedData);
    if (!customValidation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: customValidation.errors },
        { status: 400 }
      );
    }

    validatedData.originalRequirement = sanitizeText(validatedData.originalRequirement);
    validatedData.summarizedRequirement = sanitizeText(validatedData.summarizedRequirement);

    const consent = {
      requirementId: validatedData.requirementId,
      consentedAt: new Date(validatedData.consent.consentedAt),
      consentOptions: validatedData.consent.consentOptions,
      userProvidedEmail: validatedData.consent.userProvidedEmail,
    };

    const result = await dataCollectionFlow.handleUserConsent(
      validatedData.requirementId,
      validatedData.originalRequirement,
      validatedData.summarizedRequirement,
      validatedData.context,
      consent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Consent validation failed", details: result.errors },
        { status: 400 }
      );
    }

    const rawAccount = validatedData.demandpulseAccount?.trim();
    const demandpulseAccount =
      rawAccount && rawAccount.length > 0 ? rawAccount.toLowerCase() : null;

    let linkedUserId: string | null = null;
    if (demandpulseAccount) {
      try {
        const { prisma } = await import("@/lib/prisma");
        if (prisma) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: demandpulseAccount, mode: "insensitive" } },
                { name: { equals: demandpulseAccount, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          if (user) linkedUserId = user.id;
        }
      } catch (err) {
        apiLogger.warn("[Plugin] demandpulseAccount lookup failed", {
          error: (err as Error).message,
        });
      }
    }

    let storedRequirementId: string;
    const databaseUrl = process.env.DATABASE_URL || "";
    const source = authMode === "community" ? "community-plugin" : "api-key";

    if (databaseUrl.startsWith("file:")) {
      storedRequirementId = "plugin-" + randomUUID().slice(0, 8);
      apiLogger.info("[Plugin] Requirement collected (SQLite mock)", {
        id: storedRequirementId,
        source,
        linkedUserId: linkedUserId ?? undefined,
      });
    } else {
      try {
        const { DatabaseService } = await import("@/services/database-service");
        const databaseService = new DatabaseService();
        const pluginUserId = linkedUserId ?? "plugin-user-" + randomUUID().slice(0, 8);

        storedRequirementId = await databaseService.storeRequirement(
          result.collectedRequirement!,
          pluginUserId
        );

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
                apiLogger.warn("[Plugin] Cluster assignment failed (non-fatal)", {
                  error: (clusterErr as Error).message,
                });
              }
            }
          } catch (aiError) {
            apiLogger.warn("[Plugin] AI processing failed (non-fatal)", {
              error: (aiError as Error).message,
            });
          }
        }

        apiLogger.info("[Plugin] Requirement stored", {
          id: storedRequirementId,
          source,
          linkedUserId: linkedUserId ?? undefined,
        });
      } catch (error) {
        apiLogger.error("[Plugin] Failed to store requirement", {
          error: (error as Error).message,
        });
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
        message: "Requirement collected and stored",
        source,
        trendsUrl: "https://demand-pulse.vercel.app/trends",
      },
      { status: 201 }
    );
  } catch (error) {
    apiLogger.error("[Plugin] Error processing submission", {
      error: (error as Error).message,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authMode = getAuthMode(request);
  if (authMode !== "apikey") {
    return NextResponse.json({ error: "API key required for GET" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pluginQuerySchema = z.object({
      count: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().min(1).max(100))
        .optional(),
    });

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
    const templates = [
      {
        original: "I need to add user authentication to my Next.js app with Google OAuth.",
        summary: "Add NextAuth.js authentication with Google OAuth provider",
      },
      {
        original: "There's a bug where the API returns 500 on database timeout. Need retry logic.",
        summary: "Fix database connection timeout error with retry logic",
      },
      {
        original: "The dashboard is slow with large datasets. Can we implement virtual scrolling?",
        summary: "Optimize dashboard performance with virtual scrolling",
      },
    ];

    const pluginRequirements = Array.from({ length: Math.min(Number(count), 10) }, (_, i) => {
      const t = templates[i % templates.length];
      const now = new Date().toISOString();
      return {
        requirementId: randomUUID(),
        originalRequirement: t.original,
        summarizedRequirement: t.summary,
        context: {
          conversationId: randomUUID(),
          workspacePath: "/Users/dev/projects/my-app",
          timestamp: now,
        },
        consent: {
          consentOptions: { dataCollection: true, contact: false, anonymization: true },
          consentedAt: now,
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: pluginRequirements.length,
      requirements: pluginRequirements,
      endpoint: "POST /api/plugin/requirements",
    });
  } catch (error) {
    apiLogger.error("[Plugin] Error generating requirements", { error: (error as Error).message });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
