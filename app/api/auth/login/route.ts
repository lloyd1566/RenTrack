import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, initDatabase, findOrCreateAdmin, logAudit, updateUserPresence } from "@/lib/db";
import { regenerateSession } from "@/lib/security";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/auth-security";
import { validateApiRequest, withRateLimit } from "@/lib/api-security";
import bcrypt from "bcryptjs";
import { withSecurityHeaders, withCorsHeaders, getClientIp, sanitizeString } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const validation = validateApiRequest(request);
    if (validation) return validation;

    const rateLimit = await withRateLimit(request, `login:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    await initDatabase();
    await findOrCreateAdmin();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      const response = NextResponse.json({ success: false, error: "Missing email or password" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const sanitizedEmail = sanitizeString(String(email), 200).toLowerCase().trim();
    if (!sanitizedEmail.includes("@") || sanitizedEmail.length > 200) {
      const response = NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const rateLimitKey = `${getClientIp(request)}:${sanitizedEmail}`;
    const rateLimitStatus = checkRateLimit(rateLimitKey);

    if (!rateLimitStatus.allowed) {
      const waitMinutes = rateLimitStatus.lockedUntil ? Math.ceil((rateLimitStatus.lockedUntil - Date.now()) / 60000) : 15;
      const response = NextResponse.json({
        success: false,
        error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`,
        locked: true,
        retryAfter: rateLimitStatus.lockedUntil,
      }, { status: 429 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const user = await findUserByEmail(sanitizedEmail);
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      const response = NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const pwOk = await bcrypt.compare(String(password), user.password);
    if (!pwOk) {
      recordFailedAttempt(rateLimitKey);
      await logAudit(user.id, "login_failed", { email: user.email, reason: "invalid_password" }, getClientIp(request), request.headers.get("user-agent") || "unknown").catch(() => {});
      const response = NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    if (!user.emailVerified) {
      const response = NextResponse.json({ success: false, error: "Please verify your email address before logging in. Check your inbox for the verification code.", needsVerification: true, email: user.email, userId: user.id }, { status: 403 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    clearRateLimit(rateLimitKey);

    await updateUserPresence(user.id, { markLogin: true });
    await logAudit(user.id, "login_success", { email: user.email, role: user.role }, getClientIp(request), request.headers.get("user-agent") || "unknown").catch(() => {});

    const safeUser = { ...user };
    delete safeUser.password;
    const response = NextResponse.json({ success: true, user: safeUser });
    regenerateSession(response, user.id);
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error: any) {
    console.error("Login error:", error);
    const rawMessage = typeof error === "object" && error && "message" in error ? String((error as any).message) : "Login failed";
    const lowerMessage = rawMessage.toLowerCase();
    const friendlyMessage =
      lowerMessage.includes("does not exist") || lowerMessage.includes("relation") || lowerMessage.includes("table")
        ? "Database not initialized yet. Run scripts/supabase-schema.sql in Supabase SQL Editor first."
        : lowerMessage.includes("missing")
        ? `${rawMessage} — set this in Vercel: Project Settings → Environment Variables → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY`
        : lowerMessage.includes("invalid")
        ? "Invalid email or password"
        : rawMessage || "Login failed";
    const response = NextResponse.json({ success: false, error: friendlyMessage }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
