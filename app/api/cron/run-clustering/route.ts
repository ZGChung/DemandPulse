import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ClusteringService } from "@/services/clustering-service";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
    const requirements = await prisma.requirement.findMany({
      where: {
        status: { in: ["PENDING", "PROCESSED"] },
        embedding: { not: Prisma.JsonNull },
      },
      select: { id: true, embedding: true },
      take: 500,
    });

    const withEmbedding = requirements.filter(
      (r): r is { id: string; embedding: number[] } =>
        r.embedding !== null && Array.isArray(r.embedding) && r.embedding.length > 0
    );

    if (withEmbedding.length < 2) {
      return NextResponse.json({
        success: true,
        message: "Not enough requirements with embeddings to cluster",
        processed: 0,
        clustersCreated: 0,
      });
    }

    const clusteringService = new ClusteringService();
    const clusters = await clusteringService.clusterRequirements(
      withEmbedding.map((r) => ({ id: r.id, embedding: r.embedding })),
      { maxClusters: 20, minClusterSize: 2 }
    );

    return NextResponse.json({
      success: true,
      processed: withEmbedding.length,
      clustersCreated: clusters.length,
    });
  } catch (error) {
    console.error("[run-clustering]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Clustering failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
