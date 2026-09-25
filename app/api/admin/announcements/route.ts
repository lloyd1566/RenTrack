import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { getAllUsers, createNotification } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    const users = await getAllUsers();
    const notifications = [];
    for (const user of users) {
      const notification = await createNotification({
        userId: user.id,
        title,
        message,
        type: "system",
        read: false,
      });
      notifications.push(notification);
    }

    const response = NextResponse.json({ success: true, count: notifications.length });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Broadcast announcement error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to send announcement" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
