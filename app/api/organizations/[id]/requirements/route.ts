import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
  const { id: orgId } = await params;
  const member = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, userId: session.user.id },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  }
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  const memberUserIds = await prisma.organizationMember
    .findMany({ where: { organizationId: orgId }, select: { userId: true } })
    .then((rows) => rows.map((r) => r.userId));

  const [requirements, total] = await Promise.all([
    prisma.requirement.findMany({
      where: { userId: { in: memberUserIds } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        summarizedRequirement: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.requirement.count({ where: { userId: { in: memberUserIds } } }),
  ]);

  return NextResponse.json({
    requirements,
    pagination: { page, limit, total },
  });
}
