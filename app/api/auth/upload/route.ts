import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/security";
import { sql, createNotification } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!["avatar", "id_verification"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid upload type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await sql`
      INSERT INTO uploads (id, user_id, type, data, mime_type, size, created_at)
      VALUES (${id}, ${userId}, ${type}, ${buffer}, ${file.type}, ${file.size}, NOW())
    `;

    const url = `/api/auth/upload/${id}`;

    if (type === "avatar") {
      await sql`UPDATE users SET avatar_url = ${url} WHERE id = ${userId}`;
    } else if (type === "id_verification") {
      await sql`UPDATE users SET id_verification_url = ${url}, id_verification_status = 'pending' WHERE id = ${userId}`;
      
      const uploader = await sql`SELECT name, email, role FROM users WHERE id = ${userId}`;
      const uploaderName = uploader[0]?.name || "A user";
      const uploaderRole = uploader[0]?.role || "user";
      
      const admins = await sql`SELECT id FROM users WHERE role IN ('admin', 'owner')`;
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "ID Upload Pending Review",
          message: `${uploaderName} (${uploaderRole}) has uploaded an ID for verification.`,
          type: "system",
        });
      }
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
