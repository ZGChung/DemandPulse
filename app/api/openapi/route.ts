import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "docs", "api", "swagger.yaml");
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/x-yaml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[openapi]", error);
    return NextResponse.json({ error: "OpenAPI spec not found" }, { status: 404 });
  }
}
