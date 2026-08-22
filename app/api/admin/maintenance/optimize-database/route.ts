import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { optimizeDatabase } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const result = await optimizeDatabase();
    const response = NextResponse.json(result);
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Optimize database error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to optimize database" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
