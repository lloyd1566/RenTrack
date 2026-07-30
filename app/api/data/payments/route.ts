import { NextRequest, NextResponse } from "next/server";
import { getPayments, createPayment, updatePayment } from "@/lib/db";

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, userId } = await request.json();
    const payment = await createPayment(data, userId);
    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    await updatePayment(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update payment" }, { status: 500 });
  }
}
