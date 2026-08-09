import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/db";
import { getSessionUserId } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const safeUser = { ...user };
    delete safeUser.password;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Session lookup error:", error);
    return NextResponse.json({ success: false, error: "Failed to load session" }, { status: 500 });
  }
}
