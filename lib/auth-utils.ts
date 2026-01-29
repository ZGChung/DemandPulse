import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "./auth";

export async function requireAuth(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return { session, user: session.user };
}
