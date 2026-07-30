import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db";

export async function GET() {
  try {
    const users = await getAllUsers();
    const safeUsers = users.map(({ password, ...u }: any) => ({ ...u, _password: password }));
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}
