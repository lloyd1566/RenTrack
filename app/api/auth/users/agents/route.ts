import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import { getCurrentUser } from "@/lib/security";
import { sanitizeResponse, withSecurityHeaders, withCorsHeaders } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const users = await getAllUsers();
    const agents = users.filter((u: any) => u.role === "agent");
    const safeAgents = agents.map((u: any) => sanitizeResponse(u));
    return NextResponse.json({ success: true, users: safeAgents });
  } catch (error) {
    console.error("Get agents error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 });
  }
}
