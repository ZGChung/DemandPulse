import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { DatabaseService } from "@/services/database-service";

export const dynamic = "force-dynamic";

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

    const databaseService = new DatabaseService();
    const clusters = await databaseService.getClusters(validatedLimit, validatedOffset);

    // Get public statistics for the trends page
    const statistics = await databaseService.getPublicStatistics();

    return NextResponse.json({
      success: true,
      data: {
        clusters,
        statistics,
      },
      pagination: {
        limit: validatedLimit,
        offset: validatedOffset,
        total: statistics.totalClusters,
        hasMore: validatedOffset + validatedLimit < statistics.totalClusters,
      },
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
