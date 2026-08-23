import { NextRequest, NextResponse } from "next/server";
import { getUpload, getAdminSupabase, supabase } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const upload = await getUpload(resolvedParams.id);
    if (!upload || !upload.data || upload.data.length === 0) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const buffer = Buffer.isBuffer(upload.data) ? upload.data : Buffer.from(upload.data);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": upload.mime_type || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Upload fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch file" }, { status: 500 });
  }
}
