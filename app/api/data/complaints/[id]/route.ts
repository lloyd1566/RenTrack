import { NextRequest, NextResponse } from "next/server";
import { getComplaintById } from "@/lib/db";
import { requireAuth } from "@/lib/api-security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const complaint = await getComplaintById(id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error("Get complaint error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch complaint" }, { status: 500 });
  }
}
