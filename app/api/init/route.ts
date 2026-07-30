import { initDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json({ success: false, error: "Database initialization failed" }, { status: 500 });
  }
}

