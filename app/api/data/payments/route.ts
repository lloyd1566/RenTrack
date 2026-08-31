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
import { logAudit } from "@/lib/db";
import { randomBytes } from "crypto";

function buildAutomaticReceiptUrl(details: { id: string; amount: number; date: string; method: string; tenant: string; property: string; unit: string; notes: string }) {
  const escapeXml = (value: string) => value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] || character));
  const paymentType = details.notes.toLowerCase().includes("advance") ? "Advance Payment" : "Regular Payment";
  const statusLabel = "PENDING VERIFICATION";
  const amountFormatted = formatCurrency(details.amount);
  const dateFormatted = details.date;
  const methodFormatted = details.method.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
  const now = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="860" viewBox="0 0 720 860">
    <rect width="720" height="860" rx="28" fill="#ffffff"/>
    <rect width="720" height="160" rx="28" fill="#111827"/>
    <rect y="132" width="720" height="28" fill="#111827"/>

    <circle cx="72" cy="64" r="40" fill="#ffffff" opacity="0.08"/>
    <circle cx="660" cy="72" r="52" fill="#ffffff" opacity="0.06"/>
    <circle cx="620" cy="40" r="18" fill="#f59e0b" opacity="0.35"/>
    <circle cx="92" cy="120" r="10" fill="#f59e0b" opacity="0.45"/>

    <text x="56" y="58" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">RentTrack</text>
    <text x="56" y="84" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#e5e7eb">Rental Property Management</text>
    <text x="56" y="106" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">receipt@renttrack.app • +63 900 000 0000</text>
    <text x="56" y="124" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">123 Rizal Ave, Cebu City, Philippines</text>

    <text x="664" y="56" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#fbbf24">${escapeXml(statusLabel)}</text>
    <rect x="468" y="68" width="236" height="28" rx="14" fill="#fbbf24" opacity="0.18"/>
    <text x="586" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#fbbf24">${now}</text>

    <rect x="56" y="164" width="608" height="1" fill="#e5e7eb"/>

    <text x="56" y="196" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">Payment Receipt</text>
    <text x="56" y="218" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">Thank you for your payment. Please keep this receipt for your records.</text>

    <rect x="56" y="244" width="608" height="1" fill="#e5e7eb"/>

    <text x="56" y="274" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#374151">Billed To</text>
    <text x="56" y="298" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#111827">${escapeXml(details.tenant)}</text>
    <text x="56" y="318" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">${escapeXml(details.property || "Rental property")}</text>
    <text x="56" y="338" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">Unit ${escapeXml(details.unit || "N/A")}</text>

    <rect x="56" y="356" width="608" height="1" fill="#e5e7eb"/>

    <text x="56" y="386" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#374151">Receipt Details</text>

    <rect x="56" y="398" width="608" height="160" rx="18" fill="#f8fafc"/>
    <rect x="56" y="398" width="608" height="160" rx="18" fill="none" stroke="#e5e7eb" stroke-width="1"/>

    <text x="84" y="428" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Receipt ID</text>
    <text x="84" y="452" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${escapeXml(details.id)}</text>

    <text x="340" y="428" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Date</text>
    <text x="340" y="452" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${escapeXml(dateFormatted)}</text>

    <text x="84" y="486" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Payment Type</text>
    <text x="84" y="510" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${escapeXml(paymentType)}</text>

    <text x="340" y="486" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Payment Method</text>
    <text x="340" y="510" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${escapeXml(methodFormatted)}</text>

    <text x="84" y="538" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Status</text>
    <text x="84" y="562" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#b45309">${escapeXml(statusLabel)}</text>

    <rect x="56" y="580" width="608" height="1" fill="#e5e7eb"/>

    <text x="56" y="612" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#374151">Payment Summary</text>

    <rect x="56" y="624" width="608" height="110" rx="18" fill="#f8fafc"/>
    <rect x="56" y="624" width="608" height="110" rx="18" fill="none" stroke="#e5e7eb" stroke-width="1"/>

    <text x="84" y="654" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Amount Paid</text>
    <text x="664" y="654" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#111827">${escapeXml(amountFormatted)}</text>

    <text x="84" y="682" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Balance / Amount Due</text>
    <text x="664" y="682" text-anchor="end" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#6b7280">${escapeXml(amountFormatted)}</text>

    <text x="84" y="714" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Notes</text>
    <text x="84" y="734" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${escapeXml(details.notes || "Payment submitted")}</text>

    <rect x="56" y="754" width="608" height="1" fill="#e5e7eb"/>

    <rect x="56" y="768" width="608" height="64" rx="14" fill="#f8fafc"/>
    <rect x="56" y="768" width="608" height="64" rx="14" fill="none" stroke="#e5e7eb" stroke-width="1"/>
    <text x="84" y="794" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Reference / Verification Code</text>
    <text x="84" y="816" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${escapeXml(details.id)}</text>
    <text x="500" y="794" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Issued On</text>
    <text x="500" y="816" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#111827">${now}</text>

    <rect x="56" y="844" width="608" height="1" fill="#e5e7eb"/>

    <text x="56" y="866" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">This payment will be updated after confirmation.</text>
    <text x="56" y="884" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">Thank you for using RentTrack. If you have questions, contact support@renttrack.app.</text>
    <text x="56" y="902" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db">DTI Permit No. 12345 • BIR TIN: 000-000-000</text>
    <text x="56" y="918" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db">This is a system-generated receipt. Valid without signature.</text>
  </svg>`;

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
      { key: "gcashNumber", type: "string", maxLength: 20 },
      { key: "gcashName", type: "string", maxLength: 200 },
      { key: "notes", type: "string", maxLength: 500 },
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
      gcashNumber: sanitized.gcashNumber || null,
      gcashName: sanitized.gcashName || null,
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
      sanitized.status = "paid";
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
