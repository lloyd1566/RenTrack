import { NextRequest, NextResponse } from "next/server";
import { getUnits, createUnit, deleteUnit } from "@/lib/db";

export async function GET() {
  try {
    const units = await getUnits();
    return NextResponse.json({ success: true, units });
  } catch (error) {
    console.error("Get units error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const unit = await createUnit(data);
    return NextResponse.json({ success: true, unit });
  } catch (error) {
    console.error("Create unit error:", error);
    return NextResponse.json({ success: false, error: "Failed to create unit" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await deleteUnit(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete unit error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete unit" }, { status: 500 });
  }
}
