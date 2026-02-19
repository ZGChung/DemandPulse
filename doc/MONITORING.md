# Monitoring & Observability (P3-13)

## Overview

- **Sentry**: Client and server error tracking (see `sentry.client.config.js`, `sentry.server.config.js`). Set `SENTRY_DSN` (and optionally `NEXT_PUBLIC_SENTRY_DSN`) for production.
- **Structured logging**: `lib/logger.ts` – `Logger` with levels (DEBUG, INFO, WARN, ERROR), optional Sentry capture for errors/warnings. Use `apiLogger`, `dbLogger`, `authLogger`, `aiLogger`.
- **Trace IDs**: `lib/trace.ts` – `getTraceIdFromHeaders()` (x-request-id, x-trace-id, traceparent), `setTraceIdOnHeaders()` for responses. Use `withRequestLogging()` in API routes to log method, path, status, duration and echo trace id on response.
- **Instrumentation**: `instrumentation.ts` – runs once on Node server start; logs env, node version, Sentry presence.
- **Global error boundary**: `app/global-error.tsx` – catches React render errors, reports to Sentry, shows “Something went wrong” + Try again.

## Request logging

Wrap an API route for automatic request log and trace headers:

```ts
// app/api/your-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withRequestLogging } from "@/lib/with-request-logging";

async function handler(request: NextRequest) {
  // ...
  return NextResponse.json({ ok: true });
}

export const GET = withRequestLogging(handler);
```

Log output includes method, path, statusCode, durationMs. Response gets `x-request-id` and `x-trace-id` when client sends one.

## Health checks

- `GET /api/health` – app health (env, features). Cached 10s. Use for load balancer / readiness.
- Admin **System Health** (`/admin/system-health`) – DB, disk, memory, external services.

## Alerts

Configure Sentry alerts (rate, threshold) in the Sentry project. No in-app alerting by default.
