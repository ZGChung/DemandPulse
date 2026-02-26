import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";
import { defaultRateLimiter } from "@/lib/rate-limiter";
import { settingsService, DEFAULT_SETTINGS } from "@/services/settings-service";

// Validation schema for settings update
const settingsUpdateSchema = z
  .object({
    // Clustering settings
    clusteringEnabled: z.boolean().optional(),
    clusteringThreshold: z.number().min(0.1).max(1.0).optional(),
    autoClusterFrequency: z.enum(["hourly", "daily", "weekly", "manual"]).optional(),

    // Email settings
    emailNotifications: z.boolean().optional(),
    adminEmail: z.string().email().optional(),
    notificationThreshold: z.number().min(1).max(1000).optional(),

    // Privacy settings
    dataRetentionDays: z.number().min(1).max(3650).optional(), // Max 10 years
    autoAnonymization: z.boolean().optional(),
    requireConsentForCollection: z.boolean().optional(),

    // System settings
    maintenanceMode: z.boolean().optional(),
    apiRateLimit: z.number().min(1).max(10000).optional(),
    enablePublicApi: z.boolean().optional(),
  })
  .partial();

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
  const rateLimitKey = `admin:settings:${session.user.id}:${ip}`;

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

    const settings = await settingsService.getSettings();

    // Don't include timestamps in response for security
    const { updatedAt: _updatedAt, updatedBy: _updatedBy, ...safeSettings } = settings;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _updatedAt; // Reserved for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void _updatedBy;

    return NextResponse.json({
      success: true,
      data: {
        settings: safeSettings,
        defaults: DEFAULT_SETTINGS,
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin settings GET error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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
    const validationResult = settingsUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid settings data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const settingsUpdate = validationResult.data;

    // Validate admin email if provided and email notifications are enabled
    if (settingsUpdate.adminEmail && (settingsUpdate.emailNotifications ?? true)) {
      const emailSchema = z.string().email();
      const emailResult = emailSchema.safeParse(settingsUpdate.adminEmail);
      if (!emailResult.success) {
        return NextResponse.json({ error: "Invalid admin email address" }, { status: 400 });
      }
    }

    // Update settings
    const updatedSettings = await settingsService.updateSettings(
      settingsUpdate,
      session!.user.email || session!.user.id
    );

    // Don't include timestamps in response for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt: _updatedAt, updatedBy: _updatedBy, ...safeSettings } = updatedSettings;

    apiLogger.info("System settings updated via API", {
      adminId: session!.user.id,
      changes: Object.keys(settingsUpdate),
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: safeSettings,
        message: "Settings updated successfully",
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin settings POST error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireAdminAccess(session);
    await checkRateLimit(session, request);

    // Reset to defaults
    const updatedSettings = await settingsService.updateSettings(
      DEFAULT_SETTINGS,
      session!.user.email || session!.user.id
    );

    // Don't include timestamps in response for security
    const { updatedAt, updatedBy, ...safeSettings } = updatedSettings;

    apiLogger.info("System settings reset to defaults", {
      adminId: session!.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: safeSettings,
        message: "Settings reset to defaults",
      },
    });
  } catch (error: unknown) {
    apiLogger.error("Admin settings PUT error", { error: (error as Error).message });

    if ((error as Error).message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if ((error as Error).message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 });
  }
}
