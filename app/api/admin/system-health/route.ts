import { existsSync } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { defaultRateLimiter } from "@/lib/rate-limiter";

// Helper to check admin access
async function requireAdminAccess(session: any) {
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
}

// Helper for rate limiting
async function checkRateLimit(session: any, request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimitKey = `admin:system-health:${session.user.id}:${ip}`;

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

// Check database connectivity
async function checkDatabase(db: NonNullable<typeof prisma>) {
  try {
    const startTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get some basic stats
    const [userCount, requirementCount, clusterCount] = await Promise.all([
      db.user.count(),
      db.requirement.count(),
      db.requirementCluster.count(),
    ]);

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      stats: {
        users: userCount,
        requirements: requirementCount,
        clusters: clusterCount,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

// Check disk space
async function checkDiskSpace() {
  try {
    const diskPath = process.cwd();
    const stats = await fs.statfs(diskPath);

    const totalBytes = stats.bsize * stats.blocks;
    const freeBytes = stats.bsize * stats.bavail;
    const usedBytes = totalBytes - freeBytes;
    const usedPercentage = (usedBytes / totalBytes) * 100;

    return {
      status: usedPercentage > 90 ? "warning" : usedPercentage > 95 ? "critical" : "healthy",
      total: `${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedBytes / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usedPercentage: usedPercentage.toFixed(2),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown disk space error",
    };
  }
}

// Check memory usage
function checkMemory() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedPercentage = (usedMem / totalMem) * 100;

    return {
      status: usedPercentage > 90 ? "warning" : usedPercentage > 95 ? "critical" : "healthy",
      total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usedPercentage: usedPercentage.toFixed(2),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown memory error",
    };
  }
}

// Check critical files exist
async function checkCriticalFiles() {
  const criticalFiles = [".env", "prisma/schema.prisma", "prisma/dev.db", "lib/prisma.ts"];

  const results = [];
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = existsSync(filePath);
    results.push({
      file,
      exists,
      status: exists ? "healthy" : "critical",
    });
  }

  const allExist = results.every((r) => r.exists);
  return {
    status: allExist ? "healthy" : "critical",
    files: results,
  };
}

// Check external services (placeholder)
async function checkExternalServices() {
  // In a real implementation, this would check:
  // - Email service
  // - Redis cache
  // - Claude Code API
  // - Any other external dependencies

  return {
    status: "healthy", // Placeholder
    services: [
      {
        name: "Email Service",
        status: "healthy",
        responseTime: "N/A",
      },
      {
        name: "Redis Cache",
        status: "healthy",
        responseTime: "N/A",
      },
      {
        name: "Claude Code API",
        status: "healthy",
        responseTime: "N/A",
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!prisma) throw new Error("Database not available");
    const session = await getServerSession(authOptions);
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Run all health checks in parallel
    const [databaseHealth, diskHealth, memoryHealth, filesHealth, servicesHealth] =
      await Promise.all([
        checkDatabase(prisma),
        checkDiskSpace(),
        checkMemory(),
        checkCriticalFiles(),
        checkExternalServices(),
      ]);

    // Determine overall system status
    const allStatuses = [
      databaseHealth.status,
      diskHealth.status,
      memoryHealth.status,
      filesHealth.status,
      servicesHealth.status,
    ];

    let overallStatus = "healthy";
    if (allStatuses.includes("critical")) {
      overallStatus = "critical";
    } else if (allStatuses.includes("warning")) {
      overallStatus = "warning";
    } else if (allStatuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    }

    // Get system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? "development",
      appVersion: "1.0.0", // Could be read from package.json
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        overallStatus,
        systemInfo,
        checks: {
          database: databaseHealth,
          disk: diskHealth,
          memory: memoryHealth,
          files: filesHealth,
          externalServices: servicesHealth,
        },
      },
    });
  } catch (error: any) {
    apiLogger.error("Admin system-health GET error", { error: error.message });

    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch system health" }, { status: 500 });
  }
}
