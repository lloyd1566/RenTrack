import { NextRequest, NextResponse } from "next/server";
import { resetAgentData } from "@/lib/db";
import { requireRole, withSecurityHeaders, withCorsHeaders, getClientIp } from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    await resetAgentData(userId);
    await logAudit(auth.userId, "agent_data_reset", { targetUserId: userId }, auth.ip, auth.userAgent);

    const response = NextResponse.json({ success: true, message: "Agent data reset successfully" });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Reset agent data error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset agent data" }, { status: 500 });
  }
}
