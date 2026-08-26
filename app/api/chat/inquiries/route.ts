import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, initDatabase } from "@/lib/db";
import { isSmtpConfigured, sendSystemEmail } from "@/lib/mail";
import { requireRole, getClientIp } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    let inquiries: any[] = [];
    try {
      const { data, error } = await getAdminSupabase()
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      inquiries = (data || []).map((row: any) => ({
        id: row.id,
        text: row.text,
        propertyId: row.property_id,
        senderName: row.sender_name,
        senderEmail: row.sender_email,
        senderPhone: row.sender_phone,
        status: row.status,
        createdAt: row.created_at,
        replyText: row.reply_text,
        repliedAt: row.replied_at,
        agentName: row.agent_name,
      }));
    } catch (err: any) {
      if (err?.message?.includes("schema cache") || err?.code === "PGRST205") {
        console.warn("chat_messages table not found, returning empty inquiries");
        inquiries = [];
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true, inquiries });
  } catch (err) {
    console.error("Get inquiries error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initDatabase();
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { id, status, replyText } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 });
    }

    const validStatuses = ["new", "read", "replied"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid inquiry status" }, { status: 400 });
    }
    try {
      const updates: Record<string, string> = { status };
      if (typeof replyText === "string" && replyText.trim()) {
        updates.reply_text = replyText.trim();
        updates.replied_at = new Date().toISOString();
        updates.agent_name = auth.user.name;
      }
      const { data: inquiry } = await getAdminSupabase().from("chat_messages").select("sender_email, sender_name, text").eq("id", id).maybeSingle();
      const { error } = await getAdminSupabase()
        .from("chat_messages")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      if (updates.reply_text && inquiry?.sender_email && isSmtpConfigured()) {
        await sendSystemEmail({ to: inquiry.sender_email, subject: `Reply to your RentTrack inquiry`, html: `<p>Hi ${inquiry.sender_name || "there"},</p><p>${updates.reply_text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p>Reply from ${auth.user.name}.</p>` });
      }
    } catch (err: any) {
      if (err?.message?.includes("schema cache") || err?.code === "PGRST205") {
        console.warn("chat_messages table not found, skipping update");
        return NextResponse.json({ success: true });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update inquiry error:", err);
    return NextResponse.json({ success: false, error: "Failed to update inquiry" }, { status: 500 });
  }
}
