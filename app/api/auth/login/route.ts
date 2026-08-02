import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, initDatabase, findOrCreateAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Self-bootstrap: ensure tables + built-in admin exist before login.
    // This makes the built-in account (admin@renttrack.com / adminOwner)
    // work even on a freshly deployed database without calling /api/init.
    await initDatabase();
    await findOrCreateAdmin();

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
