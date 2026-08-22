import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs as getAuditLogsFromDb } from "@/lib/db";
import { requireAuth, withSecurityHeaders, withCorsHeaders } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100) : 40;

    const logs = await getAuditLogsFromDb(limit);

    return NextResponse.json({
      success: true,
      logs: logs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
