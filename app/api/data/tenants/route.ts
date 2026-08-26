import { NextRequest, NextResponse } from "next/server";
import { getTenants, createTenant, deleteTenant, syncTenantUnit } from "@/lib/db";
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

    const camelToSnake: Record<string, string> = {
      unitId: "unit_id",
      propertyName: "property_name",
      unitNumber: "unit_number",
      contractStart: "contract_start",
      contractEnd: "contract_end",
      rentAmount: "rent_amount",
      assignmentStatus: "assignment_status",
    };

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const snake = camelToSnake[key] || key;
      if (value === undefined || value === null) continue;
      cleaned[snake] = value;
    }

    const { data, error } = await getAdminSupabase()
      .from("tenants")
      .update(cleaned)
      .eq("id", tenantId)
      .select("*")
      .single();

    if (error) {
      const code = String((error as any)?.code || "");
      const message = String(error?.message || "");
      const details = String((error as any)?.details || "");

      if (code === "PGRST116" || message.includes("0 rows") || details.includes("0 rows")) {
        const { data: userRow, error: userError } = await getAdminSupabase()
          .from("users")
          .select("*")
          .eq("id", tenantId)
          .eq("role", "tenant")
          .maybeSingle();

        if (userError || !userRow) throw error;

        const { data: existingTenant } = await getAdminSupabase()
          .from("tenants")
          .select("*")
          .eq("id", tenantId)
          .maybeSingle();

        const mapTenant = (row: any) => sanitizeResponse({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          occupation: row.occupation,
          emergencyContact: row.emergency_contact,
          emergencyPhone: row.emergency_phone,
          unitId: row.unit_id,
          propertyName: row.property_name,
          unitNumber: row.unit_number,
          contractStart: row.contract_start,
          contractEnd: row.contract_end,
          rentAmount: row.rent_amount,
          status: row.status,
          assignmentStatus: row.assignment_status,
          createdBy: row.created_by,
          createdAt: row.created_at,
          avatarUrl: null,
          idVerificationUrl: null,
          idVerificationStatus: null,
        });

        if (!existingTenant) {
          const { error: insertError } = await getAdminSupabase().from("tenants").insert({
            id: tenantId,
            name: (userRow as any).name,
            email: (userRow as any).email,
            phone: (userRow as any).phone || null,
            address: (userRow as any).address || null,
            status: "active",
            ...cleaned,
          });
          if (insertError) throw insertError;
          const { data: inserted, error: insertedError } = await getAdminSupabase().from("tenants").select("*").eq("id", tenantId).single();
          if (insertedError) throw insertedError;
          return NextResponse.json({ success: true, tenant: mapTenant(inserted) });
        }

        const { data: relinked, error: relinkError } = await getAdminSupabase()
          .from("tenants")
          .update(cleaned)
          .eq("id", tenantId)
          .select("*")
          .single();
        if (relinkError) throw relinkError;
        return NextResponse.json({ success: true, tenant: mapTenant(relinked) });
      }

      if (code === "PGRST204" || message.includes("assignmentStatus") || details.includes("assignmentStatus") || (message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist"))) {
        const mapTenant = (row: any) => sanitizeResponse({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          occupation: row.occupation,
          emergencyContact: row.emergency_contact,
          emergencyPhone: row.emergency_phone,
          unitId: row.unit_id,
          propertyName: row.property_name,
          unitNumber: row.unit_number,
          contractStart: row.contract_start,
          contractEnd: row.contract_end,
          rentAmount: row.rent_amount,
          status: row.status,
          assignmentStatus: row.assignment_status,
          createdBy: row.created_by,
          createdAt: row.created_at,
          avatarUrl: null,
          idVerificationUrl: null,
          idVerificationStatus: null,
        });

        try {
          await getAdminSupabase().rpc("exec_sql", { sql: `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT '' CHECK (assignment_status IN ('', 'pending', 'confirmed', 'rejected'))`, params: [] });
        } catch {
          // ignore migration errors from cached RPC
        }
        const { data: retryData, error: retryError } = await getAdminSupabase()
          .from("tenants")
          .update(cleaned)
          .eq("id", tenantId)
          .select("*")
          .single();
        if (retryError) throw retryError;
        return NextResponse.json({ success: true, tenant: mapTenant(retryData) });
      }

      throw error;
    }

    const mapTenant = (row: any) => sanitizeResponse({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      occupation: row.occupation,
      emergencyContact: row.emergency_contact,
      emergencyPhone: row.emergency_phone,
      unitId: row.unit_id,
      propertyName: row.property_name,
      unitNumber: row.unit_number,
      contractStart: row.contract_start,
      contractEnd: row.contract_end,
      rentAmount: row.rent_amount,
      status: row.status,
      assignmentStatus: row.assignment_status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      avatarUrl: null,
      idVerificationUrl: null,
      idVerificationStatus: null,
    });

    if (cleaned.unit_id !== undefined || cleaned.assignment_status !== undefined) {
      await syncTenantUnit(tenantId, cleaned.unit_id || data.unit_id || null, cleaned.assignment_status || data.assignment_status || "");
    }
    return NextResponse.json({ success: true, tenant: mapTenant(data) });
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
