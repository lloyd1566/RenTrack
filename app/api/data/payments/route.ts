import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentsForUser,
  createPayment,
  updatePayment,
  findUserById,
  createNotification,
} from "@/lib/db";
import { getSessionUserId } from "@/lib/security";
import { sendEmail, isSmtpConfigured } from "@/lib/mail";
import { formatCurrency } from "@/lib/utils";
import {
  requireAuth, requireRole, validateApiRequest, withRateLimit,
  sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const payments = await getPaymentsForUser(auth.userId, auth.user.role);
    return NextResponse.json({ success: true, payments: payments.map(p => sanitizeResponse(p)) });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(request, `create_payment:${getClientIp(request)}`);
    if (rateLimit) return rateLimit;

    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const user = auth.user;
    if (!["tenant", "agent", "admin", "owner"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Not allowed to submit payments" }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body.data || body, [
      { key: "tenantId", type: "string", maxLength: 100 },
      { key: "tenantName", type: "string", maxLength: 200 },
      { key: "unitId", type: "string", maxLength: 100 },
      { key: "propertyName", type: "string", maxLength: 200 },
      { key: "amountPaid", type: "number" },
      { key: "amountDue", type: "number" },
      { key: "balance", type: "number" },
      { key: "paymentDate", type: "string", maxLength: 20 },
      { key: "dueDate", type: "string", maxLength: 20 },
      { key: "status", type: "string", maxLength: 20 },
      { key: "paymentMethod", type: "string", maxLength: 20 },
      { key: "notes", type: "string", maxLength: 500 },
      { key: "receiptUrl", type: "string", maxLength: 10000 },
    ]);

    if (!sanitized.amountPaid || sanitized.amountPaid <= 0) {
      return NextResponse.json({ success: false, error: "Valid payment amount is required" }, { status: 400 });
    }

    const targetTenantId = user.role === "tenant" ? user.id : (body.tenantId || user.id);
    const targetTenant = await findUserById(targetTenantId);
    const tenantName = targetTenant?.name || sanitized.tenantName || user.name;

    const payment = await createPayment({
      ...sanitized,
      tenantId: targetTenantId,
      tenantName,
      createdBy: user.id,
    }, user.id);

    try {
      await createNotification({
        userId: targetTenantId,
        title: "Payment Receipt Submitted",
        message: `A payment of ${formatCurrency(payment.amount_paid)} was submitted for you. It is pending verification.`,
        type: "payment"
      });
    } catch (err) {
      console.error("Failed to create in-app notification:", err);
    }

    try {
      if (targetTenant?.email && isSmtpConfigured()) {
        const subject = "Payment receipt received";
        const html = `<p>Hi ${tenantName},</p><p>A payment of <strong>${formatCurrency(payment.amount_paid)}</strong> was submitted for you. It is pending verification by our team.</p><p>Receipt ID: <code>${payment.id}</code></p>`;
        await sendEmail({ to: targetTenant.email, subject, html, bcc: process.env.SMTP_USER });
      }
    } catch (err) {
      console.error("Failed to send payment notification email:", err);
    }

    await logAudit(auth.userId, "payment_created", { paymentId: payment.id, amount: payment.amount_paid }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, payment: sanitizeResponse(payment) });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner", "agent"]);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const { id, data } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 });
    }

    const sanitized = sanitizeObject(data, [
      { key: "status", type: "string", maxLength: 20 },
      { key: "notes", type: "string", maxLength: 500 },
      { key: "verifiedBy", type: "string", maxLength: 100 },
    ]);

    const payment = await updatePayment(id, sanitized);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }
    await logAudit(auth.userId, "payment_updated", { paymentId: id, updates: Object.keys(sanitized) }, auth.ip, auth.userAgent);
    return NextResponse.json({ success: true, payment: sanitizeResponse(payment) });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment" }, { status: 500 });
  }
}
