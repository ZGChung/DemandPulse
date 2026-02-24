import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { DatabaseService } from "@/services/database-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseService = new DatabaseService();
  const [contributionCount, clusters] = await Promise.all([
    databaseService.getRequirementCountForUser(session.user.id),
    databaseService.getClustersForUser(session.user.id),
  ]);

  return NextResponse.json({
    success: true,
    data: { contributionCount, clusters },
  });
}
