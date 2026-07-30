import { neon, sql as neonSql } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);

export async function query(text: string, params?: any[]) {
  try {
    // Use parameterized query via tagged template
    const result = params && params.length > 0
      ? await sql(text as any, ...params)
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
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'agent', 'tenant')),
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

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
      created_by TEXT REFERENCES users(id)
    );
  `;

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
      lease_end DATE
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
      type TEXT DEFAULT 'system' CHECK (type IN ('payment', 'tenant', 'property', 'system')),
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log("✅ Database tables initialized");
}

// ─── User Queries ─────────────────────────────────────────────────────────

export async function createUser(name: string, email: string, password: string, role: string, phone?: string) {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO users (id, name, email, password, role, phone, created_at)
    VALUES (${id}, ${name}, ${email.toLowerCase()}, ${password}, ${role}, ${phone || null}, NOW())
  `;
  return { id, name, email: email.toLowerCase(), role, phone, createdAt: new Date().toISOString() };
}

export async function findUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `;
  return result[0] || null;
}

export async function findUserById(id: string) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id}
  `;
  return result[0] || null;
}

export async function getAllUsers() {
  return await sql`SELECT * FROM users ORDER BY created_at DESC`;
}

// ─── Property Queries ─────────────────────────────────────────────────────

export async function getProperties() {
  return await sql`SELECT * FROM properties ORDER BY created_at DESC`;
}

export async function createProperty(data: any, userId: string) {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO properties (id, name, location, type, units, occupied_units, monthly_revenue, status, created_by)
    VALUES (${id}, ${data.name}, ${data.location}, ${data.type}, ${data.units || 0}, 0, 0, 'active', ${userId})
  `;
  return { id, ...data, status: "active", createdAt: new Date().toISOString() };
}

export async function deleteProperty(id: string) {
  await sql`DELETE FROM properties WHERE id = ${id}`;
}

// ─── Unit Queries ─────────────────────────────────────────────────────────

export async function getUnits() {
  return await sql`SELECT * FROM units ORDER BY unit_number`;
}

export async function createUnit(data: any) {
  const id = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await sql`
    INSERT INTO units (id, property_id, unit_number, floor, status, rent_amount)
    VALUES (${id}, ${data.propertyId}, ${data.unitNumber}, ${data.floor || null}, 'vacant', ${data.rentAmount || 0})
  `;
  return { id, ...data, status: "vacant" };
}

export async function deleteUnit(id: string) {
  await sql`DELETE FROM units WHERE id = ${id}`;
}

// ─── Tenant Queries ───────────────────────────────────────────────────────

export async function getTenants() {
  return await sql`SELECT * FROM tenants ORDER BY created_at DESC`;
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

// ─── Payment Queries ──────────────────────────────────────────────────────

export async function getPayments() {
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

