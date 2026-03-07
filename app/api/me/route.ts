import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(0).max(200).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const { name } = parsed.data;
  if (name === undefined) {
    return NextResponse.json({ success: true, message: "Nothing to update" });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name || null },
  });
  return NextResponse.json({ success: true, message: "Profile updated" });
}
