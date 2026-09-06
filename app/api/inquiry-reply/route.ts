import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, initDatabase, findUserById } from "@/lib/db";
import { isSmtpConfigured, sendSystemEmail, createRentTrackEmailTemplate } from "@/lib/mail";
import { withSecurityHeaders, withCorsHeaders, validateApiRequest, checkRequestSize } from "@/lib/api-security";
import { getClientIp, sanitizeString } from "@/lib/security-headers";

const MAX_REPLY_LENGTH = 5000;

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      const response = NextResponse.json({ success: false, error: "ID and token are required" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const sanitizedId = sanitizeString(id, 128);
    const sanitizedToken = sanitizeString(token, 256);

    if (!sanitizedId || !sanitizedToken) {
      const response = NextResponse.json({ success: false, error: "Invalid inquiry reference" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const { data, error } = await getAdminSupabase()
      .from("chat_messages")
      .select("*")
      .eq("id", sanitizedId)
      .eq("reply_token", sanitizedToken)
      .maybeSingle();

    if (error || !data) {
      const response = NextResponse.json({ success: false, error: "Invalid or expired reply link" }, { status: 404 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const response = NextResponse.json({
      success: true,
      inquiry: {
        id: data.id,
        text: data.text,
        senderName: data.sender_name,
        senderEmail: data.sender_email,
        replyText: data.reply_text,
        repliedAt: data.replied_at,
        visitorReply: data.visitor_reply,
        visitorRepliedAt: data.visitor_replied_at,
      },
    });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (err) {
    console.error("Get inquiry reply error:", err);
    const response = NextResponse.json({ success: false, error: "Failed to fetch inquiry" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}

export async function POST(request: NextRequest) {
  try {
    const validationError = validateApiRequest(request);
    if (validationError) return validationError;

    if (!checkRequestSize(request)) {
      const response = NextResponse.json({ success: false, error: "Request too large" }, { status: 413 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const rateLimit = await (await import("@/lib/api-security")).withRateLimit(request, `inquiry_reply:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    await initDatabase();
    const body = await request.json();
    const { id, token, reply } = body;

    if (!id || !token || typeof reply !== "string") {
      const response = NextResponse.json({ success: false, error: "ID, token, and reply are required" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const sanitizedId = sanitizeString(String(id), 128);
    const sanitizedToken = sanitizeString(String(token), 256);
    const sanitizedReply = sanitizeString(reply, MAX_REPLY_LENGTH).trim();

    if (!sanitizedId || !sanitizedToken || !sanitizedReply) {
      const response = NextResponse.json({ success: false, error: "ID, token, and reply are required" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const { data, error } = await getAdminSupabase()
      .from("chat_messages")
      .update({
        visitor_reply: sanitizedReply,
        visitor_replied_at: new Date().toISOString(),
      })
      .eq("id", sanitizedId)
      .eq("reply_token", sanitizedToken)
      .select("*")
      .single();

    if (error || !data) {
      const response = NextResponse.json({ success: false, error: "Invalid or expired reply link" }, { status: 404 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    let emailSent = false;
    try {
      if (isSmtpConfigured()) {
        const agent = data.agent_id ? await findUserById(data.agent_id) : null;
        const agentEmail = agent?.email;
        if (agentEmail) {
          const html = createRentTrackEmailTemplate({
            title: "New Visitor Reply",
            body: `A visitor has replied to an inquiry.<br /><br /><strong>Visitor:</strong> ${data.sender_name || "Visitor"}<br /><strong>Email:</strong> ${data.sender_email}`,
            messageBlock: reply.trim(),
            footerNote: "Log in to the dashboard to view and respond to the full conversation.",
          });
          await sendSystemEmail({
            to: agentEmail,
            subject: `New reply from ${data.sender_name || "visitor"}`,
            html,
            text: `A visitor has replied to an inquiry.\n\nVisitor: ${data.sender_name || "Visitor"}\nEmail: ${data.sender_email}\n\n---\n${reply.trim()}\n---\n\nLog in to the dashboard to view and respond to the full conversation.`,
          });
          emailSent = true;
        }
      }
    } catch (mailErr) {
      console.error("[InquiryReply] Failed to send notification email:", mailErr);
    }

    const response = NextResponse.json({ success: true, emailSent });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (err) {
    console.error("Submit inquiry reply error:", err);
    const response = NextResponse.json({ success: false, error: "Failed to submit reply" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
