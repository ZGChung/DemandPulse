import { RequirementStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { ValidationError } from "@/lib/validation";
import {
  validateRequirementBody,
  RequirementSubmission,
  validateQueryParams,
  requirementQuerySchema,
} from "@/lib/validation-middleware";
import { AIProcessingService } from "@/services/ai-processing";
import { ClusteringService } from "@/services/clustering-service";
import { DataCollectionFlow } from "@/services/data-collection-flow";
import { DatabaseService } from "@/services/database-service";
import { emailService } from "@/services/email-service";

// Initialize services
const dataCollectionFlow = new DataCollectionFlow();

// Rate limiting handled by Redis-based rate limiter (lib/rate-limiter.ts)
// Falls back to in-memory when Redis is not available

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get client IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Check rate limit (per user)
    const rateLimitKey = `${session.user.id}:${ip}`;
    let rateLimitResult;
    try {
      rateLimitResult = await defaultRateLimiter.checkAndIncrement(rateLimitKey);
    } catch (rateLimitError) {
      console.error("Rate limiting error, allowing request:", rateLimitError);
      // Fail open: if rate limiting fails, allow the request
      rateLimitResult = {
        allowed: true,
        remaining: env.rateLimitMaxRequests() - 1,
        reset: Date.now() + env.rateLimitWindowMs(),
      };
    }

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": env.rateLimitMaxRequests().toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Validate request body using validation middleware
    let validatedData: RequirementSubmission;
    try {
      validatedData = await validateRequirementBody(request);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        return NextResponse.json(
          { error: "Validation failed", message: validationError.message },
          { status: 400 }
        );
      }
      // Handle Zod validation errors
      if (validationError instanceof z.ZodError) {
        const errors = validationError.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
      }
      // Re-throw unexpected errors
      throw validationError;
    }

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
    const databaseService = new DatabaseService();
    const aiProcessingService = new AIProcessingService();
    let storedRequirementId: string;
    try {
      storedRequirementId = await databaseService.storeRequirement(
        result.collectedRequirement!,
        session.user.id
      );

      // Log successful collection
      console.log("Requirement collected and stored:", {
        id: storedRequirementId,
        summary: result.collectedRequirement?.summarizedRequirement,
        consent: result.collectedRequirement?.consent.consentOptions,
      });

      // Generate AI analysis and embeddings for the requirement
      try {
        const analysis = await aiProcessingService.analyzeRequirement(
          result.collectedRequirement!.originalRequirement
        );
        if (analysis.embeddings) {
          await databaseService.updateRequirementEmbedding(
            storedRequirementId,
            analysis.embeddings
          );
          if (prisma) {
            try {
              const clusteringService = new ClusteringService();
              await clusteringService.assignToCluster({
                id: storedRequirementId,
                embedding: analysis.embeddings,
              });
            } catch (clusterErr) {
              console.error("Assign to cluster failed (non-fatal):", clusterErr);
            }
          }
        }
      } catch (aiError) {
        console.error("Failed to generate AI analysis or embeddings:", aiError);
        // Don't fail the request if AI processing fails
      }

      // Send email notification if user has email and consented to contact
      if (session.user?.email && result.collectedRequirement?.consent.consentOptions?.contact) {
        try {
          await emailService.sendRequirementSubmittedEmail(
            {
              email: session.user.email,
              name: session.user.name || undefined,
              userId: session.user.id,
            },
            result.collectedRequirement.summarizedRequirement
          );
          console.log("Requirement submitted email sent to:", session.user.email);
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the request if email fails
        }
      }
    } catch (error) {
      console.error("Failed to store requirement:", error);
      return NextResponse.json(
        {
          error: "Failed to store requirement",
          message: error instanceof Error ? error.message : "Database error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        requirementId: storedRequirementId,
        message: "Requirement successfully collected and stored",
        retentionDays: 365, // Default retention period
        privacyNotice: "Your requirement has been stored with the privacy controls you selected.",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": env.rateLimitMaxRequests().toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(rateLimitResult.reset / 1000).toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error processing requirement submission:", error);

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
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validationResult = validateQueryParams(searchParams, requirementQuerySchema);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { status, limit = 50, offset = 0 } = validationResult.data;

    // Check authentication (optional for GET)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get statistics
    const databaseService = new DatabaseService();
    const statistics = await databaseService.getStatistics();

    // Get recent requirements
    const mappedStatus = status ? (status.toUpperCase() as RequirementStatus) : "PROCESSED";
    const requirements = await databaseService.getRequirementsByStatus(
      mappedStatus,
      Math.min(limit, 100), // Cap at 100 for performance
      userId // Optional user filter
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics,
          requirements: requirements.slice(offset, offset + limit),
          pagination: {
            total: requirements.length,
            limit,
            offset,
            hasMore: offset + limit < requirements.length,
          },
        },
        endpoints: {
          POST: "/api/requirements - Submit a new requirement",
          GET: "/api/requirements - Get requirements (optional query: status, limit, offset)",
        },
        rateLimit: {
          maxRequests: env.rateLimitMaxRequests(),
          windowMs: env.rateLimitWindowMs(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching requirements:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch requirements",
        message: error instanceof Error ? error.message : "Database error",
      },
      { status: 500 }
    );
  }
}
