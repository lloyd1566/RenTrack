import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/security";
import { getAdminSupabase, findUserById } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAuth, validateApiRequest, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

const ALLOWED_UPDATE_FIELDS = ["name", "email", "phone", "languages", "hobbies", "aboutMe", "gender", "birthdate", "country", "address", "experience"];
const PASSWORD_FIELDS = ["currentPassword", "newPassword"];

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const { id, currentPassword, newPassword } = body;

    if (id && id !== auth.userId) {
      return NextResponse.json({ success: false, error: "Not allowed to update another user" }, { status: 403 });
    }

    if (currentPassword && newPassword) {
      const user = await findUserById(auth.userId);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatches) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
      }

      if (String(newPassword).length < 6) {
        return NextResponse.json({ success: false, error: "New password must be at least 6 characters" }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      const { error: passwordError } = await getAdminSupabase()
        .from("users")
        .update({ password: newHash })
        .eq("id", auth.userId);

      if (passwordError) {
        console.error("Password update error:", passwordError);
        return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Password changed successfully" });
    }

    const updateData: any = {};

    for (const [key, val] of Object.entries(body)) {
      if (key === "id") continue;
      if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;
      if (val === undefined || val === null) continue;

      const dbKey = key === "aboutMe" ? "about_me" : key;

      if (dbKey === "email") {
        const sanitized = String(val).toLowerCase().trim().replace(/[^a-zA-Z0-9@._+-]/g, "");
        if (!sanitized.includes("@")) {
          return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
        }
        updateData[dbKey] = sanitized;
      } else if (dbKey === "phone") {
        updateData[dbKey] = String(val).replace(/[^0-9+]/g, "").slice(0, 20);
      } else if (dbKey === "birthdate") {
        const dateValue = String(val).trim();
        if (dateValue) {
          updateData[dbKey] = dateValue;
        }
      } else {
        updateData[dbKey] = String(val).replace(/[<>]/g, "").slice(0, 200);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const { error } = await getAdminSupabase()
      .from("users")
      .update(updateData)
      .eq("id", auth.userId);

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
