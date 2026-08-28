import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentsForUser,
  createPayment,
  updatePayment,
  findUserById,
  getAllUsers,
  getTenants,
  createNotification,
  getUnits,
} from "@/lib/db";
import { sendEmail, isSmtpConfigured } from "@/lib/mail";
import { formatCurrency } from "@/lib/utils";
import {
  requireAuth, requireRole, validateApiRequest, withRateLimit,
  sanitizeResponse, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit, verifyUserPaymentPin } from "@/lib/db";
import { randomBytes } from "crypto";

function buildAutomaticReceiptUrl(details: { id: string; amount: number; date: string; method: string; tenant: string; property: string; unit: string; notes: string }) {
  const escapeXml = (value: string) => value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] || character));
  const line = (label: string, value: string, y: number) => `<text x="56" y="${y}" font-family="Arial, sans-serif" font-size="18" fill="#334155"><tspan font-weight="700">${escapeXml(label)}</tspan><tspan dx="12">${escapeXml(value.slice(0, 54))}</tspan></text>`;
  const paymentType = details.notes.toLowerCase().includes("advance") ? "Advance payment" : "Regular payment";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="620" viewBox="0 0 760 620"><rect width="760" height="620" rx="24" fill="#ffffff"/><rect width="760" height="116" rx="24" fill="#2563eb"/><rect y="88" width="760" height="28" fill="#2563eb"/><text x="56" y="58" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">RentTrack</text><text x="56" y="91" font-family="Arial, sans-serif" font-size="16" fill="#dbeafe">Payment receipt</text><text x="704" y="70" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#dbeafe">PENDING VERIFICATION</text>${line("Receipt ID", details.id, 168)}${line("Tenant", details.tenant, 208)}${line("Property", details.property || "Rental property", 248)}${line("Unit", details.unit || "Not assigned", 288)}${line("Payment type", paymentType, 328)}${line("Payment method", details.method, 368)}${line("Date", details.date, 408)}<line x1="56" y1="444" x2="704" y2="444" stroke="#e2e8f0" stroke-width="2"/><text x="56" y="500" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Amount paid</text><text x="704" y="505" text-anchor="end" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#16a34a">${escapeXml(formatCurrency(details.amount))}</text><text x="56" y="565" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Keep this receipt for your records. The payment will be updated after confirmation.</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

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
    const paymentInput = body.data || body;
    const submittedPaymentPin = body.paymentPin ?? paymentInput.paymentPin;
    if (submittedPaymentPin !== undefined && (typeof submittedPaymentPin !== "string" || submittedPaymentPin.length > 10)) {
      return NextResponse.json({ success: false, error: "Invalid payment PIN" }, { status: 400 });
    }
    const sanitized = sanitizeObject(paymentInput, [
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
      { key: "paymentMethodNote", type: "string", maxLength: 100 },
      { key: "bankName", type: "string", maxLength: 100 },
      { key: "accountNumber", type: "string", maxLength: 100 },
      { key: "accountHolder", type: "string", maxLength: 200 },
      { key: "cardLast4", type: "string", maxLength: 4 },
      { key: "cardExpiry", type: "string", maxLength: 7 },
      { key: "notes", type: "string", maxLength: 500 },
      { key: "receiptUrl", type: "string", maxLength: 10000 },
      { key: "paymentPin", type: "string", maxLength: 10 },
    ]);

    const amountPaid = Number(sanitized.amountPaid);
    if (!amountPaid || amountPaid <= 0) {
      return NextResponse.json({ success: false, error: "Valid payment amount is required" }, { status: 400 });
    }

    if (amountPaid > 1000000) {
      return NextResponse.json({ success: false, error: "Payment amount exceeds maximum allowed" }, { status: 400 });
    }

    const targetTenantId = user.role === "tenant" ? user.id : (sanitized.tenantId || user.id);

    if (user.role === "tenant" && targetTenantId !== user.id) {
      await logAudit(auth.userId, "payment_cross_tenant_blocked", { targetTenantId, userRole: user.role }, auth.ip, auth.userAgent);
      return NextResponse.json({ success: false, error: "You can only submit payments for your own account" }, { status: 403 });
    }

    const targetTenant = await findUserById(targetTenantId);
    if (!targetTenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    if (submittedPaymentPin) {
      const pinValid = await verifyUserPaymentPin(targetTenantId, String(submittedPaymentPin));
      if (!pinValid) {
        await logAudit(auth.userId, "payment_pin_invalid", { targetTenantId }, auth.ip, auth.userAgent);
        return NextResponse.json({ success: false, error: "Invalid payment PIN" }, { status: 403 });
      }
    }

    const tenants = await getTenants();
    const tenantRecord = tenants.find(t => t.id === targetTenantId);
    const tenantName = targetTenant?.name || sanitized.tenantName || user.name;
    const unitId = sanitized.unitId || tenantRecord?.unitId || "";
    const propertyName = sanitized.propertyName || tenantRecord?.propertyName || "";

    let unitRentAmount = 0;
    if (unitId) {
      const units = await getUnits();
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        unitRentAmount = Number(unit.rentAmount) || 0;
      }
    }
    if (!unitRentAmount && tenantRecord) {
      unitRentAmount = Number(tenantRecord.rentAmount) || 0;
    }

    const serverAmountDue = unitRentAmount;
    const serverBalance = Math.max(0, serverAmountDue - amountPaid);

    const paymentId = `pay_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const paymentDate = sanitized.paymentDate || new Date().toISOString().split("T")[0];
    const paymentNotes = sanitized.notes || "Payment submitted";
    const automaticReceiptUrl = sanitized.receiptUrl || buildAutomaticReceiptUrl({
      id: paymentId,
      amount: amountPaid,
      date: paymentDate,
      method: sanitized.paymentMethod || "other",
      tenant: tenantName,
      property: propertyName,
      unit: tenantRecord?.unitNumber || unitId,
      notes: paymentNotes,
    });
    const payment = await createPayment({
      id: paymentId,
      tenantId: targetTenantId,
      tenantName,
      unitId,
      propertyName,
      amountPaid,
      amountDue: serverAmountDue,
      balance: serverBalance,
      paymentDate,
      dueDate: sanitized.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending",
      paymentMethod: sanitized.paymentMethod || "other",
      paymentMethodNote: sanitized.paymentMethodNote || null,
      bankName: sanitized.bankName || null,
      accountNumber: sanitized.accountNumber || null,
      accountHolder: sanitized.accountHolder || null,
      cardLast4: sanitized.cardLast4 || null,
      cardExpiry: sanitized.cardExpiry || null,
      notes: paymentNotes,
      receiptUrl: automaticReceiptUrl,
      createdBy: user.id,
    }, user.id);

    try {
      await createNotification({
        userId: targetTenantId,
        title: "Payment Receipt Submitted",
        message: `A payment of ${formatCurrency(amountPaid)} was submitted for you. It is pending verification.`,
        type: "payment"
      });
    } catch (err) {
      console.error("Failed to create in-app notification:", err);
    }

    // All payment reviewers get the same work item so a tenant submission is
    // visible to the owner, agent, and administrator without a manual upload.
    try {
      const reviewers = (await getAllUsers()).filter((candidate: any) => ["admin", "owner", "agent"].includes(candidate.role));
      await Promise.all(reviewers.map((reviewer: any) => createNotification({
        userId: reviewer.id,
        title: "New Payment Pending Verification",
        message: `${tenantName} submitted ${formatCurrency(amountPaid)} for verification.`,
        type: "payment",
      })));
    } catch (err) {
      console.error("Failed to notify agents about payment:", err);
    }

    try {
      if (targetTenant?.email && isSmtpConfigured()) {
        const subject = "Payment receipt received";
        const html = `<p>Hi ${tenantName},</p><p>A payment of <strong>${formatCurrency(amountPaid)}</strong> was submitted for you. It is pending verification by our team.</p><p>Receipt ID: <code>${payment.id}</code></p>`;
        await sendEmail({ to: targetTenant.email, subject, html, bcc: process.env.SMTP_USER });
      }
    } catch (err) {
      console.error("Failed to send payment notification email:", err);
    }

    await logAudit(auth.userId, "payment_created", { paymentId: payment.id, amount: amountPaid, method: sanitized.paymentMethod }, auth.ip, auth.userAgent);
    const response = NextResponse.json({ success: true, payment: sanitizeResponse(payment) });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "owner", "agent", "tenant"]);
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
      { key: "balance", type: "number" },
      { key: "verifiedBy", type: "string", maxLength: 100 },
      { key: "receiptUrl", type: "string", maxLength: 10000 },
    ]);

    if (auth.user.role === "tenant") {
      const ownPayments = await getPaymentsForUser(auth.userId, "tenant");
      const ownsPayment = ownPayments.some((candidate: any) => candidate.id === id);
      const allowedKeys = ["receiptUrl", "notes"];
      const requestedKeys = Object.keys(sanitized);
      if (!ownsPayment || requestedKeys.some((key) => !allowedKeys.includes(key))) {
        return NextResponse.json({ success: false, error: "Tenants may only attach a receipt to their own payment" }, { status: 403 });
      }
    }

    if (sanitized.status && !["paid", "pending", "overdue", "partial"].includes(sanitized.status)) {
      return NextResponse.json({ success: false, error: "Invalid payment status" }, { status: 400 });
    }

    const currentPayment = (await getPaymentsForUser(auth.userId, auth.user.role)).find((candidate: any) => candidate.id === id);
    if (!currentPayment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }
    if (sanitized.status === "paid") {
      const calculatedBalance = Math.max(0, Number(currentPayment.amountDue || 0) - Number(currentPayment.amountPaid || 0));
      sanitized.balance = calculatedBalance;
      sanitized.status = calculatedBalance <= 0 ? "paid" : "partial";
    }
    const payment = await updatePayment(id, sanitized);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }
    if (sanitized.status === "paid" || sanitized.status === "partial") {
      try {
        await createNotification({
          userId: payment.tenantId,
          title: "Payment Confirmed",
          message: `Your payment of ${formatCurrency(payment.amountPaid)} was confirmed by ${auth.user.name}.`,
          type: "payment",
        });
        const agents = (await getAllUsers()).filter((candidate: any) => candidate.role === "agent" && candidate.id !== auth.userId);
        await Promise.all(agents.map((agent: any) => createNotification({
          userId: agent.id,
          title: "Payment Confirmed",
          message: `${payment.tenantName || "A tenant"}'s payment of ${formatCurrency(payment.amountPaid)} was confirmed.`,
          type: "payment",
        })));
      } catch (notificationError) {
        console.error("Failed to notify payment confirmation recipients:", notificationError);
      }
    }
    await logAudit(auth.userId, "payment_updated", { paymentId: id, updates: Object.keys(sanitized) }, auth.ip, auth.userAgent);
    const response = NextResponse.json({ success: true, payment: sanitizeResponse(payment) });
    return withSecurityHeaders(withCorsHeaders(request, response));
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment" }, { status: 500 });
  }
}
