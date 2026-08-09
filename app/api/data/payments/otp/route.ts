import { NextRequest, NextResponse } from "next/server";
import { createPaymentVerificationCode, findUserById, verifyUserPaymentPin } from "@/lib/db";
import { generateOtpCode, getSessionUserId } from "@/lib/security";
import { sendOtpEmail, isSmtpConfigured } from "@/lib/mail";
import {
  requireAuth, validateApiRequest, withRateLimit,
  withSecurityHeaders, withCorsHeaders, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const rateLimit = await withRateLimit(request, `otp_request:${auth.userId}`);
    if (rateLimit) return rateLimit;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { paymentPin } = await request.json();
    if (!paymentPin) {
      return NextResponse.json({ success: false, error: "Payment PIN is required" }, { status: 400 });
    }

    const user = auth.user;
    if (user.role !== "tenant") {
      return NextResponse.json({ success: false, error: "Only tenant accounts can request payment codes" }, { status: 403 });
    }

    const pinOk = await verifyUserPaymentPin(auth.userId, String(paymentPin));
    if (!pinOk) {
      await logAudit(auth.userId, "otp_request_failed", { reason: "invalid_pin" }, auth.ip, auth.userAgent);
      return NextResponse.json({ success: false, error: "Invalid payment PIN" }, { status: 401 });
    }

    const otpCode = generateOtpCode();
    await createPaymentVerificationCode(auth.userId, otpCode);

    if (!isSmtpConfigured()) {
      console.error("SMTP not configured — cannot send OTP email");
      return NextResponse.json({ success: false, error: "Server email is not configured. Please contact support." }, { status: 500 });
    }

    if (!user.email) {
      return NextResponse.json({ success: false, error: "User has no email address" }, { status: 400 });
    }

    let emailSent = false;
    try {
      emailSent = await sendOtpEmail(user.email, otpCode);
    } catch (err) {
      console.error("Unexpected error sending OTP email:", err);
    }

    if (!emailSent) {
      return NextResponse.json({ success: false, error: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    await logAudit(auth.userId, "otp_requested", {}, auth.ip, auth.userAgent);
    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("Payment OTP error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate verification code" }, { status: 500 });
  }
}
