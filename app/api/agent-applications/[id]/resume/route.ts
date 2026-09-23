import { NextRequest, NextResponse } from "next/server";
import { getAgentApplicationResume, initDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    try {
      const resume = await getAgentApplicationResume(id);
      if (!resume.resume_data) return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
      // Convert Buffer to a sliced ArrayBuffer for NextResponse body compatibility
      const bufferSlice = new Uint8Array(resume.resume_data);
      const arrayBuffer = bufferSlice.buffer.slice(bufferSlice.byteOffset, bufferSlice.byteOffset + bufferSlice.byteLength);
      return new NextResponse(arrayBuffer, { headers: { "Content-Type": resume.resume_mime_type || "application/octet-stream", "Content-Disposition": `inline; filename="${resume.resume_name || "resume"}"` } });
    } catch (err:any) {
      // If the table is missing, attempt to initialize the schema and retry once
      if (err?.message?.includes("public.agent_applications")) {
        console.warn("Table missing, initializing database schema...");
        await initDatabase();
        // Retry fetching the resume after init
        const resume = await getAgentApplicationResume(id);
        if (!resume.resume_data) return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
        const bufferSlice = new Uint8Array(resume.resume_data);
        const arrayBuffer = bufferSlice.buffer.slice(bufferSlice.byteOffset, bufferSlice.byteOffset + bufferSlice.byteLength);
        return new NextResponse(arrayBuffer, { headers: { "Content-Type": resume.resume_mime_type || "application/octet-stream", "Content-Disposition": `inline; filename="${resume.resume_name || "resume"}"` } });
      }
      throw err;
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load resume" }, { status: 500 });
  }
}
