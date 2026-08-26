import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, findUserById, deleteUser, createUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/security";
import {
  requireRole, sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";
import bcrypt from "bcryptjs";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const role = String(body.role || "tenant").trim();
    const phone = body.phone || "";

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
    }

    if (!["tenant", "agent", "owner"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const existing = await findUserById(email);
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const user = await createUser(name, email, password, role, phone);
    await logAudit(auth.userId, "user_created", { createdUserId: user.id, name: user.name, role: user.role }, (request as any).ip, (request as any).headers?.get("user-agent"));
    return NextResponse.json({ success: true, user: sanitizeResponse(user) });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
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

    const { supabase } = await import("@/lib/db");
    await deleteUser(userId);

    await logAudit(auth.userId, "user_deleted", { deletedUserId: userId, deletedUserName: targetUser.name }, (request as any).ip, (request as any).headers?.get("user-agent"));
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
