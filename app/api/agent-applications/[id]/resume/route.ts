import { NextRequest, NextResponse } from "next/server";
import { getAgentApplicationResume } from "@/lib/db";
import { requireRole } from "@/lib/api-security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const resume = await getAgentApplicationResume(id);
    if (!resume.resume_data) return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    // Convert Buffer to a sliced ArrayBuffer for NextResponse body compatibility
    const bufferSlice = new Uint8Array(resume.resume_data);
    const arrayBuffer = bufferSlice.buffer.slice(bufferSlice.byteOffset, bufferSlice.byteOffset + bufferSlice.byteLength);
    return new NextResponse(arrayBuffer, { headers: { "Content-Type": resume.resume_mime_type || "application/octet-stream", "Content-Disposition": `inline; filename="${resume.resume_name || "resume"}"` } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load resume" }, { status: 500 });
  }
}
