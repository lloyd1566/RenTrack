import { NextRequest, NextResponse } from "next/server";
import { getProperties, createProperty, deleteProperty } from "@/lib/db";

export async function GET() {
  try {
    const properties = await getProperties();
    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error("Get properties error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, userId } = await request.json();
    const property = await createProperty(data, userId);
    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("Create property error:", error);
    return NextResponse.json({ success: false, error: "Failed to create property" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await deleteProperty(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete property error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete property" }, { status: 500 });
  }
}
