import { initDatabase, findOrCreateAdmin, findOrCreateOwner } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production";

    if (!isDev) {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.INIT_SECRET_TOKEN;

      if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const initResult = await initDatabase();
    console.log("[init] database init result:", initResult);
    const adminResult = await findOrCreateAdmin();
    console.log("[init] admin result:", adminResult);
    if (process.env.OWNER_PASSWORD) {
      const ownerResult = await findOrCreateOwner();
      console.log("[init] owner result:", ownerResult);
    }
    const response = NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      admin: adminResult ? { email: adminResult.email, name: adminResult.name } : null,
    });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Init error:", error);
    const message = error instanceof Error ? error.message : "Database initialization failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
