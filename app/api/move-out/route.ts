import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, initDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const { requireAuth } = await import("@/lib/api-security");
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const secureAuth = auth as any;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");

    let query = getAdminSupabase().from("move_out_requests").select("*");
    if (tenantId) query = query.eq("tenant_id", tenantId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, requests: data || [] });
  } catch (err) {
    console.error("Get move-out requests error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch move-out requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const { requireAuth } = await import("@/lib/api-security");
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const secureAuth = auth as any;
    const body = await request.json();
    const { reason } = body;

    if (!secureAuth.user?.role || !["tenant", "admin", "owner", "agent"].includes(secureAuth.user.role)) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const tenantId = secureAuth.userId;
    const { data: tenant } = await getAdminSupabase().from("tenants").select("id, name, unit_id, property_name").eq("id", tenantId).maybeSingle();
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const requestId = `move_out_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const { data: moveOutRequest, error } = await getAdminSupabase()
      .from("move_out_requests")
      .insert({
        id: requestId,
        tenant_id: tenantId,
        tenant_name: tenant.name,
        unit_id: tenant.unit_id,
        property_name: tenant.property_name,
        reason: reason || "Tenant requested to move out",
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, request: moveOutRequest });
  } catch (err) {
    console.error("Create move-out request error:", err);
    return NextResponse.json({ success: false, error: "Failed to create move-out request" }, { status: 500 });
  }
}
