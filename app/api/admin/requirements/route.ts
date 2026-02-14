import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { RequirementStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { env } from "@/lib/env";
import { DatabaseService } from "@/services/database-service";
import { apiLogger } from "@/lib/logger";
import { ValidationError } from "@/lib/validation";

// Validation schemas
const updateRequirementStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "PROCESSED", "CLUSTERED", "REJECTED", "DELETED"]),
});

// Helper to check admin access
async function requireAdminAccess(session: any) {
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
}

// Helper for rate limiting
async function checkRateLimit(session: any, request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `admin:requirements:${session.user.id}:${ip}`;

  try {
    const rateLimitResult = await defaultRateLimiter.checkAndIncrement(rateLimitKey);
    if (!rateLimitResult.allowed) {
      throw new Error("Rate limit exceeded");
    }
    return rateLimitResult;
  } catch (rateLimitError) {
    console.error("Rate limiting error:", rateLimitError);
    // Fail open for admin endpoints
    return { allowed: true, remaining: env.rateLimitMaxRequests() - 1, reset: Date.now() + env.rateLimitWindowMs() };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as RequirementStatus | undefined;
    const userId = url.searchParams.get("userId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const databaseService = new DatabaseService();

    // Fetch requirements and count in parallel
    const [requirements, totalCount] = await Promise.all([
      databaseService.getRequirementsForAdmin(
        { status, limit, offset, userId: userId || undefined },
        "ADMIN"
      ),
      databaseService.getRequirementsCountForAdmin({ status, userId: userId || undefined }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        requirements,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    apiLogger.error("Admin requirements GET error", { error: error.message });

    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    const body = await request.json();

    // Validate request body
    const validationResult = updateRequirementStatusSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError("Invalid request body", validationResult.error.errors);
    }

    const { status } = validationResult.data;
    const url = new URL(request.url);
    const requirementId = url.searchParams.get("requirementId");

    if (!requirementId) {
      return NextResponse.json({ error: "requirementId query parameter is required" }, { status: 400 });
    }

    const databaseService = new DatabaseService();

    // In a real implementation, we would update the requirement status in the database
    // For now, we'll log the action and return success
    // TODO: Implement actual requirement status update in DatabaseService

    apiLogger.info("Requirement status update requested", {
      adminId: session.user.id,
      requirementId,
      newStatus: status,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Requirement status would be updated to ${status}`,
        requirementId,
        status,
      },
    });
  } catch (error: any) {
    apiLogger.error("Admin requirements PATCH error", { error: error.message });

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Validation failed", details: error.details }, { status: 400 });
    }
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 });
  }
}