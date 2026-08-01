import { initDatabase, findOrCreateAdmin } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await initDatabase();
    const admin = await findOrCreateAdmin();
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      admin: { email: admin.email }
    });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json({ success: false, error: "Database initialization failed" }, { status: 500 });
  }
}

