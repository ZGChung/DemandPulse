import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { ValidationError } from "@/lib/validation";

// Validation schemas
const privacyRequestQuerySchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  entityType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("50"),
});

const updatePrivacyRequestSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  notes: z.string().optional(),
});

// Helper to check admin access
async function requireAdminAccess(session: Session) {
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
}

// Helper for rate limiting
async function checkRateLimit(session: Session, request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `admin:privacy-requests:${session.user.id}:${ip}`;

  try {
    const rateLimitResult = await defaultRateLimiter.checkAndIncrement(rateLimitKey);
    if (!rateLimitResult.allowed) {
      throw new Error("Rate limit exceeded");
    }
    return rateLimitResult;
  } catch (rateLimitError) {
    console.error("Rate limiting error:", rateLimitError);
    // Fail open for admin endpoints
    return {
      allowed: true,
      remaining: env.rateLimitMaxRequests() - 1,
      reset: Date.now() + env.rateLimitWindowMs(),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!prisma) throw new Error("Database not available");
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = privacyRequestQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      throw new ValidationError("Invalid query parameters", validationResult.error.issues);
    }

    const {
      status,
      entityType,
      startDate,
      endDate,
      page: pageStr,
      limit: limitStr,
    } = validationResult.data;

    const page = parseInt(pageStr);
    const limit = parseInt(limitStr);
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (entityType) whereClause.entityType = entityType;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Fetch privacy requests with pagination
    const [privacyRequests, totalCount] = await Promise.all([
      prisma.dataDeletionQueue.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.dataDeletionQueue.count({ where: whereClause }),
    ]);

    const sanitizedRequests = privacyRequests.map((request) => ({ ...request }));

    return NextResponse.json({
      success: true,
      data: {
        privacyRequests: sanitizedRequests,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin privacy-requests GET error", { error: (error as Error).message });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.details },
        { status: 400 }
      );
    }
    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch privacy requests" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!prisma) throw new Error("Database not available");
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    const body = await request.json();
    const validationResult = updatePrivacyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid request body", validationResult.error.issues);
    }

    const { status, notes } = validationResult.data;
    const url = new URL(request.url);
    const requestId = url.searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ error: "requestId query parameter is required" }, { status: 400 });
    }

    // Update privacy request
    const updatedRequest = await prisma.dataDeletionQueue.update({
      where: { id: requestId },
      data: {
        status,
        ...(notes && { notes }),
        processedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
      },
    });

    // Log the action
    await prisma.privacyAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "DataDeletionQueue",
        entityId: requestId,
        actorType: "ADMIN",
        actorId: session!.user.id,
        changes: { status, notes },
        reason: `Privacy request ${requestId} status updated to ${status} by admin ${session!.user.email}`,
      },
    });

    apiLogger.info("Privacy request updated", {
      adminId: session!.user.id,
      requestId,
      newStatus: status,
    });

    return NextResponse.json({
      success: true,
      data: {
        privacyRequest: updatedRequest,
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin privacy-requests PATCH error", { error: (error as Error).message });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.details },
        { status: 400 }
      );
    }
    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Privacy request not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update privacy request" }, { status: 500 });
  }
}
