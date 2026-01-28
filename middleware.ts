import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // You can add additional logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protect specific routes:
     * - API routes that need authentication
     * - Dashboard pages
     */
    // "/api/requirements/:path*", // We'll handle auth in the route itself
    "/dashboard/:path*", // Protect dashboard pages (if we add them)
  ],
};