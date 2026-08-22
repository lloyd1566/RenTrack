import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/security";
import { getMessages, markAllMessagesRead } from "@/lib/db";
import { requireAuth, withSecurityHeaders, withCorsHeaders, validateApiRequest, getClientIp } from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await params;
    const userId = auth.userId;
    const otherId = resolvedParams.id;

    const messages = await getMessages(userId, otherId);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const resolvedParams = await params;
    const otherId = resolvedParams.id;

    if (body.action === "markAllRead") {
      await markAllMessagesRead(otherId, auth.userId);
      await logAudit(auth.userId, "messages_marked_read", { otherId }, getClientIp(request), request.headers.get("user-agent") || "unknown");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update messages error:", error);
    return NextResponse.json({ success: false, error: "Failed to update messages" }, { status: 500 });
  }
}
