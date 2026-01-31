import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

import { validateCSRFToken, setCSRFTokenCookie, getCSRFTokenFromRequest } from "@/lib/csrf";

// Public routes that don't require authentication
function isPublicRoute(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  // Health check endpoint
  if (pathname === "/api/health") {
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

  // OPTIONS requests (CORS preflight)
  if (method === "OPTIONS") {
    return true;
  }

  return false;
}

export default withAuth(
  async function middleware(req) {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set(
        "Access-Control-Allow-Origin",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
      return response;
    }

    // Add security headers to all responses
    const response = NextResponse.next();

    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith("/api/")) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    // CSRF protection for state-changing API requests
    if (req.nextUrl.pathname.startsWith("/api/")) {
      const method = req.method.toUpperCase();
      const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);

      // Skip CSRF for public routes
      if (!isPublicRoute(req)) {
        if (!isSafeMethod) {
          // Validate CSRF token for unsafe methods
          const csrfValidation = await validateCSRFToken(req);
          if (!csrfValidation.valid) {
            return new NextResponse(
              JSON.stringify({ error: "CSRF validation failed", message: csrfValidation.error }),
              {
                status: 403,
                headers: {
                  "Content-Type": "application/json",
                  ...response.headers,
                },
              }
            );
          }
        } else if (method === "GET") {
          // Set CSRF token cookie for GET requests if not present
          const existingToken = getCSRFTokenFromRequest(req);
          if (!existingToken) {
            await setCSRFTokenCookie(response);
          }
        }
      }
    }

    // Additional security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
    );

    return response;
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
