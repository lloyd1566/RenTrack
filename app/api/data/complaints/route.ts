import { NextRequest, NextResponse } from "next/server";
import { createComplaint, getComplaints, getComplaintById, updateComplaintStatus } from "@/lib/db";
import { requireAuth, validateApiRequest, withSecurityHeaders, withCorsHeaders, sanitizeObject, getClientIp } from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const sanitized = sanitizeObject(body, [
      { key: "targetType", type: "string", maxLength: 20 },
      { key: "targetId", type: "string", maxLength: 100 },
      { key: "subject", type: "string", maxLength: 200 },
      { key: "message", type: "string", maxLength: 2000 },
      { key: "priority", type: "string", maxLength: 20 },
    ]);

    if (!sanitized.targetType || !sanitized.targetId || !sanitized.subject || !sanitized.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const complaint = await createComplaint({
      tenantId: auth.userId,
      targetType: sanitized.targetType as "property" | "unit",
      targetId: sanitized.targetId,
      subject: sanitized.subject,
      message: sanitized.message,
      priority: sanitized.priority,
    });

    await logAudit(auth.userId, "complaint_created", { targetType: sanitized.targetType, targetId: sanitized.targetId, subject: sanitized.subject }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit complaint" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const complaints = await getComplaints(auth.user.role === "tenant" ? auth.userId : undefined);
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error("Get complaints error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    if (!["admin", "owner", "agent"].includes(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Not allowed to update complaints" }, { status: 403 });
    }

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { id, status, assignedTo } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Complaint ID and status are required" }, { status: 400 });
    }

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const complaint = await updateComplaintStatus(id, status, assignedTo);
    await logAudit(auth.userId, "complaint_updated", { complaintId: id, status }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error("Update complaint error:", error);
    return NextResponse.json({ success: false, error: "Failed to update complaint" }, { status: 500 });
  }
}
