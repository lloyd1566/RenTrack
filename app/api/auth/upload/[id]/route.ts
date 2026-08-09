import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, getCurrentUser } from "@/lib/security";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const isAdminOrOwner = currentUser.role === "admin" || currentUser.role === "owner";

    let result;
    if (isAdminOrOwner) {
      result = await sql`
        SELECT data, mime_type FROM uploads WHERE id = ${resolvedParams.id}
      `;
    } else {
      result = await sql`
        SELECT data, mime_type FROM uploads WHERE id = ${resolvedParams.id} AND user_id = ${currentUser.id}
      `;
    }

    const upload = result[0];
    if (!upload) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    return new NextResponse(upload.data, {
      headers: {
        "Content-Type": upload.mime_type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Upload fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch file" }, { status: 500 });
  }
}
