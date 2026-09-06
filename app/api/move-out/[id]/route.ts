import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, initDatabase } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    await initDatabase();
    const { requireRole } = await import("@/lib/api-security");
    const auth = await requireRole(request, ["admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const secureAuth = auth as any;
    const body = await request.json();
    const { id, status } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { data: moveOutRequest, error: fetchError } = await getAdminSupabase()
      .from("move_out_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !moveOutRequest) {
      return NextResponse.json({ success: false, error: "Move-out request not found" }, { status: 404 });
    }

    const { data: updatedRequest, error: updateError } = await getAdminSupabase()
      .from("move_out_requests")
      .update({
        status,
        reviewed_by: secureAuth.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    if (status === "approved") {
      const { data: tenantRecord } = await getAdminSupabase()
        .from("tenants")
        .select("name, unit_id")
        .eq("id", moveOutRequest.tenant_id)
        .maybeSingle();

      await getAdminSupabase()
        .from("tenants")
        .update({
          status: "inactive",
          unit_id: null,
          property_name: null,
          unit_number: null,
          assignment_status: "",
          rent_amount: 0,
        })
        .eq("id", moveOutRequest.tenant_id);

      await getAdminSupabase()
        .from("units")
        .update({ status: "vacant", tenant_id: null, tenant_name: null })
        .eq("id", moveOutRequest.unit_id ?? tenantRecord?.unit_id ?? "__missing__");
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (err) {
    console.error("Review move-out request error:", err);
    return NextResponse.json({ success: false, error: "Failed to review move-out request" }, { status: 500 });
  }
}
