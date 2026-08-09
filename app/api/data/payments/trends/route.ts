import { NextRequest, NextResponse } from "next/server";
import { getPaymentsForUser, findUserById } from "@/lib/db";
import { getSessionUserId } from "@/lib/security";
import { requireAuth, sanitizeResponse, withSecurityHeaders, withCorsHeaders } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const payments = await getPaymentsForUser(auth.userId, auth.user.role);

    const monthlyMap = new Map<string, { collected: number; pending: number; overdue: number }>();

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { collected: 0, pending: 0, overdue: 0 });
    }

    for (const p of payments) {
      if (!p.payment_date) continue;
      const date = new Date(p.payment_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(key)) continue;
      const entry = monthlyMap.get(key)!;
      if (p.status === "paid") entry.collected += p.amount_paid || 0;
      else if (p.status === "pending") entry.pending += p.amount_paid || 0;
      else if (p.status === "overdue") entry.overdue += p.amount_due || 0;
    }

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = Array.from(monthlyMap.entries()).map(([key, values]) => {
      const [, month] = key.split("-");
      return {
        month: monthLabels[parseInt(month, 10) - 1],
        ...values,
      };
    });

    return NextResponse.json({ success: true, trends });
  } catch (error) {
    console.error("Payment trends error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch trends" }, { status: 500 });
  }
}
