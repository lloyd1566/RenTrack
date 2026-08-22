import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db";
import { requireRole, validateApiRequest, withRateLimit, getClientIp } from "@/lib/api-security";
import { logAudit } from "@/lib/db";

const ALLOWED_FIELDS = ["name", "email", "phone", "address"];

export async function PATCH(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(request, `update_user:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { userId, data } = await request.json();
    if (!userId || !data || typeof data !== "object") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      if (!ALLOWED_FIELDS.includes(key)) continue;
      updates[key] = val;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await getAdminSupabase().from("users").update(updates).eq("id", userId);
    if (error) throw error;

    await logAudit(auth.userId, "user_updated", { targetUserId: userId, fields: Object.keys(updates) }, auth.ip, auth.userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}
