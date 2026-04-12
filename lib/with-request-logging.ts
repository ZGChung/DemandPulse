/**
 * Wraps an API route handler to log request method, path, status, duration and to
 * propagate x-request-id / x-trace-id on the response.
 */
import { NextRequest, NextResponse } from "next/server";

import { apiLogger } from "@/lib/logger";
import { getTraceIdFromHeaders, setTraceIdOnHeaders } from "@/lib/trace";

export type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withRequestLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const traceId = getTraceIdFromHeaders(request.headers);
    const path = request.nextUrl?.pathname ?? new URL(request.url).pathname;
    const method = request.method;
    const start = Date.now();

    try {
      const res = await handler(request, context);
      const duration = Date.now() - start;
      apiLogger.logRequest(method, path, res.status, duration);
      const newRes = new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: new Headers(res.headers),
      });
      setTraceIdOnHeaders(newRes.headers, traceId);
      return newRes;
    } catch (err) {
      const duration = Date.now() - start;
      apiLogger.error(
        "API handler threw",
        { method, path, durationMs: duration, traceId },
        err as Error
      );
      const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      setTraceIdOnHeaders(res.headers, traceId);
      return res;
    }
  };
}
