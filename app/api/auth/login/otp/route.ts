import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, initDatabase, findOrCreateAdmin } from "@/lib/db";
import { regenerateSession } from "@/lib/security";
import { withSecurityHeaders, withCorsHeaders, getClientIp } from "@/lib/security-headers";
import { logAudit } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const pwOk = await bcrypt.compare(password, user.password);
    if (!pwOk) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ success: false, error: "Please verify your email address before logging in.", needsVerification: true }, { status: 403 });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json({ success: true, skipOtp: true, userId: user.id, user: safeUser });
    regenerateSession(response, user.id, getClientIp(request));

    try {
      await logAudit(user.id, "login_success", { email: user.email, role: user.role }, getClientIp(request), request.headers.get("user-agent") || "unknown");
    } catch {}

    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Send login OTP error:", error);
    return NextResponse.json({ success: false, error: "Failed to send verification code" }, { status: 500 });
  }
}
