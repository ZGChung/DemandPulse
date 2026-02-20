import { NextRequest, NextResponse } from "next/server";

import { LOCALE_COOKIE, isLocale, getDefaultLocale } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  let body: { locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const locale = body.locale && isLocale(body.locale) ? body.locale : getDefaultLocale();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000 });
  return res;
}
