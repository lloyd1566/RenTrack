import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "renttrack_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SESSION_SECRET = process.env.SESSION_SECRET || "renttrack-dev-session-secret-insecure";

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createSessionToken(userId: string, ip?: string) {
  const payload = {
    userId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    ...(ip ? { ip } : {}),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null, currentIp?: string): string | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as { userId?: string; exp?: number; ip?: string };
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;

    if (payload.ip && currentIp && payload.ip !== currentIp) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export function getSessionUserId(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  return verifySessionToken(token, ip || undefined);
}

export async function getCurrentUser(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) return null;
  const { findUserById } = await import("@/lib/db");
  const user = await findUserById(userId);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function regenerateSession(response: NextResponse, userId: string, ip?: string) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(userId, ip), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
