import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await createUser(name, email, password, role, phone);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}
