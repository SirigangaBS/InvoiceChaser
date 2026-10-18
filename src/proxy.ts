import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("invoicechaser_session")?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = [
    "/dashboard",
    "/invoices",
    "/clients",
    "/assistant",
    "/reminders",
    "/timeline",
    "/settings",
    "/billing",
    "/admin",
  ];

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 1. If trying to access protected area without an active session
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and visiting /login, redirect directly to dashboard
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/clients/:path*",
    "/assistant/:path*",
    "/reminders/:path*",
    "/timeline/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/admin/:path*",
    "/login",
  ],
};
