import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-security";
import { createNotification, getAdminSupabase, sendMessage } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["agent", "admin", "owner"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { title, message, type, recipientRole } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    const targetRole = recipientRole === "owner" ? "owner" : "admin";
    const { data: users } = await getAdminSupabase()
      .from("users")
      .select("id")
      .eq("role", targetRole);

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: `No ${targetRole}s found to notify` }, { status: 404 });
    }

    await Promise.all(
      users.flatMap((user: any) => [
        createNotification({
          userId: user.id,
          title,
          message,
          type: type || "system",
          read: false,
        }),
        sendMessage(auth.userId, user.id, title, message),
      ])
    );

    return NextResponse.json({ success: true, notifiedCount: users.length });
  } catch (error) {
    console.error("Send to admins error:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}
