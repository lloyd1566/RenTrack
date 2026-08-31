import { NextRequest, NextResponse } from "next/server";
import { getAllRatings } from "@/lib/db";
import { requireAuth, requireRole, withSecurityHeaders, withCorsHeaders, sanitizeResponse } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const ratings = await getAllRatings();
    return NextResponse.json({ success: true, ratings: ratings.map((r) => sanitizeResponse(r)) });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch ratings" }, { status: 500 });
  }
}
