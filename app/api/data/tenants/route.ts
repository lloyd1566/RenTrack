import { NextRequest, NextResponse } from "next/server";
import { getTenants, createTenant } from "@/lib/db";

export async function GET() {
  try {
    const tenants = await getTenants();
    return NextResponse.json({ success: true, tenants });
  } catch (error) {
    console.error("Get tenants error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, userId } = await request.json();
    const tenant = await createTenant(data, userId);
    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json({ success: false, error: "Failed to create tenant" }, { status: 500 });
  }
}
