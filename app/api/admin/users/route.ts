import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { maskEmail } from "@/lib/masking";
import { prisma } from "@/lib/prisma";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { ValidationError } from "@/lib/validation";

// Validation schemas
const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ANALYST", "ADMIN"]),
});

const updateUserStatusSchema = z.object({
  active: z.boolean(),
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
  const rateLimitKey = `admin:${session.user.id}:${ip}`;

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

    // Parse query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get("role") as UserRole | null;
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { requirements: true },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Apply email masking for privacy
    const maskedUsers = users.map((user) => ({
      ...user,
      email: user.email ? maskEmail(user.email) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: maskedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin users GET error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
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

    // Validate request body
    const validationResult = updateUserRoleSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError("Invalid request body", validationResult.error.issues);
    }

    const { role } = validationResult.data;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    // Check if trying to modify self (admins shouldn't be able to change their own role)
    if (userId === session!.user.id) {
      return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Log the action
    await prisma.privacyAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        actorType: "ADMIN",
        actorId: session!.user.id,
        changes: { role },
        reason: `User role changed to ${role} by admin ${session!.user.email}`,
      },
    });

    apiLogger.info("User role updated", {
      adminId: session!.user.id,
      userId,
      newRole: role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...updatedUser,
          email: updatedUser.email ? maskEmail(updatedUser.email) : null,
        },
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin users PATCH error", { error: (error as Error).message });

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!prisma) throw new Error("Database not available");
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    // Check if trying to delete self
    if (userId === session!.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Soft delete: mark as inactive (we'll add an active field to User model)
    // For now, we'll just delete associated data and mark for deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { requirements: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create deletion request for GDPR compliance
    await prisma.dataDeletionQueue.create({
      data: {
        entityType: "UserData",
        entityId: userId,
        deletionReason: "USER_REQUEST",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for 24 hours from now
        requestedBy: session!.user.id,
        status: "PENDING",
      },
    });

    // Log the action
    await prisma.privacyAuditLog.create({
      data: {
        action: "DELETE",
        entityType: "User",
        entityId: userId,
        actorType: "ADMIN",
        actorId: session!.user.id,
        reason: `User account marked for deletion by admin ${session!.user.email}`,
      },
    });

    apiLogger.info("User marked for deletion", {
      adminId: session!.user.id,
      userId,
      userEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "User account marked for deletion. Data will be removed within 24 hours.",
    });
  } catch (error: unknown) {
    apiLogger.error("Admin users DELETE error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
