import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { DatabaseService } from "@/services/database-service";
import { emailService } from "@/services/email-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = request.nextUrl.searchParams.get("secret");
  return bearer === secret || querySecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  try {
    const databaseService = new DatabaseService();
    const clusters = await databaseService.getClusters(10, 0);
    const trends = clusters.map((c) => ({
      name: c.name,
      growth: 0,
      requirements: c.requirementCount ?? 0,
    }));

    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, name: true },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.email) continue;
      const result = await emailService.sendWeeklyDigest(
        {
          email: user.email,
          name: user.name ?? undefined,
          userId: user.id,
        },
        trends.length > 0 ? trends : [{ name: "No trends yet", growth: 0, requirements: 0 }]
      );
      if (result.success) sent++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      recipients: users.length,
    });
  } catch (error) {
    console.error("[weekly-digest]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send digest" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
