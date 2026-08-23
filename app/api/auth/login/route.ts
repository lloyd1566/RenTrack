import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, initDatabase, findOrCreateAdmin, logAudit } from "@/lib/db";
import { setSessionCookie, regenerateSession } from "@/lib/security";
import { checkRateLimit, recordFailedAttempt, clearRateLimit, validatePasswordStrength } from "@/lib/auth-security";
import bcrypt from "bcryptjs";
import { withSecurityHeaders, withCorsHeaders, getClientIp } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing email or password" }, { status: 400 });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const rateLimitKey = `${getClientIp(request)}:${sanitizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const waitMinutes = rateLimit.lockedUntil ? Math.ceil((rateLimit.lockedUntil - Date.now()) / 60000) : 15;
      return NextResponse.json({
        success: false,
        error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`,
        locked: true,
        retryAfter: rateLimit.lockedUntil,
      }, { status: 429 });
    }

    const user = await findUserByEmail(sanitizedEmail);
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const pwOk = await bcrypt.compare(password, user.password);
    if (!pwOk) {
      recordFailedAttempt(rateLimitKey);
      await logAudit(user.id, "login_failed", { email: user.email, reason: "invalid_password" }, getClientIp(request), request.headers.get("user-agent") || "unknown").catch(() => {});
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ success: false, error: "Please verify your email address before logging in. Check your inbox for the verification code.", needsVerification: true, email: user.email, userId: user.id }, { status: 403 });
    }

    clearRateLimit(rateLimitKey);

    await logAudit(user.id, "login_success", { email: user.email, role: user.role }, getClientIp(request), request.headers.get("user-agent") || "unknown").catch(() => {});

    const safeUser = { ...user };
    delete safeUser.password;
    const response = NextResponse.json({ success: true, user: safeUser });
    regenerateSession(response, user.id, getClientIp(request));
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error: any) {
    console.error("Login error:", error);
    const rawMessage = typeof error === "object" && error && "message" in error ? String((error as any).message) : "Login failed";
    const lowerMessage = rawMessage.toLowerCase();
    const friendlyMessage =
      lowerMessage.includes("does not exist") || lowerMessage.includes("relation") || lowerMessage.includes("table")
        ? "Database not initialized yet. Run scripts/supabase-schema.sql in Supabase SQL Editor first."
        : lowerMessage.includes("invalid")
        ? "Invalid email or password"
        : rawMessage || "Login failed";
    return NextResponse.json({ success: false, error: friendlyMessage }, { status: 500 });
  }
}
