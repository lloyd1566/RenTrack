import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, findUserById } from "@/lib/db";
import { getCurrentUser } from "@/lib/security";
import {
  requireRole, sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const users = await getAllUsers();
    const safeUsers = users.map(u => sanitizeResponse(u));
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ success: false, error: "Cannot delete admin users" }, { status: 403 });
    }

    if (targetUser.id === auth.userId) {
      return NextResponse.json({ success: false, error: "Cannot delete your own account" }, { status: 400 });
    }

    const { sql } = await import("@/lib/db");
    await sql`DELETE FROM users WHERE id = ${userId}`;

    await logAudit(auth.userId, "user_deleted", { deletedUserId: userId, deletedUserName: targetUser.name }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
