import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("Get user error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}
