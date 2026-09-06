import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, findUserById, findUserByEmail, deleteUser, createUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/security";
import {
  requireRole, sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";
import { createRentTrackEmailTemplate, getSiteUrl, sendEmail } from "@/lib/mail";
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
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
    }

    if (!["tenant", "agent", "owner"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const user = await createUser(name, email, password, role, phone || undefined, undefined, address || undefined);
    await logAudit(auth.userId, "user_created", { createdUserId: user.id, name: user.name, role: user.role }, (request as any).ip, (request as any).headers?.get("user-agent"));

    let emailSent = false;
    try {
      const loginUrl = `${getSiteUrl(request.nextUrl.origin)}/login`;
      await sendEmail({
        to: user.email,
        subject: "Your RentTrack account has been created",
        text: `Hello ${user.name},\n\nYour RentTrack account has been created.\n\nUsername: ${user.email}\nPassword: ${password}\nRole: ${user.role}\n\nSign in at: ${loginUrl}\n\nPlease change your password after signing in.`,
        html: createRentTrackEmailTemplate({
          title: "Your account is ready",
          body: `Hello ${user.name},\n\nYour RentTrack account has been created by an administrator.`,
          messageBlock: `Username: ${user.email}\nPassword: ${password}\nRole: ${user.role}`,
          ctaLabel: "Sign in to RentTrack",
          ctaUrl: loginUrl,
          footerNote: "Please change your password after signing in. Keep this email private.",
        }),
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Account created but credentials email failed:", emailError);
    }

    return NextResponse.json({ success: true, user: sanitizeResponse(user), emailSent });
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
