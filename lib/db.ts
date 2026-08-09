import { neon } from "@neondatabase/serverless";
import { hashSecret } from "./security";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
export const sql = neon(connectionString);

function toCamelCaseKeys(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    out[camel] = obj[key];
  }
  return out;
}

function mapUserRow(u: any): any {
  if (!u) return null;
  return toCamelCaseKeys(u);
}

export async function query(text: string, params?: any[]) {
  try {
    const result = params && params.length > 0
      ? await sql.query(text as any, params)
      : await sql(text as any);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// ─── Schema Setup ──────────────────────────────────────────────────────────

export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'agent', 'tenant')),
      phone TEXT,
      payment_pin_hash TEXT,
      payment_pin_set_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_pin_hash TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_pin_set_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp_expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS about_me TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '0 Years'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verification_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verification_status TEXT DEFAULT 'pending' CHECK (id_verification_status IN ('pending', 'approved', 'rejected'))`;

  await sql`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('avatar', 'id_verification', 'property', 'unit', 'receipt')),
      data BYTEA NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('avatar', 'id_verification', 'property', 'unit', 'receipt')),
      data BYTEA NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT FALSE`;

  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('house', 'condominium')),
      units INTEGER DEFAULT 0,
      occupied_units INTEGER DEFAULT 0,
      monthly_revenue DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by TEXT REFERENCES users(id),
      image_url TEXT
    );
  `;
  await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_url TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
      unit_number TEXT NOT NULL,
      floor INTEGER,
      status TEXT DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance')),
      rent_amount DECIMAL(10,2) DEFAULT 0,
      tenant_name TEXT,
      tenant_id TEXT,
      lease_end DATE,
      image_url TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      occupation TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      unit_id TEXT REFERENCES units(id),
      property_name TEXT,
      unit_number TEXT,
      contract_start DATE,
      contract_end DATE,
      rent_amount DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by TEXT REFERENCES users(id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      tenant_name TEXT,
      unit_id TEXT,
      property_name TEXT,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      amount_due DECIMAL(10,2) DEFAULT 0,
      balance DECIMAL(10,2) DEFAULT 0,
      payment_date DATE,
      due_date DATE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'partial')),
      payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'gcash', 'other')),
      receipt_url TEXT,
      notes TEXT,
      verified_by TEXT REFERENCES users(id),
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by TEXT REFERENCES users(id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'system' CHECK (type IN ('payment', 'tenant', 'property', 'system', 'id_verification')),
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check
  `;
  await sql`
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('payment', 'tenant', 'property', 'system', 'id_verification'))
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payment_verification_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL CHECK (target_type IN ('property', 'unit')),
      target_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, target_type, target_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL CHECK (target_type IN ('property', 'unit')),
      target_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      assigned_to TEXT REFERENCES users(id),
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log("✅ Database tables initialized");
}

// ─── User Queries ─────────────────────────────────────────────────────────

export async function createUser(name: string, email: string, password: string, role: string, phone?: string, paymentPin?: string, address?: string) {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (id, name, email, password, role, phone, payment_pin_hash, payment_pin_set_at, email_verified, verification_token, verification_expires_at, address, created_at)
    VALUES (${id}, ${name}, ${email.toLowerCase()}, ${hashedPassword}, ${role}, ${phone || null}, ${paymentPin ? hashSecret(paymentPin) : null}, ${paymentPin ? new Date().toISOString() : null}, FALSE, NULL, NULL, ${address || null}, NOW())
  `;
  return { id, name, email: email.toLowerCase(), role, phone, address, createdAt: new Date().toISOString() };
}

export async function findUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `;
  return mapUserRow(result[0]) || null;
}

export async function findUserById(id: string) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id}
  `;
  return mapUserRow(result[0]) || null;
}

export async function setUserPaymentPin(userId: string, paymentPin: string) {
  await sql`
    UPDATE users
    SET payment_pin_hash = ${hashSecret(paymentPin)}, payment_pin_set_at = NOW()
    WHERE id = ${userId}
  `;
}

export async function verifyUserPaymentPin(userId: string, paymentPin: string) {
  const result = await sql`SELECT payment_pin_hash FROM users WHERE id = ${userId} LIMIT 1`;
  const storedHash = result[0]?.payment_pin_hash as string | null | undefined;
  if (!storedHash) return false;
  return storedHash === hashSecret(paymentPin);
}

export async function createPaymentVerificationCode(userId: string, code: string, purpose = "payment", ttlMinutes = 10) {
  const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    DELETE FROM payment_verification_codes
    WHERE user_id = ${userId} AND purpose = ${purpose} AND consumed_at IS NULL
  `;
  await sql`
    INSERT INTO payment_verification_codes (id, user_id, purpose, code_hash, expires_at, created_at)
    VALUES (${id}, ${userId}, ${purpose}, ${hashSecret(code)}, NOW() + ${ttlMinutes} * INTERVAL '1 minute', NOW())
  `;
  return id;
}

export async function verifyPaymentVerificationCode(userId: string, code: string, purpose = "payment") {
  const result = await sql`
    SELECT id, code_hash, expires_at
    FROM payment_verification_codes
    WHERE user_id = ${userId}
      AND purpose = ${purpose}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const record = result[0];
  if (!record) return false;
  if (record.code_hash !== hashSecret(code)) return false;

  await sql`
    UPDATE payment_verification_codes
    SET consumed_at = NOW()
    WHERE id = ${record.id}
  `;
  return true;
}

export async function createEmailVerificationToken(userId: string, email: string, ttlHours = 24) {
  const token = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  await sql`
    UPDATE users
    SET verification_token = ${token}, verification_expires_at = NOW() + ${ttlHours} * INTERVAL '1 hour', email_verified = FALSE
    WHERE id = ${userId}
  `;
  return token;
}

export async function verifyEmailToken(token: string) {
  const result = await sql`
    SELECT id, email, verification_expires_at
    FROM users
    WHERE verification_token = ${token}
  `;
  const user = result[0];
  if (!user) return { success: false, error: "Invalid verification token" };
  if (new Date(user.verification_expires_at) < new Date()) {
    return { success: false, error: "Verification token has expired" };
  }
  await sql`
    UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL
    WHERE id = ${user.id}
  `;
  return { success: true, user: { id: user.id, email: user.email } };
}

export async function createLoginOtp(userId: string, ttlMinutes = 10) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await sql`
    UPDATE users
    SET login_otp = ${otp}, login_otp_expires_at = NOW() + ${ttlMinutes} * INTERVAL '1 minute'
    WHERE id = ${userId}
  `;
  return otp;
}

export async function verifyLoginOtp(userId: string, otp: string) {
  const result = await sql`
    SELECT login_otp, login_otp_expires_at
    FROM users
    WHERE id = ${userId}
  `;
  const user = result[0];
  if (!user) return { success: false, error: "User not found" };
  if (user.login_otp !== otp) return { success: false, error: "Invalid verification code" };
  if (new Date(user.login_otp_expires_at) < new Date()) {
    return { success: false, error: "Verification code has expired" };
  }
  await sql`
    UPDATE users SET login_otp = NULL, login_otp_expires_at = NULL
    WHERE id = ${userId}
  `;
  return { success: true };
}

export async function logAudit(userId: string, action: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO audit_logs (id, user_id, action, ip_address, user_agent, details, created_at)
    VALUES (${id}, ${userId}, ${action}, ${ipAddress || null}, ${userAgent || null}, ${details ? JSON.stringify(details) : null}, NOW())
  `;
}

export async function findOrCreateAdmin() {
  // Default built-in admin credentials
  const name = "System Administrator";
  const email = "admin@renttrack.com";
  const password = "adminOwner";
  const role = "admin";
  const phone = "+63 900 000 0000";

  // Check if the built-in admin email already exists
  const existing = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;

  if (existing.length > 0) {
    const admin = existing[0];
    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (admin.role !== role || !passwordMatches) {
      const hashedDefault = await bcrypt.hash(password, 10);
      await sql`
        UPDATE users SET password = ${hashedDefault}, role = ${role}, phone = ${phone}, email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL
        WHERE id = ${admin.id}
      `;
      console.log("🔁 Built-in admin account updated to correct credentials");
    } else {
      await sql`
        UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires_at = NULL
        WHERE id = ${admin.id}
      `;
      console.log("ℹ️ Built-in admin account already exists:", admin.email);
    }
    return { id: admin.id, email: admin.email, name: admin.name, password };
  }

  // Create default admin account
  const id = `usr_admin_${Date.now()}`;

  const hashedDefault = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (id, name, email, password, role, phone, email_verified, verification_token, verification_expires_at, created_at)
    VALUES (${id}, ${name}, ${email}, ${hashedDefault}, ${role}, ${phone}, TRUE, NULL, NULL, NOW())
  `;

  console.log("✅ Default admin account created: admin@renttrack.com / adminOwner");
  return { id, email, password };
}

export async function getAllUsers() {
  return await sql`SELECT * FROM users ORDER BY created_at DESC`;
}

// ─── Property Queries ─────────────────────────────────────────────────────

export async function getProperties() {
  const rows = await sql`SELECT * FROM properties ORDER BY created_at DESC`;
  return rows.map(toCamelCaseKeys);
}

export async function createProperty(data: any, userId: string) {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO properties (id, name, location, type, units, occupied_units, monthly_revenue, status, created_by, image_url)
    VALUES (${id}, ${data.name}, ${data.location}, ${data.type}, ${data.units || 0}, 0, 0, 'active', ${userId}, ${data.imageUrl || null})
  `;
  return { id, ...data, status: "active", createdAt: new Date().toISOString() };
}

export async function deleteProperty(id: string) {
  await sql`DELETE FROM properties WHERE id = ${id}`;
}

// ─── Unit Queries ─────────────────────────────────────────────────────────

export async function getUnits() {
  const rows = await sql`SELECT * FROM units ORDER BY unit_number`;
  return rows.map(toCamelCaseKeys);
}

export async function createUnit(data: any) {
  const id = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO units (id, property_id, unit_number, floor, status, rent_amount, image_url)
    VALUES (${id}, ${data.propertyId}, ${data.unitNumber}, ${data.floor || null}, 'vacant', ${data.rentAmount || 0}, ${data.imageUrl || null})
  `;
  return { id, ...data, status: "vacant" };
}

export async function deleteUnit(id: string) {
  await sql`DELETE FROM units WHERE id = ${id}`;
}

// ─── Tenant Queries ───────────────────────────────────────────────────────

export async function getTenants() {
  const users = await sql`
    SELECT id, name, email, phone, address, created_at as createdAt, role, avatar_url, id_verification_url, id_verification_status
    FROM users
    WHERE role = 'tenant'
    ORDER BY created_at DESC
  `;
  return users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    address: u.address || "",
    occupation: "",
    emergencyContact: "",
    emergencyPhone: "",
    unitId: "",
    propertyName: "",
    unitNumber: "",
    contractStart: "",
    contractEnd: "",
    rentAmount: 0,
    status: "active" as const,
    createdBy: "",
    createdAt: u.createdAt,
    avatarUrl: u.avatar_url,
    idVerificationUrl: u.id_verification_url,
    idVerificationStatus: u.id_verification_status,
  }));
}

export async function createTenant(data: any, userId: string) {
  const id = `ten_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO tenants (id, name, email, phone, address, occupation, emergency_contact, emergency_phone,
      unit_id, property_name, unit_number, contract_start, contract_end, rent_amount, status, created_by)
    VALUES (${id}, ${data.name}, ${data.email || null}, ${data.phone || null}, ${data.address || null},
      ${data.occupation || null}, ${data.emergencyContact || null}, ${data.emergencyPhone || null},
      ${data.unitId || null}, ${data.propertyName || null}, ${data.unitNumber || null},
      ${data.contractStart || null}, ${data.contractEnd || null}, ${data.rentAmount || 0}, 'active', ${userId})
  `;
  return { id, ...data, status: "active", createdAt: new Date().toISOString() };
}

export async function deleteTenant(userId: string) {
  await sql`DELETE FROM tenants WHERE id = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

// ─── Payment Queries ──────────────────────────────────────────────────────

export async function getPayments() {
  return await sql`SELECT * FROM payments ORDER BY created_at DESC`;
}

export async function getPaymentsForUser(userId: string, role?: string) {
  if (role === "tenant") {
    return await sql`
      SELECT * FROM payments
      WHERE tenant_id = ${userId} OR created_by = ${userId}
      ORDER BY created_at DESC
    `;
  }

  return await sql`SELECT * FROM payments ORDER BY created_at DESC`;
}

export async function createPayment(data: any, userId: string) {
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO payments (id, tenant_id, tenant_name, unit_id, property_name, amount_paid, amount_due, balance,
      payment_date, due_date, status, payment_method, receipt_url, notes, created_by)
    VALUES (${id}, ${data.tenantId || null}, ${data.tenantName || null}, ${data.unitId || null},
      ${data.propertyName || null}, ${data.amountPaid || 0}, ${data.amountDue || 0}, ${data.balance || 0},
      ${data.paymentDate || null}, ${data.dueDate || null}, ${data.status || 'pending'},
      ${data.paymentMethod || 'other'}, ${data.receiptUrl || null}, ${data.notes || null}, ${userId})
  `;
  return { id, ...data, createdAt: new Date().toISOString() };
}

export async function updatePayment(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${idx}`);
      values.push(val);
      idx++;
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await sql`
      UPDATE payments SET ${fields.join(", ")} WHERE id = ${id}
    `;
  }
  const result = await sql`SELECT * FROM payments WHERE id = ${id}`;
  return result[0] || null;
}

// ─── Notification Queries ─────────────────────────────────────────────────

export async function getNotifications(userId?: string) {
  if (userId) {
    return await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC`;
  }
  return await sql`SELECT * FROM notifications ORDER BY created_at DESC`;
}

export async function createNotification(data: any) {
  const id = `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
    VALUES (${id}, ${data.userId}, ${data.title}, ${data.message || null}, ${data.type || 'system'}, FALSE, NOW())
  `;
  return { id, ...data, read: false, createdAt: new Date().toISOString() };
}

export async function markNotificationRead(id: string) {
  await sql`UPDATE notifications SET read = TRUE WHERE id = ${id}`;
}

export async function markAllNotificationsRead(userId: string) {
  await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId}`;
}

export async function getUnreadCount(userId: string) {
  const result = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${userId} AND read = FALSE`;
  return result[0]?.count || 0;
}

// ─── Rating Queries ─────────────────────────────────────────────────────────

export async function createRating(data: { userId: string; targetType: "property" | "unit"; targetId: string; rating: number; comment?: string }) {
  const id = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO ratings (id, user_id, target_type, target_id, rating, comment, created_at)
    VALUES (${id}, ${data.userId}, ${data.targetType}, ${data.targetId}, ${data.rating}, ${data.comment || null}, NOW())
    ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET rating = ${data.rating}, comment = ${data.comment || null}, created_at = NOW()
  `;
  return { id, ...data, createdAt: new Date().toISOString() };
}

export async function getRatings(targetType: string, targetId: string) {
  const result = await sql`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.target_type = ${targetType} AND r.target_id = ${targetId}
    ORDER BY r.created_at DESC
  `;
  return result;
}

export async function getRatingsByUser(userId: string) {
  const result = await sql`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
  `;
  return result;
}

export async function getAverageRating(targetType: string, targetId: string) {
  const result = await sql`
    SELECT AVG(rating) as avg_rating, COUNT(*) as total
    FROM ratings WHERE target_type = ${targetType} AND target_id = ${targetId}
  `;
  return { average: result[0]?.avg_rating || 0, total: result[0]?.total || 0 };
}

// ─── Complaint Queries ──────────────────────────────────────────────────────

export async function createComplaint(data: { tenantId: string; targetType: "property" | "unit"; targetId: string; subject: string; message: string; priority?: string }) {
  const id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO complaints (id, tenant_id, target_type, target_id, subject, message, status, priority, created_at, updated_at)
    VALUES (${id}, ${data.tenantId}, ${data.targetType}, ${data.targetId}, ${data.subject}, ${data.message}, 'open', ${data.priority || 'medium'}, NOW(), NOW())
  `;
  return { id, ...data, status: "open", priority: data.priority || "medium", createdAt: new Date().toISOString() };
}

export async function getComplaints(tenantId?: string) {
  if (tenantId) {
    return await sql`
      SELECT c.*, u.name as tenant_name, u.email as tenant_email
      FROM complaints c
      JOIN users u ON c.tenant_id = u.id
      WHERE c.tenant_id = ${tenantId}
      ORDER BY c.created_at DESC
    `;
  }
  return await sql`
    SELECT c.*, u.name as tenant_name, u.email as tenant_email
    FROM complaints c
    JOIN users u ON c.tenant_id = u.id
    ORDER BY c.created_at DESC
  `;
}

export async function updateComplaintStatus(id: string, status: string, assignedTo?: string) {
  const result = await sql`
    UPDATE complaints
    SET status = ${status},
        assigned_to = ${assignedTo || null},
        updated_at = NOW(),
        resolved_at = CASE WHEN ${status} IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
    WHERE id = ${id}
    RETURNING *
  `;
  return result[0] || null;
}

export async function getComplaintById(id: string) {
  const result = await sql`SELECT * FROM complaints WHERE id = ${id}`;
  return result[0] || null;
}

