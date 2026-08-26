import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-security";
import { getAdminSupabase } from "@/lib/db";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;

    if (!file) {
      const response = NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    if (!type || !["image", "audio"].includes(type)) {
      const response = NextResponse.json({ success: false, error: "Invalid attachment type" }, { status: 400 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || (type === "image" ? "jpg" : "webm");
    const path = `message-attachments/${auth.userId}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

    const adminClient = getAdminSupabase();
    let { error: uploadError } = await adminClient.storage
      .from("message-attachments")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError?.message?.toLowerCase().includes("bucket not found")) {
      const { error: bucketError } = await adminClient.storage.createBucket("message-attachments", { public: true });
      if (!bucketError || bucketError.message.toLowerCase().includes("already exists")) {
        ({ error: uploadError } = await adminClient.storage
          .from("message-attachments")
          .upload(path, buffer, { contentType: file.type, upsert: true }));
      }
    }

    if (uploadError) {
      const response = NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` }, { status: 500 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const { data: publicData } = adminClient.storage
      .from("message-attachments")
      .getPublicUrl(path);

    const response = NextResponse.json({ success: true, url: publicData.publicUrl });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Message attachment upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    const response = NextResponse.json({ success: false, error: message }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
