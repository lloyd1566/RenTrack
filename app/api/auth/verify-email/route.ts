import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken, initDatabase, findOrCreateAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDatabase();
    await findOrCreateAdmin();

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Verification token is required" }, { status: 400 });
    }

    const result = await verifyEmailToken(token);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "verification_failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user ? { id: result.user.id, email: result.user.email } : null });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ success: false, error: "verification_failed" }, { status: 500 });
  }
}
