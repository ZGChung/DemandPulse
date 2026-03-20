import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMemberOrFail(orgId: string, userId: string) {
  const member = await prisma?.organizationMember.findFirst({
    where: { organizationId: orgId, userId },
    include: { organization: true },
  });
  return member;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
  const { id } = await params;
  const member = await getMemberOrFail(id, session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  }
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { members: true } },
    },
  });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  return NextResponse.json({ organization: org, myRole: member.role });
}
