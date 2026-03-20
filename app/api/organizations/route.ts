import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createOrgSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$|^$/, "slug: lowercase, numbers, hyphens only")
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
  const orgs = await prisma.organization.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { select: { id: true, userId: true, role: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ organizations: orgs });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
  let body: z.infer<typeof createOrgSchema>;
  try {
    body = createOrgSchema.parse(await request.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }
  const slug =
    (body.slug && body.slug.trim()) ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") ||
    "org";
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "Organization with this slug already exists" },
      { status: 409 }
    );
  }
  const org = await prisma.organization.create({
    data: {
      name: body.name,
      slug,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
  });
  return NextResponse.json({ organization: org }, { status: 201 });
}
