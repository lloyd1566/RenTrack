import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Token and new password are required" }, { status: 400 });
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const adminClient = getAdminSupabase();
    const { data: user, error } = await adminClient
      .from("users")
      .select("id, name, email, role, verification_expires_at")
      .eq("verification_token", token)
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (new Date(user.verification_expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Reset token has expired. Please request a new one." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        password: hashedPassword,
        verification_token: null,
        verification_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to reset password:", updateError);
      return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
    }

    await logAudit(user.id, "password_reset_completed", { email: user.email, method: "email_token" }, "system", "system");

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password confirm error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 });
  }
}
