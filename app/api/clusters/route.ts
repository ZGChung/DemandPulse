import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { DatabaseService } from "@/services/database-service";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60_000; // 1 min

// Schema for query parameters
const clustersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const validationResult = clustersQuerySchema.safeParse({
      limit: limit || undefined,
      offset: offset || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { limit: validatedLimit = 10, offset: validatedOffset = 0 } = validationResult.data;

    const key = cacheKey("clusters", String(validatedLimit), String(validatedOffset));
    const cached = cacheGet<Record<string, unknown>>(key);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const databaseService = new DatabaseService();
    const clusters = await databaseService.getClusters(validatedLimit, validatedOffset);
    const statistics = await databaseService.getPublicStatistics();

    const body = {
      success: true,
      data: { clusters, statistics },
      pagination: {
        limit: validatedLimit,
        offset: validatedOffset,
        total: statistics.totalClusters,
        hasMore: validatedOffset + validatedLimit < statistics.totalClusters,
      },
    };
    cacheSet(key, body, CACHE_TTL_MS);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Error fetching clusters:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch clusters",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
