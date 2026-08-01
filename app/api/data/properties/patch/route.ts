import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

export async function PATCH(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    if (!id || !data) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    await sql(`UPDATE properties SET ${fields.join(", ")} WHERE id = $${idx}` as any, ...values);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update property error:", error);
    return NextResponse.json({ success: false, error: "Failed to update property" }, { status: 500 });
  }
}
