import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, getCurrentUser } from "@/lib/security";
import { findUserById } from "@/lib/db";
import { logAudit } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders, getClientIp } from "@/lib/security-headers";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    if (!["admin", "owner", "agent"].includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const { userId, status } = await request.json();
    if (!userId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const targetUser = await findUserById(userId);
    if (!targetUser || !["tenant", "agent"].includes(targetUser.role)) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { sql } = await import("@/lib/db");
    await sql`
      UPDATE users SET id_verification_status = ${status}
      WHERE id = ${userId}
    `;

    const actorId = getSessionUserId(request);
    if (actorId) {
      await logAudit(actorId, "id_verification_updated", { targetUserId: userId, status }, getClientIp(request), request.headers.get("user-agent") || "unknown");
    }

    return NextResponse.json({ success: true, message: `ID verification ${status}` });
  } catch (error) {
    console.error("ID verification update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update verification" }, { status: 500 });
  }
}
