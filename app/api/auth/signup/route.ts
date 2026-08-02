import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, initDatabase, findOrCreateAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Self-bootstrap: ensure tables exist before creating a user.
    await initDatabase();
    await findOrCreateAdmin();

    const { name, email, password, role, phone } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Only allow agent and tenant roles to be created via signup
    const allowedRoles = ["agent", "tenant"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role. Only agent and tenant accounts can be created." }, { status: 403 });
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
