import { NextRequest, NextResponse } from "next/server";
import { getNotifications, createNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const countOnly = searchParams.get("count") === "true";

    if (countOnly && userId) {
      const count = await getUnreadCount(userId);
      return NextResponse.json({ success: true, count });
    }

    const notifications = userId ? await getNotifications(userId) : await getNotifications();
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const notification = await createNotification(data);
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, userId, action } = await request.json();
    if (action === "markAllRead" && userId) {
      await markAllNotificationsRead(userId);
    } else if (id) {
      await markNotificationRead(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}
