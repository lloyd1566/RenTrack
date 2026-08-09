import { initDatabase, findOrCreateAdmin } from "@/lib/db";
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

    await initDatabase();
    const admin = await findOrCreateAdmin();
    const response = NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json({ success: false, error: "Database initialization failed" }, { status: 500 });
  }
}
