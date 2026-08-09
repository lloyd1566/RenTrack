import { NextRequest, NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/security-headers";
import { sql, initDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const properties = await sql`SELECT COUNT(*) AS count FROM properties`;
    const units = await sql`SELECT COUNT(*) AS count FROM units`;
    const tenants = await sql`SELECT COUNT(*) AS count FROM users WHERE role = 'tenant'`;
    const response = NextResponse.json({
      success: true,
      status: "ok",
      counts: {
        properties: properties[0]?.count ?? 0,
        units: units[0]?.count ?? 0,
        tenants: tenants[0]?.count ?? 0,
      },
    });
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ success: false, status: "error", error: "Database check failed" }, { status: 500 });
  }
}
