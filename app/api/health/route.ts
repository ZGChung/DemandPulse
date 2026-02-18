import { NextResponse } from "next/server";

import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { validateEnv, env } from "@/lib/env";

const HEALTH_CACHE_TTL_MS = 10_000; // 10s

export async function GET() {
  try {
    const cached = cacheGet<Record<string, unknown>>(cacheKey("health"));
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=10" },
      });
    }

    validateEnv();

    const body = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      app: { name: env.appName(), url: env.appUrl() },
      features: {
        claudeCodePlugin: env.enableClaudeCodePlugin(),
        aiProcessing: env.enableAiProcessing(),
      },
      environment: process.env.NODE_ENV,
    };
    cacheSet(cacheKey("health"), body, HEALTH_CACHE_TTL_MS);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=10" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
