import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { getAdminSupabase } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const tables = ["users", "properties", "units", "tenants", "payments", "notifications", "ratings", "complaints", "audit_logs"];
    let sqlContent = "-- RentTrack Database Backup\n";
    sqlContent += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      const { data, error } = await getAdminSupabase().from(table).select("*");
      if (error) {
        console.error(`Backup error for table ${table}:`, error);
        continue;
      }

      sqlContent += `-- Table: ${table}\n`;
      for (const row of data || []) {
        const columns = Object.keys(row).join(", ");
        const values = Object.values(row).map((v: any) => {
          if (v === null) return "NULL";
          if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
          return v;
        }).join(", ");
        sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      sqlContent += "\n";
    }

    const buffer = Buffer.from(sqlContent, "utf-8");
    const filename = `renttrack_backup_${new Date().toISOString().split("T")[0]}.sql`;

    const response = new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Backup error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to create backup" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
