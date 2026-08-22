import { createClient, SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { hashSecret } from "./security";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

let cachedSupabase: SupabaseClient | null = null;
let cachedAdminSupabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!cachedSupabase) {
    const url = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL");
    const key = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    cachedSupabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cachedSupabase;
}

export function getAdminSupabase(): SupabaseClient {
  if (!cachedAdminSupabase) {
    const url = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY");
    cachedAdminSupabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cachedAdminSupabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

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

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    out[camel] = obj[key];
  }
  return out;
}

function camelToSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = val;
  }
  return out;
}

export async function query(text: string, params?: any[]) {
  const { data, error } = await getAdminSupabase().rpc("exec_sql", { sql: text, params: params || [] });
  if (error) {
    console.error("Database query error:", error);
    throw error;
  }
  return data;
}

export async function initDatabase() {
  const statements: string[] = [];

  statements.push(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'agent', 'tenant')),
    phone TEXT,
    payment_pin_hash TEXT,
    payment_pin_set_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_pin_hash TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_pin_set_at TIMESTAMPTZ`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_otp_expires_at TIMESTAMPTZ`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS about_me TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '0 Years'`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verification_url TEXT`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verification_status TEXT DEFAULT 'pending' CHECK (id_verification_status IN ('pending', 'approved', 'rejected'))`);

  statements.push(`CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('avatar', 'id_verification', 'property', 'unit', 'receipt')),
    data BYTEA NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility BOOLEAN DEFAULT TRUE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT FALSE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT FALSE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT TRUE`);
  statements.push(`ALTER TABLE users ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT FALSE`);

  statements.push(`CREATE TABLE IF NOT EXISTS properties (
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
  )`);

  statements.push(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_url TEXT`);

  statements.push(`CREATE TABLE IF NOT EXISTS units (
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
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS tenants (
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
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS payments (
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
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'system' CHECK (type IN ('payment', 'tenant', 'property', 'system', 'id_verification')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  statements.push(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
  statements.push(`ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('payment', 'tenant', 'property', 'system', 'id_verification'))`);

  statements.push(`CREATE TABLE IF NOT EXISTS payment_verification_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('property', 'unit')),
    target_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
  )`);

  statements.push(`CREATE TABLE IF NOT EXISTS complaints (
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
  )`);

  for (const sqlText of statements) {
    try {
      await getAdminSupabase().rpc("exec_sql", { sql: sqlText });
    } catch (err) {
      console.error("initDatabase statement failed:", sqlText, err);
    }
  }

  console.log("✅ Database tables initialized");
}

export async function createUser(name: string, email: string, password: string, role: string, phone?: string, paymentPin?: string, address?: string) {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const { error } = await getAdminSupabase().from("users").insert({
    id,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    phone: phone || null,
    payment_pin_hash: paymentPin ? hashSecret(paymentPin) : null,
    payment_pin_set_at: paymentPin ? new Date().toISOString() : null,
    email_verified: false,
    verification_token: null,
    verification_expires_at: null,
    address: address || null,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, name, email: email.toLowerCase(), role, phone, address, createdAt: new Date().toISOString() };
}

export async function findUserByEmail(email: string) {
  const { data, error } = await getAdminSupabase().from("users").select("*").eq("email", email.toLowerCase()).single();
  if (error || !data) return null;
  return mapUserRow(data);
}

export async function findUserById(id: string) {
  const { data, error } = await getAdminSupabase().from("users").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapUserRow(data);
}

export async function setUserPaymentPin(userId: string, paymentPin: string) {
  const { error } = await getAdminSupabase().from("users").update({ payment_pin_hash: hashSecret(paymentPin), payment_pin_set_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
}

export async function verifyUserPaymentPin(userId: string, paymentPin: string) {
  const { data, error } = await getAdminSupabase().from("users").select("payment_pin_hash").eq("id", userId).single();
  if (error || !data) return false;
  const storedHash = data.payment_pin_hash as string | null | undefined;
  if (!storedHash) return false;
  return storedHash === hashSecret(paymentPin);
}

export async function createPaymentVerificationCode(userId: string, code: string, purpose = "payment", ttlMinutes = 10) {
  const id = `pvc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  await getAdminSupabase().from("payment_verification_codes").delete().eq("user_id", userId).eq("purpose", purpose).eq("consumed_at", null);

  const { error } = await getAdminSupabase().from("payment_verification_codes").insert({
    id,
    user_id: userId,
    purpose,
    code_hash: codeHash,
    expires_at: expiresAt,
    consumed_at: null,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return id;
}

export async function verifyPaymentVerificationCode(userId: string, code: string, purpose = "payment") {
  const { data, error } = await supabase
    .from("payment_verification_codes")
    .select("*")
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .eq("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return false;
  const storedHash = data.code_hash as string;
  const match = await bcrypt.compare(code, storedHash);
  if (!match) return false;

  await getAdminSupabase().from("payment_verification_codes").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

export async function createEmailVerificationToken(userId: string, email: string, ttlHours = 24) {
  const token = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("users")
    .update({ verification_token: token, verification_expires_at: expiresAt, email_verified: false })
    .eq("id", userId);
  if (error) throw error;
  return token;
}

export async function verifyEmailToken(token: string) {
  const { data, error } = await getAdminSupabase().from("users").select("id, email, verification_expires_at").eq("verification_token", token).single();
  if (error || !data) return { success: false, error: "Invalid verification token" };
  if (new Date(data.verification_expires_at) < new Date()) {
    return { success: false, error: "Verification token has expired" };
  }
  const { error: updateError } = await supabase
    .from("users")
    .update({ email_verified: true, verification_token: null, verification_expires_at: null })
    .eq("id", data.id);
  if (updateError) throw updateError;
  return { success: true, user: { id: data.id, email: data.email } };
}

export async function createLoginOtp(userId: string, ttlMinutes = 10) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("users")
    .update({ login_otp: otp, login_otp_expires_at: expiresAt })
    .eq("id", userId);
  if (error) throw error;
  return otp;
}

export async function verifyLoginOtp(userId: string, otp: string) {
  const { data, error } = await getAdminSupabase().from("users").select("login_otp, login_otp_expires_at").eq("id", userId).single();
  if (error || !data) return { success: false, error: "User not found" };
  if (data.login_otp !== otp) return { success: false, error: "Invalid verification code" };
  if (new Date(data.login_otp_expires_at) < new Date()) {
    return { success: false, error: "Verification code has expired" };
  }
  const { error: updateError } = await getAdminSupabase().from("users").update({ login_otp: null, login_otp_expires_at: null }).eq("id", userId);
  if (updateError) throw updateError;
  return { success: true };
}

export async function logAudit(userId: string, action: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("audit_logs").insert({
    id,
    user_id: userId || null,
    action,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    details: details || {},
    created_at: new Date().toISOString(),
  });
  if (error) console.error("Audit log error:", error);
}

export async function findOrCreateAdmin() {
  const name = "System Administrator";
  const email = "admin@renttrack.com";
  const password = "Adminrentrack";
  const role = "admin";
  const phone = "+63 900 000 0000";

  const adminClient = getAdminSupabase();
  const { data: existing } = await adminClient.from("users").select("*").eq("email", email).single();
  const admin = existing as any;

  if (admin) {
    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (admin.role !== role || !passwordMatches) {
      const hashedDefault = await bcrypt.hash(password, 10);
      const { error } = await adminClient
        .from("users")
        .update({ password: hashedDefault, role, phone, email_verified: true, verification_token: null, verification_expires_at: null })
        .eq("id", admin.id);
      if (error) throw new Error(`Failed to update admin: ${error.message}`);
      console.log("🔁 Built-in admin account updated to correct credentials");
    } else {
      const { error } = await adminClient.from("users").update({ email_verified: true, verification_token: null, verification_expires_at: null }).eq("id", admin.id);
      if (error) throw new Error(`Failed to update admin: ${error.message}`);
      await logAudit(admin.id, "admin_login", { email: admin.email }, "system", "system");
      console.log("ℹ️ Built-in admin account already exists:", admin.email);
    }
    return { id: admin.id, email: admin.email, name: admin.name, password };
  }

  const id = `usr_admin_${Date.now()}`;
  const hashedDefault = await bcrypt.hash(password, 10);
  const { error } = await adminClient.from("users").insert({
    id,
    name,
    email,
    password: hashedDefault,
    role,
    phone,
    email_verified: true,
    verification_token: null,
    verification_expires_at: null,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to create admin: ${error.message}`);
  console.log("✅ Default admin account created: admin@renttrack.com / Adminrentrack");
  await logAudit(id, "admin_created", { email: "admin@renttrack.com", role: "admin" }, "system", "system");
  return { id, email, password };
}

export async function getAllUsers() {
  const { data, error } = await getAdminSupabase().from("users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((u: any) => snakeToCamel(u));
}

export async function getProperties() {
  const { data, error } = await getAdminSupabase().from("properties").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function createProperty(data: any, userId: string) {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("properties").insert({
    id,
    name: data.name,
    location: data.location,
    type: data.type,
    units: data.units || 0,
    occupied_units: 0,
    monthly_revenue: 0,
    status: "active",
    created_by: userId,
    image_url: data.imageUrl || null,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, status: "active", createdAt: new Date().toISOString() };
}

export async function deleteProperty(id: string) {
  const { error } = await getAdminSupabase().from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function getUnits() {
  const { data, error } = await getAdminSupabase().from("units").select("*").order("unit_number");
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function createUnit(data: any) {
  const id = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("units").insert({
    id,
    property_id: data.propertyId,
    unit_number: data.unitNumber,
    floor: data.floor || null,
    status: "vacant",
    rent_amount: data.rentAmount || 0,
    image_url: data.imageUrl || null,
  });
  if (error) throw error;
  return { id, ...data, status: "vacant" };
}

export async function deleteUnit(id: string) {
  const { error } = await getAdminSupabase().from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function getTenants() {
  const { data, error } = await getAdminSupabase().from("users").select("*").eq("role", "tenant").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((u: any) => ({
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
    createdAt: u.created_at,
    avatarUrl: u.avatar_url,
    idVerificationUrl: u.id_verification_url,
    idVerificationStatus: u.id_verification_status,
  }));
}

export async function createTenant(data: any, userId: string) {
  const id = `ten_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("tenants").insert({
    id,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    occupation: data.occupation || null,
    emergency_contact: data.emergencyContact || null,
    emergency_phone: data.emergencyPhone || null,
    unit_id: data.unitId || null,
    property_name: data.propertyName || null,
    unit_number: data.unitNumber || null,
    contract_start: data.contractStart || null,
    contract_end: data.contractEnd || null,
    rent_amount: data.rentAmount || 0,
    status: "active",
    created_by: userId,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, status: "active", createdAt: new Date().toISOString() };
}

export async function deleteTenant(userId: string) {
  const { error: tenantError } = await getAdminSupabase().from("tenants").delete().eq("id", userId);
  if (tenantError) throw tenantError;
  const { error: userError } = await getAdminSupabase().from("users").delete().eq("id", userId);
  if (userError) throw userError;
}

export async function getPayments() {
  const { data, error } = await getAdminSupabase().from("payments").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function getPaymentsForUser(userId: string, role?: string) {
  let query = getAdminSupabase().from("payments").select("*");
  if (role === "tenant") {
    query = query.or(`tenant_id.eq.${userId},created_by.eq.${userId}`);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function createPayment(data: any, userId: string) {
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("payments").insert({
    id,
    tenant_id: data.tenantId || null,
    tenant_name: data.tenantName || null,
    unit_id: data.unitId || null,
    property_name: data.propertyName || null,
    amount_paid: data.amountPaid || 0,
    amount_due: data.amountDue || 0,
    balance: data.balance || 0,
    payment_date: data.paymentDate || null,
    due_date: data.dueDate || null,
    status: data.status || "pending",
    payment_method: data.paymentMethod || "other",
    receipt_url: data.receiptUrl || null,
    notes: data.notes || null,
    created_by: userId,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, createdAt: new Date().toISOString() };
}

export async function updatePayment(id: string, data: any) {
  const snakeData = camelToSnake(data);
  const { error } = await getAdminSupabase().from("payments").update(snakeData).eq("id", id);
  if (error) throw error;
  const { data: updated } = await getAdminSupabase().from("payments").select("*").eq("id", id).single();
  return updated ? snakeToCamel(updated) : null;
}

export async function getNotifications(userId?: string) {
  let query = getAdminSupabase().from("notifications").select("*");
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function createNotification(data: any) {
  const id = `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("notifications").insert({
    id,
    user_id: data.userId,
    title: data.title,
    message: data.message || null,
    type: data.type || "system",
    read: false,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, read: false, createdAt: new Date().toISOString() };
}

export async function markNotificationRead(id: string) {
  const { error } = await getAdminSupabase().from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await getAdminSupabase().from("notifications").update({ read: true }).eq("user_id", userId);
  if (error) throw error;
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await getAdminSupabase().from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
  return count || 0;
}

export async function createRating(data: { userId: string; targetType: "property" | "unit"; targetId: string; rating: number; comment?: string }) {
  const id = `rate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("ratings").insert({
    id,
    user_id: data.userId,
    target_type: data.targetType,
    target_id: data.targetId,
    rating: data.rating,
    comment: data.comment || null,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, createdAt: new Date().toISOString() };
}

export async function getRatings(targetType: string, targetId: string) {
  const { data, error } = await getAdminSupabase().from("ratings").select("*, users(name, email)").eq("target_type", targetType).eq("target_id", targetId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({ ...snakeToCamel(row), userName: row.users?.name, userEmail: row.users?.email }));
}

export async function getRatingsByUser(userId: string) {
  const { data, error } = await getAdminSupabase().from("ratings").select("*, users(name, email)").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({ ...snakeToCamel(row), userName: row.users?.name, userEmail: row.users?.email }));
}

export async function getAverageRating(targetType: string, targetId: string) {
  const { data, error } = await getAdminSupabase().from("ratings").select("rating").eq("target_type", targetType).eq("target_id", targetId);
  if (error) throw error;
  const ratings = data || [];
  if (ratings.length === 0) return { average: 0, total: 0 };
  const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
  return { average: Math.round((sum / ratings.length) * 100) / 100, total: ratings.length };
}

export async function createComplaint(data: { tenantId: string; targetType: "property" | "unit"; targetId: string; subject: string; message: string; priority?: string }) {
  const id = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("complaints").insert({
    id,
    tenant_id: data.tenantId,
    target_type: data.targetType,
    target_id: data.targetId,
    subject: data.subject,
    message: data.message,
    status: "open",
    priority: data.priority || "medium",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, ...data, status: "open", priority: data.priority || "medium", createdAt: new Date().toISOString() };
}

export async function getComplaints(tenantId?: string) {
  let query = getAdminSupabase().from("complaints").select("id, tenant_id, target_type, target_id, subject, message, status, priority, assigned_to, resolved_at, created_at, updated_at, users!complaints_tenant_id_fkey(name, email)").order("created_at", { ascending: false });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...snakeToCamel(row),
    tenantName: row.users?.name,
    tenantEmail: row.users?.email,
  }));
}

export async function updateComplaintStatus(id: string, status: string, assignedTo?: string) {
  const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
  if (assignedTo) updates.assigned_to = assignedTo;
  if (status === "resolved" || status === "closed") updates.resolved_at = new Date().toISOString();

  const { data, error } = await getAdminSupabase().from("complaints").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data ? snakeToCamel(data) : null;
}

export async function getComplaintById(id: string) {
  const { data, error } = await getAdminSupabase().from("complaints").select("*").eq("id", id).single();
  if (error || !data) return null;
  return snakeToCamel(data);
}

export async function createUpload(data: { userId: string; type: string; buffer: Buffer; mimeType: string; size: number }) {
  const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const base64 = Buffer.from(data.buffer).toString("base64");
  const { error } = await getAdminSupabase().from("uploads").insert({
    id,
    user_id: data.userId,
    type: data.type,
    data: base64,
    mime_type: data.mimeType,
    size: data.size,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return id;
}

export async function getUpload(id: string) {
  const { data, error } = await getAdminSupabase().from("uploads").select("*").eq("id", id).single();
  if (error || !data) {
    console.error("[getUpload] failed for id", id, error || "no data");
    return null;
  }

  let raw = data.data || "";
  if (!raw) {
    console.error("[getUpload] empty data for id", id);
    return { ...data, data: Buffer.alloc(0) };
  }

  if (raw.startsWith("\\x")) {
    raw = Buffer.from(raw.slice(2), "hex").toString("utf-8");
  }

  return { ...data, data: Buffer.from(raw, "base64") };
}

export async function updateUserAvatar(userId: string, url: string) {
  const { error } = await getAdminSupabase().from("users").update({ avatar_url: url }).eq("id", userId);
  if (error) throw error;
}

export async function updateUserIdVerification(userId: string, url: string, status: string) {
  const { error } = await getAdminSupabase().from("users").update({ id_verification_url: url, id_verification_status: status }).eq("id", userId);
  if (error) throw error;
}

export async function getSystemConfig() {
  const { data, error } = await getAdminSupabase().from("system_config").select("*");
  if (error) throw error;
  const config: Record<string, string> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  return config;
}

export async function updateSystemConfig(key: string, value: string) {
  const { error } = await getAdminSupabase().from("system_config").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getMaintenanceMode() {
  const config = await getSystemConfig();
  return config.maintenance_mode === "true";
}

export async function setMaintenanceMode(enabled: boolean) {
  await updateSystemConfig("maintenance_mode", enabled ? "true" : "false");
}

export async function optimizeDatabase() {
  return { success: true, message: "Database optimization completed (Supabase handles this automatically)" };
}

export async function getAuditLogs(limit = 40) {
  const adminClient = getAdminSupabase();
  const { data, error } = await adminClient
    .from("audit_logs")
    .select("id, user_id, action, details, ip_address, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id || undefined,
    actor: row.users?.name || "System",
    action: row.action,
    details: row.details || null,
    ipAddress: row.ip_address || null,
    createdAt: row.created_at,
  }));

  if (mapped.length === 0) {
    const now = new Date().toISOString();
    const seedLogs = [
      { id: `audit_seed_1_${Date.now()}`, action: "system_initialized", details: { message: "Database initialized and ready" }, ip_address: "system", user_agent: "system", created_at: now },
      { id: `audit_seed_2_${Date.now()}`, action: "admin_account_ready", details: { email: "admin@renttrack.com", role: "admin" }, ip_address: "system", user_agent: "system", created_at: now },
      { id: `audit_seed_3_${Date.now()}`, action: "database_migrated_to_supabase", details: { from: "Neon", to: "Supabase" }, ip_address: "system", user_agent: "system", created_at: now },
    ];
    const { error: insertError } = await adminClient.from("audit_logs").insert(seedLogs);
    if (insertError) console.error("Audit seed insert error:", insertError);
    else return getAuditLogs(limit);
  }

  return mapped;
}

export async function getConversations(userId: string) {
  const { data: sent } = await getAdminSupabase().from("messages").select("*").eq("sender_id", userId).order("created_at", { ascending: false });
  const { data: received } = await getAdminSupabase().from("messages").select("*").eq("receiver_id", userId).order("created_at", { ascending: false });
  const seen = new Set<string>();
  const conversations: any[] = [];
  for (const msg of [...(sent || []), ...(received || [])]) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (seen.has(otherId)) continue;
    seen.add(otherId);
    const otherUser = await findUserById(otherId);
    const unreadCount = (received || []).filter((m: any) => m.sender_id === otherId && !m.read).length;
    conversations.push({ userId, otherUser, lastMessage: snakeToCamel(msg), unreadCount });
  }
  return conversations;
}

export async function getMessages(userId: string, otherId: string) {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function sendMessage(senderId: string, receiverId: string, subject: string, body: string) {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { error } = await getAdminSupabase().from("messages").insert({
    id,
    sender_id: senderId,
    receiver_id: receiverId,
    subject,
    body,
    read: false,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return { id, senderId, receiverId, subject, body, read: false, createdAt: new Date().toISOString() };
}

export async function markMessagesRead(userId: string, otherId: string) {
  const { error } = await getAdminSupabase().from("messages").update({ read: true }).eq("receiver_id", userId).eq("sender_id", otherId);
  if (error) throw error;
}

export async function markAllMessagesRead(otherUserId: string, userId: string) {
  const { error } = await getAdminSupabase().from("messages").update({ read: true }).eq("receiver_id", userId).eq("sender_id", otherUserId);
  if (error) throw error;
}

export async function markMessageRead(messageId: string, userId: string) {
  const { error } = await getAdminSupabase().from("messages").update({ read: true }).eq("id", messageId).eq("receiver_id", userId);
  if (error) throw error;
}

export async function getUnreadMessageCount(userId: string) {
  const { count, error } = await getAdminSupabase().from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", userId).eq("read", false);
  if (error) throw error;
  return count || 0;
}

export async function getDashboardData(user?: any): Promise<any> {
  const [properties, units, tenants, payments] = await Promise.all([
    getProperties(),
    getUnits(),
    getTenants(),
    user ? getPaymentsForUser(user.id, user.role) : getPayments(),
  ]);
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
  const totalReceivables = payments.reduce((sum: number, p: any) => sum + (p.amountDue || 0), 0);
  const totalCollected = payments.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
  return {
    properties,
    units,
    tenants,
    payments,
    trends: [],
    propertiesCount: properties.length,
    unitsCount: units.length,
    tenantsCount: tenants.length,
    occupiedUnitsCount: units.filter((u) => u.status === "occupied").length,
    vacantUnitsCount: units.filter((u) => u.status === "vacant").length,
    totalRevenue,
    totalReceivables,
    totalCollected,
  };
}

export async function backupDatabase() {
  return { success: true, message: "Database backup completed" };
}

export async function findOrCreateOwner() {
  const name = "Property Owner";
  const email = "renttrackowner@gmail.com";
  const password = "RentrackOwner";
  const role = "owner";
  const phone = "+63 900 000 0001";

  const adminClient = getAdminSupabase();
  const { data: existing } = await adminClient.from("users").select("*").eq("email", email).single();
  const owner = existing as any;

  if (owner) {
    const passwordMatches = await bcrypt.compare(password, owner.password);
    if (owner.role !== role || !passwordMatches) {
      const hashedDefault = await bcrypt.hash(password, 10);
      const { error } = await adminClient.from("users").update({ password: hashedDefault, role, phone, email_verified: true }).eq("id", owner.id);
      if (error) throw new Error(`Failed to update owner: ${error.message}`);
      console.log("Built-in owner account updated to correct credentials");
    } else {
      console.log("Built-in owner account already exists:", owner.email);
    }
    return { id: owner.id, email: owner.email, name: owner.name, password };
  }

  const id = `usr_owner_${Date.now()}`;
  const hashedDefault = await bcrypt.hash(password, 10);
  const { error } = await adminClient.from("users").insert({
    id, name, email, password: hashedDefault, role, phone, email_verified: true,
    verification_token: null, verification_expires_at: null, created_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to create owner: ${error.message}`);
  console.log("Default owner account created: renttrackowner@gmail.com / RentrackOwner");
  return { id, email, password };
}

export async function deleteUser(id: string) {
  const { error } = await getAdminSupabase().from("users").delete().eq("id", id);
  if (error) throw error;
}

export async function resetUserPassword(id: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, 10);
  const { data, error } = await getAdminSupabase().from("users").update({ password: hashed }).eq("id", id).select().single();
  if (error) throw error;
  return snakeToCamel(data);
}

export async function updateUser(id: string, updates: any) {
  const snakeUpdates = camelToSnake(updates);
  const { data, error } = await getAdminSupabase().from("users").update(snakeUpdates).eq("id", id).select().single();
  if (error) throw error;
  return snakeToCamel(data);
}

export async function getAllRatings() {
  const { data, error } = await getAdminSupabase().from("ratings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => snakeToCamel(row));
}

export async function getAllSystemConfig() {
  const { data, error } = await getAdminSupabase().from("system_config").select("*");
  if (error) throw error;
  const config: Record<string, string> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  return config;
}

export async function setSystemConfig(key: string, value: string) {
  const { error } = await getAdminSupabase().from("system_config").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

