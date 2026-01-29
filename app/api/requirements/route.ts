import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { DataCollectionFlow } from "@/services/data-collection-flow";
import { DatabaseService } from "@/services/database-service";
import { emailService } from "@/services/email-service";

// Initialize services
const dataCollectionFlow = new DataCollectionFlow();

// Rate limiting in memory (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = env.rateLimitWindowMs();
  const maxRequests = env.rateLimitMaxRequests();

  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, reset: userLimit.resetTime };
  }

  // Increment count
  userLimit.count++;
  rateLimit.set(ip, userLimit);

  return { allowed: true, remaining: maxRequests - userLimit.count, reset: userLimit.resetTime };
}

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
    const rateLimitResult = checkRateLimit(rateLimitKey);
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

    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { requirementId, originalRequirement, summarizedRequirement, context, consent } = body;

    // Validate required fields
    if (!requirementId || !originalRequirement || !summarizedRequirement || !context || !consent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Process consent and collect requirement
    const result = await dataCollectionFlow.handleUserConsent(
      requirementId,
      originalRequirement,
      summarizedRequirement,
      context,
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
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check authentication (optional for GET)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get statistics
    const databaseService = new DatabaseService();
    const statistics = await databaseService.getStatistics();

    // Get recent requirements
    const requirements = await databaseService.getRequirementsByStatus(
      (status as any) || "PROCESSED",
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
