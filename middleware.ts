// Edge middleware: lightweight gating for /admin/* and security headers.
// Runs on every request matched by `config.matcher`.
// Avoids JWT verification here (Edge runtime); deeper auth happens in pages/routes.

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "__Host-cs_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public login + login API.
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  // Gate /admin/* and /api/admin/* on presence of session cookie.
  const requiresAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
  if (requiresAdmin) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) {
      if (pathname.startsWith("/api/admin/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
}

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
