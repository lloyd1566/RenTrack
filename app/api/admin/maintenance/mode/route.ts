import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const enabled = await getMaintenanceMode();
    const response = NextResponse.json({ success: true, enabled });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Get maintenance mode error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to fetch maintenance mode" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const enabled = Boolean(body.enabled);

    await setMaintenanceMode(enabled);
    const response = NextResponse.json({ success: true, enabled });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Update maintenance mode error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to update maintenance mode" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
