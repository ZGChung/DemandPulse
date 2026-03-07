import { Prisma } from "@prisma/client";
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
const auditLogQuerySchema = z.object({
  action: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]).optional(),
  entityType: z.string().optional(),
  actorType: z.enum(["USER", "ADMIN", "SYSTEM"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("50"),
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
  const rateLimitKey = `admin:audit-logs:${session.user.id}:${ip}`;

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
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = auditLogQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      // Convert Zod issues to ValidationErrorDetails format
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError("Invalid query parameters", { details });
    }

    const {
      action,
      entityType,
      actorType,
      startDate,
      endDate,
      page: pageStr,
      limit: limitStr,
    } = validationResult.data;

    const page = parseInt(pageStr);
    const limit = parseInt(limitStr);
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.PrivacyAuditLogWhereInput = {};
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;
    if (actorType) whereClause.actorType = actorType;
    if (startDate || endDate) {
      whereClause.performedAt = {};
      if (startDate) (whereClause.performedAt as Prisma.DateTimeFilter).gte = new Date(startDate);
      if (endDate) (whereClause.performedAt as Prisma.DateTimeFilter).lte = new Date(endDate);
    }

    // Fetch audit logs with pagination
    const [auditLogs, totalCount] = await Promise.all([
      prisma.privacyAuditLog.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { performedAt: "desc" },
      }),
      prisma.privacyAuditLog.count({ where: whereClause }),
    ]);

    // Mask sensitive data in logs
    const sanitizedLogs = auditLogs.map((log) => {
      const sanitizedLog: Record<string, unknown> = { ...log };

      // Mask email in changes if present
      if (sanitizedLog.changes && typeof sanitizedLog.changes === "object") {
        const changes = sanitizedLog.changes as Record<string, unknown>;
        if (changes.email) {
          changes.email = "***masked***";
        }
      }

      return sanitizedLog;
    });

    return NextResponse.json({
      success: true,
      data: {
        auditLogs: sanitizedLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin audit-logs GET error", { error: (error as Error).message });

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

    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
