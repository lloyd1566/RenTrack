import { NextRequest, NextResponse } from "next/server";
import { getTenants, createTenant, deleteTenant } from "@/lib/db";
import { getAdminSupabase } from "@/lib/db";
import {
  requireAuth, requireRole, validateApiRequest, withRateLimit,
  sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const tenants = await getTenants();
    return NextResponse.json({ success: true, tenants: tenants.map(t => sanitizeResponse(t)) });
  } catch (error) {
    console.error("Get tenants error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(request, `create_tenant:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const sanitized = sanitizeObject(body, [
      { key: "name", type: "string", maxLength: 200 },
      { key: "email", type: "string", maxLength: 200 },
      { key: "phone", type: "string", maxLength: 50 },
      { key: "address", type: "string", maxLength: 500 },
      { key: "occupation", type: "string", maxLength: 100 },
      { key: "emergencyContact", type: "string", maxLength: 200 },
      { key: "emergencyPhone", type: "string", maxLength: 50 },
      { key: "unitId", type: "string", maxLength: 100 },
      { key: "propertyName", type: "string", maxLength: 200 },
      { key: "unitNumber", type: "string", maxLength: 50 },
      { key: "contractStart", type: "string", maxLength: 20 },
      { key: "contractEnd", type: "string", maxLength: 20 },
      { key: "rentAmount", type: "number" },
    ]);

    if (!sanitized.name) {
      return NextResponse.json({ success: false, error: "Tenant name is required" }, { status: 400 });
    }

    const tenant = await createTenant(sanitized, auth.userId);
    await logAudit(auth.userId, "tenant_created", { tenantId: tenant.id, name: tenant.name }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, tenant: sanitizeResponse(tenant) });
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json({ success: false, error: "Failed to create tenant" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const { tenantId, ...updates } = body;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 });
    }

    const { data, error } = await getAdminSupabase()
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, tenant: sanitizeResponse(data) });
  } catch (error) {
    console.error("Patch tenant error:", error);
    return NextResponse.json({ success: false, error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 });
    }

    await deleteTenant(userId);
    await logAudit(auth.userId, "tenant_deleted", { tenantId: userId }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete tenant" }, { status: 500 });
  }
}
