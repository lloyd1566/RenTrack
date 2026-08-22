import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const response = NextResponse.json({ success: true, message: "Cache cleared successfully" });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Clear cache error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to clear cache" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
