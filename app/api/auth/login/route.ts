import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Missing email or password" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
