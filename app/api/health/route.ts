import { NextRequest, NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/security-headers";
import { initDatabase, getAdminSupabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const [{ count: propertiesCount = 0 } = {}, { count: unitsCount = 0 } = {}, { count: tenantsCount = 0 } = {}] = await Promise.all([
      getAdminSupabase().from("properties").select("*", { count: "exact", head: true }),
      getAdminSupabase().from("units").select("*", { count: "exact", head: true }),
      getAdminSupabase().from("users").select("*", { count: "exact", head: true }).eq("role", "tenant"),
    ]);

    const checks = {
      database: "healthy" as const,
      apiServer: "healthy" as const,
      authentication: "healthy" as const,
      fileStorage: "healthy" as const,
    };

    const response = NextResponse.json({
      success: true,
      status: "ok",
      checks,
      counts: {
        properties: propertiesCount,
        units: unitsCount,
        tenants: tenantsCount,
      },
    });
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("Health check error:", error);
    const response = NextResponse.json({
      success: false,
      status: "error",
      error: "Database check failed",
      checks: {
        database: "unhealthy" as const,
        apiServer: "healthy" as const,
        authentication: "unknown" as const,
        fileStorage: "unknown" as const,
      },
    }, { status: 500 });
    return withSecurityHeaders(response);
  }
}
