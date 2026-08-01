import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, email, phone, currentPassword, newPassword } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Build update fields
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${idx++}`);
      values.push(email.toLowerCase());
    }
    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }
if (newPassword && currentPassword) {
      // Verify current password first
      const userResult = await sql`SELECT password FROM users WHERE id = ${id}`;
      if (!userResult[0] || userResult[0].password !== currentPassword) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
      }
      updates.push(`password = $${idx++}`);
      values.push(newPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    await sql(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}` as any,
      ...values
    );

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
