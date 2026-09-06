import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { getAdminSupabase, initDatabase, clearTenantUnitAssignment } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    await initDatabase();
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const tenantId = body.tenantId || body.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "Tenant ID is required" }, { status: 400 });
    }

    const { error: paymentsError } = await getAdminSupabase()
      .from("payments")
      .delete()
      .eq("tenant_id", tenantId);

    if (paymentsError) throw paymentsError;

    const { error: tenantError } = await getAdminSupabase()
      .from("tenants")
      .update({
        rent_amount: 0,
        status: "inactive",
        unit_id: null,
        property_name: null,
        unit_number: null,
        assignment_status: "",
      })
      .eq("id", tenantId);

    if (tenantError) throw tenantError;

    const { data: tenantRecord } = await getAdminSupabase()
      .from("tenants")
      .select("name, unit_id")
      .eq("id", tenantId)
      .maybeSingle();

    await clearTenantUnitAssignment(tenantId, tenantRecord?.name ?? null, tenantRecord?.unit_id ?? null);

    return NextResponse.json({ success: true, reset: true });
  } catch (error) {
    console.error("Reset tenant payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset tenant payments" }, { status: 500 });
  }
}
