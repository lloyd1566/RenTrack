import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/db";
import { sendEmail, getSiteUrl } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const adminClient = getAdminSupabase();
    const { data: user, error } = await adminClient
      .from("users")
      .select("id, name, email, role")
      .eq("email", email)
      .single();

    if (error || !user) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: updateError } = await adminClient
      .from("users")
      .update({ verification_token: resetToken, verification_expires_at: expiresAt })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to set reset token:", updateError);
      return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
    }

    const origin = getSiteUrl(request.nextUrl.origin);
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; background: #f3f4f6; color: #1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f3f4f6; padding: 40px 0;">
          <tr><td align="center"><table width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <tr><td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">RentTrack</h1>
            </td></tr>
            <tr><td style="padding: 40px 40px 30px;">
              <h2 style="color: #111827; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Reset Your Password</h2>
              <p style="color: #4b5563; line-height: 1.7; margin: 0 0 8px; font-size: 15px;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px; font-size: 15px;">Click the button below to reset your password. This link will expire in 1 hour.</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">Reset Password</a>
              <p style="color: #9ca3af; line-height: 1.7; margin: 24px 0 0; font-size: 13px;">If you didn't request this, please ignore this email.</p>
            </td></tr>
          </table></td></tr>
        </table>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset your RentTrack password",
      html,
    });

    await logAudit(user.id, "password_reset_requested", { email: user.email }, "system", "system");

    return NextResponse.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
