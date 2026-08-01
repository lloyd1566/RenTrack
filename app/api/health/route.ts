import { NextResponse } from "next/server";

// Lightweight health check endpoint — no DB calls, returns instantly.
// Used by Render's health check and the keep-alive cron job to keep
// the free instance awake so visitors never see the "waking up" screen.
export async function GET() {
  return NextResponse.json({
    success: true,
    status: "ok",
    service: "renttrack",
    time: new Date().toISOString(),
  });
}

