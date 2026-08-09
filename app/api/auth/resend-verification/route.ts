import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createLoginOtp, initDatabase, findOrCreateAdmin } from "@/lib/db";
import { sendEmail, getSiteUrl } from "@/lib/mail";
import { withSecurityHeaders, withCorsHeaders, validateApiRequest, getClientIp } from "@/lib/api-security";
import { checkVerifyRateLimit, MAX_VERIFY_ATTEMPTS } from "@/lib/auth-security";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `resend_verify:${ip}:${email.toLowerCase()}`;
    const rateLimit = checkVerifyRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const waitMinutes = Math.max(1, Math.ceil((rateLimit.lockedUntil || Date.now() + 5 * 60 * 1000) - Date.now()) / 60000);
      return NextResponse.json({
        success: false,
        error: `Too many resend requests. Please try again in ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""}.`,
        locked: true,
        retryAfter: rateLimit.lockedUntil,
      }, { status: 429 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: "No account found with this email" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: "Email is already verified" }, { status: 400 });
    }

    const otp = await createLoginOtp(user.id, 15);
    const origin = getSiteUrl(request.nextUrl.origin);

    let emailError: string | null = null;
    const devShowOtp = process.env.DEV_SHOW_OTP === "true";

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your RentTrack account",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; background: #f3f4f6; color: #1f2937;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f3f4f6; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 40px; text-align: center;">
                        <img src="${origin}/images/landing/logo.png" alt="RentTrack" style="height: 56px; width: auto; margin-bottom: 16px;" />
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">RentTrack</h1>
                        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">HedgeHomes Realty and Brokerage</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 40px 30px;">
                        <h2 style="color: #111827; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Verify Your Email</h2>
                        <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px; font-size: 15px;">Please use the verification code below to complete your registration:</p>
                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px; width: 100%;">
                          <tr>
                            <td align="center">
                              <div style="display: inline-block; padding: 18px 48px; background: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; font-weight: 800; font-size: 32px; letter-spacing: 12px; color: #1d4ed8;">${otp}</div>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #4b5563; line-height: 1.7; margin: 0; font-size: 14px;">This code will expire in 15 minutes. If you did not create an account, please ignore this email.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} RentTrack. All rights reserved.</p>
                        <p style="color: #9ca3af; margin: 6px 0 0; font-size: 12px;">HedgeHomes Realty and Brokerage</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send verification email:", err);
      emailError = err instanceof Error ? err.message : "Failed to send verification email";
    }

    const responseBody: any = { success: true };
    if (emailError) {
      responseBody.emailError = emailError;
      responseBody.message = devShowOtp
        ? `Dev mode: verification code is ${otp}`
        : "Verification code generated, but email delivery failed. Please contact support or try again later.";
    } else {
      responseBody.message = "Verification code sent";
    }
    if (devShowOtp && !emailError) {
      responseBody.devOtp = otp;
    }
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ success: false, error: "Failed to send verification code" }, { status: 500 });
  }
}
