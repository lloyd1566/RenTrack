import { NextRequest, NextResponse } from "next/server";
import { getUpload } from "@/lib/db";
import { getSessionUserId, getCurrentUser } from "@/lib/security";
import { withSecurityHeaders, withCorsHeaders } from "@/lib/security-headers";
import { logAudit } from "@/lib/db";

function getIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const upload = await getUpload(resolvedParams.id);
    if (!upload || !upload.data || upload.data.length === 0) {
      const response = NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const isPublicListingImage = upload.type === "property" || upload.type === "unit";
    const currentUser = await getCurrentUser(request);
    const userId = getSessionUserId(request);
    if (!isPublicListingImage && !currentUser) {
      const response = NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const canAccess = isPublicListingImage || upload.user_id === userId || ["admin", "owner", "agent"].includes(currentUser?.role || "");
    if (!canAccess) {
      const response = NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
      await logAudit(userId || "unknown", "upload_access_denied", { uploadId: resolvedParams.id }, getIp(request), request.headers.get("user-agent") || "unknown");
      return withSecurityHeaders(withCorsHeaders(request, response));
    }

    const buffer = Buffer.isBuffer(upload.data) ? upload.data : Buffer.from(upload.data);
    const response = new NextResponse(buffer, {
      headers: {
        "Content-Type": upload.mime_type || "application/octet-stream",
        "Cache-Control": isPublicListingImage ? "public, max-age=3600, immutable" : "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename="upload_${resolvedParams.id}"`,
      },
    });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Upload fetch error:", error);
    const response = NextResponse.json({ success: false, error: "Failed to fetch file" }, { status: 500 });
    return withSecurityHeaders(withCorsHeaders(request, response));
  }
}
