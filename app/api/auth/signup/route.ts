import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, initDatabase, findOrCreateAdmin, createLoginOtp, logAudit } from "@/lib/db";
import { sendEmail, getSiteUrl } from "@/lib/mail";
import { validatePasswordStrength } from "@/lib/auth-security";
import {
  validateApiRequest, withRateLimit, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const rateLimit = await withRateLimit(request, `signup:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { name, email, password, role, phone, address } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const allowedRoles = ["tenant", "agent", "owner"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 403 });
    }

    const sanitizedEmail = String(email).toLowerCase().trim().replace(/[^a-zA-Z0-9@._+-]/g, "");
    if (!sanitizedEmail.includes("@") || sanitizedEmail.length > 200) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ success: false, error: `Password too weak: ${strength.errors.join(", ")}` }, { status: 400 });
    }

    const existing = await findUserByEmail(sanitizedEmail);
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    const sanitizedData = sanitizeObject(
      { name, email: sanitizedEmail, password, role, phone, address },
      [
        { key: "name", type: "string", maxLength: 200 },
        { key: "email", type: "string", maxLength: 200 },
        { key: "role", type: "string", maxLength: 20 },
        { key: "phone", type: "string", maxLength: 50 },
        { key: "address", type: "string", maxLength: 500 },
      ]
    );

    const user = await createUser(sanitizedData.name, sanitizedData.email, password, sanitizedData.role, sanitizedData.phone, undefined, sanitizedData.address);
    const otp = await createLoginOtp(user.id, 15);

    const origin = getSiteUrl(request.nextUrl.origin);
    const devShowOtp = process.env.DEV_SHOW_OTP === "true";
    let emailError: string | null = null;

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
                        <h2 style="color: #111827; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Welcome to RentTrack!</h2>
                        <p style="color: #4b5563; line-height: 1.7; margin: 0 0 8px; font-size: 15px;">Hello <strong>${sanitizedData.name}</strong>,</p>
                        <p style="color: #4b5563; line-height: 1.7; margin: 0 0 24px; font-size: 15px;">Thank you for creating an account. Please use the verification code below to complete your registration:</p>
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

    const responseBody: any = { success: true, needsOtp: true, email: user.email, userId: user.id };
    if (emailError) {
      responseBody.emailError = emailError;
      responseBody.message = devShowOtp
        ? `Dev mode: verification code is ${otp}`
        : "Account created, but we could not send the verification email. Please contact support or try again later.";
    } else {
      responseBody.message = "Account created! Please check your email for the verification code.";
    }
    if (devShowOtp && !emailError) {
      responseBody.devOtp = otp;
    }
    const response = NextResponse.json(responseBody);
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}
