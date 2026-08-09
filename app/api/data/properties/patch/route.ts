import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  requireRole, validateApiRequest, withRateLimit,
  sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

const ALLOWED_PROPERTY_FIELDS = [
  "name", "location", "type", "units", "occupied_units",
  "monthly_revenue", "status", "image_url"
];

export async function PATCH(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(request, `update_property:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { id, data } = await request.json();
    if (!id || !data || typeof data !== "object") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      if (!ALLOWED_PROPERTY_FIELDS.includes(dbKey)) {
        await logAudit(auth.userId, "suspicious_update_attempt", { field: dbKey, propertyId: id }, auth.ip, auth.userAgent);
        continue;
      }
      fields.push(`${dbKey} = $${idx++}`);
      values.push(val);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    values.push(id);
    await sql(`UPDATE properties SET ${fields.join(", ")} WHERE id = $${idx}` as any, ...values);
    await logAudit(auth.userId, "property_updated", { propertyId: id, fields: fields.length }, auth.ip, auth.userAgent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update property error:", error);
    return NextResponse.json({ success: false, error: "Failed to update property" }, { status: 500 });
  }
}
