import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, getCurrentUser } from "@/lib/security";
import { getConversations, getMessages, sendMessage, markAllMessagesRead, getUnreadMessageCount } from "@/lib/db";
import { requireAuth, withSecurityHeaders, withCorsHeaders, validateApiRequest, getClientIp } from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const userId = auth.userId;
    const url = new URL(request.url);
    const countOnly = url.searchParams.get("count") === "true";

    if (countOnly) {
      const count = await getUnreadMessageCount(userId);
      return NextResponse.json({ success: true, count });
    }

    const conversations = await getConversations(userId);
    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const { receiverId, subject, body: messageBody } = body;

    if (!receiverId || !messageBody) {
      return NextResponse.json({ success: false, error: "Receiver and message body are required" }, { status: 400 });
    }

    const message = await sendMessage(auth.userId, receiverId, subject || "", messageBody);
    await logAudit(auth.userId, "message_sent", { receiverId, subject }, getClientIp(request), request.headers.get("user-agent") || "unknown");

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
