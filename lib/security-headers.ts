import { NextRequest, NextResponse } from "next/server";

// Allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
];

// CSRF token storage (in production, use Redis or database)
const csrfStore = new Map<string, { token: string; exp: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = `${sessionId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  csrfStore.set(sessionId, { token, exp: Date.now() + 60 * 60 * 1000 });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const record = csrfStore.get(sessionId);
  if (!record) return false;
  if (Date.now() > record.exp) {
    csrfStore.delete(sessionId);
    return false;
  }
  return record.token === token;
}

export function withCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
  return response;
}

export function handleCorsPreflight(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return withCorsHeaders(new NextRequest("http://localhost"), response);
}

export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .slice(0, maxLength);
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, fields: { key: string; type: "string" | "number" | "boolean"; maxLength?: number }[]): T {
  const sanitized: any = {};
  for (const field of fields) {
    if (obj[field.key] === undefined || obj[field.key] === null) continue;
    if (field.type === "string") {
      sanitized[field.key] = sanitizeString(String(obj[field.key]), field.maxLength);
    } else if (field.type === "number") {
      const num = Number(obj[field.key]);
      sanitized[field.key] = isNaN(num) ? 0 : num;
    } else if (field.type === "boolean") {
      sanitized[field.key] = Boolean(obj[field.key]);
    }
  }
  return sanitized;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

export function validateContentType(request: NextRequest, allowedTypes = ["application/json"]): boolean {
  const contentType = request.headers.get("content-type") || "";
  return allowedTypes.some((type) => contentType.includes(type));
}

export function checkRequestSize(request: NextRequest, maxSizeBytes = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return false;
  }
  return true;
}

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self)");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // Preserve an explicit cache policy (for example, public listing images)
  // while keeping the secure no-store default for other API responses.
  if (!response.headers.has("Cache-Control")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  }
  if (!response.headers.has("Pragma")) response.headers.set("Pragma", "no-cache");
  if (!response.headers.has("Expires")) response.headers.set("Expires", "0");
  return response;
}
