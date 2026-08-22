import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { getSystemConfig, updateSystemConfig } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const config = await getSystemConfig();
    const response = NextResponse.json({ success: true, config });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Get config error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to fetch config" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const updates: Record<string, string> = {};

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string" && value.length <= 1000) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      const response = NextResponse.json({ success: false, error: "No valid config fields provided" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    for (const [key, value] of Object.entries(updates)) {
      await updateSystemConfig(key, value);
    }

    const config = await getSystemConfig();
    const response = NextResponse.json({ success: true, config });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Update config error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to update config" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
