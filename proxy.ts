import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withSecurityHeaders } from "@/lib/security-headers";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/tret") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/tenant";
    const response = NextResponse.redirect(url, 302);
    return withSecurityHeaders(response);
  }

  const response = NextResponse.next();
  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|public/|api/).*)",
  ],
};
