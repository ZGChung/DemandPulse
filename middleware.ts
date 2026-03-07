import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

import { validateCSRFToken, setCSRFTokenCookie, getCSRFTokenFromRequest } from "@/lib/csrf";
import { getTraceIdFromHeaders, setTraceIdOnHeaders } from "@/lib/trace";

// Public routes that don't require authentication
function isPublicRoute(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  // Health check endpoint
  if (pathname === "/api/health") {
    return true;
  }

  // NextAuth endpoints must be accessible without session
  if (pathname.startsWith("/api/auth/")) {
    return true;
  }

  // Mock endpoints (development only)
  if (pathname.startsWith("/api/mock/")) {
    return true;
  }

  // GET /api/requirements (public read access)
  if (method === "GET" && pathname === "/api/requirements") {
    return true;
  }

  // Plugin endpoints (API key auth, not session)
  if (pathname.startsWith("/api/plugin/")) {
    return true;
  }

  // Cron endpoints (CRON_SECRET auth, not session)
  if (pathname.startsWith("/api/cron/")) {
    return true;
  }

  // OpenAPI spec
  if (pathname === "/api/openapi") {
    return true;
  }

  // Locale API
  if (pathname === "/api/locale") {
    return true;
  }

  // Public pages — allow unauthenticated access so middleware never blocks or throws on these
  if (pathname === "/" || pathname === "/landing" || pathname.startsWith("/auth/")) {
    return true;
  }

  // OPTIONS requests (CORS preflight)
  if (method === "OPTIONS") {
    return true;
  }

  return false;
}

export default withAuth(
  async function middleware(req) {
    const startTime = Date.now();
    try {
      // Handle CORS preflight requests
      if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
        const response = new NextResponse(null, { status: 204 });
        const traceId = getTraceIdFromHeaders(req.headers);
        setTraceIdOnHeaders(response.headers, traceId);
        response.headers.set(
          "Access-Control-Allow-Origin",
          process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
        );
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Max-Age", "86400");
        return response;
      }

      const response = NextResponse.next();
      const traceId = getTraceIdFromHeaders(req.headers);
      setTraceIdOnHeaders(response.headers, traceId);

      if (req.nextUrl.pathname.startsWith("/api/")) {
        response.headers.set(
          "Access-Control-Allow-Origin",
          process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
        );
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      if (req.nextUrl.pathname.startsWith("/api/")) {
        const method = req.method.toUpperCase();
        const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
        if (!isPublicRoute(req)) {
          if (!isSafeMethod) {
            const csrfValidation = await validateCSRFToken(req);
            if (!csrfValidation.valid) {
              const errorResponse = new NextResponse(
                JSON.stringify({
                  error: "CSRF validation failed",
                  message: csrfValidation.error,
                }),
                {
                  status: 403,
                  headers: {
                    "Content-Type": "application/json",
                    ...Object.fromEntries(response.headers.entries()),
                  },
                }
              );
              setTraceIdOnHeaders(errorResponse.headers, traceId);
              return errorResponse;
            }
          } else if (method === "GET") {
            const existingToken = getCSRFTokenFromRequest(req);
            if (!existingToken) {
              await setCSRFTokenCookie(response);
            }
          }
        }
      }

      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://avatars.githubusercontent.com; font-src 'self'; connect-src 'self' https://github.com;"
      );
      response.headers.set("x-response-time", `${Date.now() - startTime}ms`);
      return response;
    } catch (err) {
      console.error("Middleware error:", err);
      const fallback = NextResponse.next();
      fallback.headers.set("X-Content-Type-Options", "nosniff");
      return fallback;
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes without authentication
        if (isPublicRoute(req)) {
          return true;
        }
        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Apply middleware to all routes for security headers
     * Specific authentication is handled in individual routes
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
