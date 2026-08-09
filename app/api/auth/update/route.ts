import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/security";
import { findUserById, initDatabase, findOrCreateAdmin } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  requireAuth, validateApiRequest, withSecurityHeaders, withCorsHeaders,
  sanitizeObject, getClientIp
} from "@/lib/api-security";
import { logAudit } from "@/lib/db";

const ALLOWED_UPDATE_FIELDS = ["name", "email", "phone", "languages", "hobbies", "aboutMe", "gender", "birthdate", "country", "experience", "profileVisibility", "showEmail", "showPhone", "allowMessages", "dataSharing"];

export async function PATCH(request: NextRequest) {
  try {
    try {
      const { initDatabase, findOrCreateAdmin } = await import("@/lib/db");
      await initDatabase();
      await findOrCreateAdmin();
    } catch (dbInitError) {
      console.error("Database initialization warning:", dbInitError);
    }

    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const validation = validateApiRequest(request);
    if (validation) return validation;

    const body = await request.json();
    const { id, currentPassword, newPassword } = body;

    if (id && id !== auth.userId) {
      return NextResponse.json({ success: false, error: "Not allowed to update another user" }, { status: 403 });
    }

    const allowedFieldNames: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(body)) {
      if (key === "currentPassword" || key === "newPassword" || key === "id") continue;
      if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;
      if (val === undefined || val === null) continue;

      const dbKey = key === "aboutMe" ? "about_me"
        : key === "profileVisibility" ? "profile_visibility"
        : key === "showEmail" ? "show_email"
        : key === "showPhone" ? "show_phone"
        : key === "allowMessages" ? "allow_messages"
        : key === "dataSharing" ? "data_sharing"
        : key;

      if (dbKey === "email") {
        const sanitized = String(val).toLowerCase().trim().replace(/[^a-zA-Z0-9@._+-]/g, "");
        if (!sanitized.includes("@")) {
          return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
        }
        allowedFieldNames.push(dbKey);
        values.push(sanitized);
      } else if (dbKey === "phone") {
        allowedFieldNames.push(dbKey);
        values.push(String(val).replace(/[^0-9+]/g, "").slice(0, 20));
      } else if (["profile_visibility", "show_email", "show_phone", "allow_messages", "data_sharing"].includes(dbKey)) {
        allowedFieldNames.push(dbKey);
        values.push(Boolean(val));
      } else if (dbKey === "birthdate") {
        const dateValue = String(val).trim();
        if (dateValue) {
          allowedFieldNames.push(dbKey);
          values.push(dateValue);
        }
      } else {
        const sanitized = String(val).replace(/[<>]/g, "").slice(0, 200);
        allowedFieldNames.push(dbKey);
        values.push(sanitized);
      }
    }

    if (newPassword && currentPassword) {
      const bcrypt = (await import("bcryptjs")).default;
      const passwordMatches = await bcrypt.compare(currentPassword, auth.user.password);
      if (!passwordMatches) {
        await logAudit(auth.userId, "password_change_failed", { reason: "invalid_current_password" }, auth.ip, auth.userAgent);
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
      }

      if (String(newPassword).length < 8) {
        return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      allowedFieldNames.push("password");
      values.push(newHash);
      await logAudit(auth.userId, "password_changed", {}, auth.ip, auth.userAgent);
    }

    if (allowedFieldNames.length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    values.push(auth.userId);
    const setClause = allowedFieldNames.map((name, i) => `${name} = $${i + 1}`).join(", ");
    const query = `UPDATE users SET ${setClause} WHERE id = $${allowedFieldNames.length + 1}`;
    const { query: dbQuery } = await import("@/lib/db");
    await dbQuery(query, values);

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
