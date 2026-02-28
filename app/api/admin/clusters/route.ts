import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { ValidationError } from "@/lib/validation";
import { DatabaseService } from "@/services/database-service";

// Validation schemas
const updateClusterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
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
  const rateLimitKey = `admin:clusters:${session.user.id}:${ip}`;

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const databaseService = new DatabaseService();

    // Fetch clusters and count in parallel
    const [clusters, totalCount] = await Promise.all([
      databaseService.getClusters(limit, offset),
      databaseService.getClustersCount(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clusters,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin clusters GET error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch clusters" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    const body = await request.json();

    // Validate request body
    const validationResult = updateClusterSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError("Invalid request body", { details });
    }

    const { name, description } = validationResult.data;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Both name and description are required for cluster creation" },
        { status: 400 }
      );
    }

    const databaseService = new DatabaseService();
    const cluster = await databaseService.createCluster(name, description);

    apiLogger.info("Cluster created", {
      adminId: session!.user.id,
      clusterId: cluster.id,
      name,
      description,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Cluster created successfully",
        cluster,
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin clusters POST error", { error: (error as Error).message });

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

    return NextResponse.json({ error: "Failed to create cluster" }, { status: 500 });
  }
}
