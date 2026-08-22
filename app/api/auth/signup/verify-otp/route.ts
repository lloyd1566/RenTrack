import { NextRequest, NextResponse } from "next/server";
import { verifyLoginOtp, initDatabase, findOrCreateAdmin, findUserById, logAudit, updateUser } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders, validateApiRequest, getClientIp } from "@/lib/api-security";
import { checkVerifyRateLimit, clearVerifyRateLimit, VERIFY_LOCKOUT_DURATION_MS } from "@/lib/auth-security";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { userId, otp } = await request.json();
    if (!userId || !otp) {
      return NextResponse.json({ success: false, error: "User ID and verification code are required" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `signup_verify:${ip}:${userId}`;
    const rateLimit = checkVerifyRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const waitMinutes = Math.max(1, Math.ceil((rateLimit.lockedUntil || Date.now() + VERIFY_LOCKOUT_DURATION_MS) - Date.now()) / 60000);
      return NextResponse.json({
        success: false,
        error: `Too many verification attempts. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""}.`,
        locked: true,
        retryAfter: rateLimit.lockedUntil,
      }, { status: 429 });
    }

    const result = await verifyLoginOtp(userId, otp);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await updateUser(userId, { emailVerified: true, verificationToken: null, verificationExpiresAt: null });

    const updatedUser = await findUserById(userId);
    if (!updatedUser || !updatedUser.emailVerified) {
      return NextResponse.json({ success: false, error: "Failed to verify email. Please try again." }, { status: 500 });
    }

    clearVerifyRateLimit(rateLimitKey);

    try {
      await logAudit(userId, "email_verified", { email: user.email }, ip, request.headers.get("user-agent") || "unknown");
    } catch {}

    const safeUser = { ...updatedUser };
    delete safeUser.password;
    const response = NextResponse.json({ success: true, verified: true, user: safeUser, message: "Email verified successfully! You can now log in." });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Verify signup OTP error:", error);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
