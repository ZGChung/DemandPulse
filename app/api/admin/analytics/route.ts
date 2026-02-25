import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { defaultRateLimiter } from "@/lib/rate-limiter";

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
  const rateLimitKey = `admin:analytics:${session.user.id}:${ip}`;

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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Parse query parameters for time range
    const url = new URL(request.url);
    const startDateStr = url.searchParams.get("startDate");
    const endDateStr = url.searchParams.get("endDate");

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    // Fetch analytics data in parallel
    const [userStats, requirementStats, clusterStats, activeUsers, topClusters, systemMetrics] =
      await Promise.all([
        // User statistics
        prisma.user.aggregate({
          _count: { id: true },
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        // Requirement statistics
        prisma.requirement.aggregate({
          _count: { id: true },
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        // Cluster statistics
        prisma.requirementCluster.aggregate({
          _count: { id: true },
          _avg: { requirementCount: true },
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        // Active users (users with requirements in period)
        prisma.user.count({
          where: {
            requirements: {
              some: {
                createdAt: { gte: startDate, lte: endDate },
              },
            },
          },
        }),
        // Top clusters by requirement count
        prisma.requirementCluster.findMany({
          take: 10,
          orderBy: { requirementCount: "desc" },
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          select: {
            id: true,
            name: true,
            description: true,
            requirementCount: true,
            createdAt: true,
          },
        }),
        // System metrics (database size, etc.)
        Promise.resolve({
          // Placeholder for actual system metrics
          databaseSize: "N/A",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
        }),
      ]);

    // Calculate growth rates (simplified)
    const previousStartDate = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime())
    );
    const previousEndDate = new Date(startDate.getTime() - 1);

    const previousUserCount = await prisma.user.count({
      where: {
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
    });

    const userGrowth =
      previousUserCount > 0
        ? ((userStats._count.id - previousUserCount) / previousUserCount) * 100
        : 100;

    return NextResponse.json({
      success: true,
      data: {
        timeRange: { startDate, endDate },
        summary: {
          totalUsers: userStats._count.id,
          totalRequirements: requirementStats._count.id,
          totalClusters: clusterStats._count.id,
          activeUsers,
          userGrowthRate: userGrowth,
          avgRequirementsPerUser:
            userStats._count.id > 0 ? requirementStats._count.id / userStats._count.id : 0,
          avgTokensPerRequirement: 0,
          avgRequirementsPerCluster: clusterStats._avg.requirementCount || 0,
        },
        details: {
          userStats,
          requirementStats,
          clusterStats,
          topClusters,
          systemMetrics,
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin analytics GET error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
