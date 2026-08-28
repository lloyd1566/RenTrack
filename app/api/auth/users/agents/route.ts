import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    // This endpoint is used by the public landing-page contact/chat forms.
    // Return only the fields a visitor needs; never expose account secrets.
    const users = await getAllUsers();
    const agents = users.filter((u: any) => u.role === "agent");
    const safeAgents = agents.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      idVerificationStatus: u.idVerificationStatus || "pending",
    }));
    const response = NextResponse.json({ success: true, users: safeAgents });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Get agents error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
