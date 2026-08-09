"use client";

// ─── Neon PostgreSQL-backed Data Store ─────────────────────────────────────

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  name: string;
  location: string;
  type: "house" | "condominium";
  units: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  status: "active" | "inactive";
  createdAt: string;
  createdBy: string;
  imageUrl?: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  status: "occupied" | "vacant" | "maintenance";
  rentAmount: number;
  tenantName?: string;
  tenantId?: string;
  leaseEnd?: string;
  imageUrl?: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  unitId?: string;
  propertyName?: string;
  unitNumber?: string;
  contractStart?: string;
  contractEnd?: string;
  rentAmount?: number;
  status: "active" | "inactive";
  createdBy?: string;
  createdAt: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  propertyName: string;
  amountPaid: number;
  amountDue: number;
  balance: number;
  paymentDate: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "partial";
  paymentMethod: "cash" | "bank_transfer" | "gcash" | "other";
  receiptUrl?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "payment" | "tenant" | "property" | "system" | "id_verification";
  read: boolean;
  createdAt: string;
}

// ─── API Helper ────────────────────────────────────────────────────────────

async function apiGet(url: string) {
  const res = await fetch(url, { credentials: "include" });
  return res.json();
}

async function apiPost(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  return res.json();
}

async function apiPatch(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  return res.json();
}

async function apiDelete(url: string, body: any) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Properties ────────────────────────────────────────────────────────────

export async function getProperties(_user?: any): Promise<Property[]> {
  const result = await apiGet("/api/data/properties");
  return result.success ? result.properties : [];
}

export async function addProperty(data: Omit<Property, "id" | "createdAt" | "createdBy">, userId: string): Promise<Property> {
  const result = await apiPost("/api/data/properties", data);
  return result.property || result;
}

export function updateProperty(_id: string, _data: Partial<Property>): Property | null {
  // Will be implemented when needed
  return null;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const result = await apiDelete("/api/data/properties", { id });
  return result.success;
}

// ─── Units ─────────────────────────────────────────────────────────────────

export async function getUnits(_user?: any): Promise<Unit[]> {
  const result = await apiGet("/api/data/units");
  return result.success ? result.units : [];
}

export async function addUnit(data: Omit<Unit, "id">): Promise<Unit> {
  const result = await apiPost("/api/data/units", data);
  return result.unit || result;
}

export function updateUnit(_id: string, _data: Partial<Unit>): Unit | null {
  return null;
}

export async function deleteUnit(id: string): Promise<boolean> {
  const result = await apiDelete("/api/data/units", { id });
  return result.success;
}

// ─── Tenants ───────────────────────────────────────────────────────────────

export async function getTenants(_user?: any): Promise<TenantRecord[]> {
  const result = await apiGet("/api/data/tenants");
  return result.success ? result.tenants : [];
}

export async function addTenant(data: Omit<TenantRecord, "id" | "createdAt" | "createdBy">, userId: string): Promise<TenantRecord> {
  const result = await apiPost("/api/data/tenants", data);
  return result.tenant;
}

// ─── Payments ──────────────────────────────────────────────────────────────

export async function getPayments(_user?: any): Promise<Payment[]> {
  const result = await apiGet("/api/data/payments");
  return result.success ? result.payments : [];
}

export async function addPayment(data: Omit<Payment, "id">, security?: { paymentPin?: string; otpCode?: string }, tenantId?: string): Promise<Payment> {
  const body: any = { data };
  if (security) {
    body.paymentPin = security.paymentPin;
    body.otpCode = security.otpCode;
  }
  if (tenantId) {
    body.tenantId = tenantId;
  }
  const result = await apiPost("/api/data/payments", body);
  return result.payment;
}

export async function updatePayment(id: string, data: Partial<Payment>): Promise<Payment | null> {
  const result = await apiPatch("/api/data/payments", { id, data });
  return result.payment || null;
}

export async function verifyPayment(payment: Payment, verifiedBy: string, status: "paid" | "rejected"): Promise<Payment | null> {
  const updateData: any = { verifiedBy, verifiedAt: new Date().toISOString() };
  if (status === "paid") {
    // Auto-deduct: recompute the tenant's bill based on the confirmed amount
    const newBalance = Math.max(0, payment.amountDue - payment.amountPaid);
    updateData.status = newBalance <= 0 ? "paid" : "partial";
    updateData.balance = newBalance;
  } else {
    // Rejected: no deduction — payment stays pending
    updateData.status = "pending";
  }
  const result = await apiPatch("/api/data/payments", { id: payment.id, data: updateData });
  return result.payment || null;
}

export interface MonthlyTrend {
  month: string;
  collected: number;
  pending: number;
  overdue: number;
}

export async function getPaymentTrends(_user?: any): Promise<MonthlyTrend[]> {
  const result = await apiGet("/api/data/payments/trends");
  return result.success ? result.trends : [];
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function getNotifications(userId?: string): Promise<Notification[]> {
  const url = userId ? `/api/data/notifications?userId=${userId}` : "/api/data/notifications";
  const result = await apiGet(url);
  return result.success ? result.notifications : [];
}

export async function addNotification(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
  const result = await apiPost("/api/data/notifications", data);
  return result.notification;
}

export async function notifyAdmins(data: Omit<Notification, "id" | "createdAt" | "userId">): Promise<void> {
  const result = await apiGet("/api/auth/users");
  if (result.success && result.users) {
    const adminUsers = result.users.filter((u: any) => u.role === "admin" || u.role === "owner");
    await Promise.all(
      adminUsers.map((admin: any) =>
        addNotification({ ...data, userId: admin.id })
      )
    );
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await apiPatch("/api/data/notifications", { id });
  return result.success;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await apiPatch("/api/data/notifications", { userId, action: "markAllRead" });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await apiGet(`/api/data/notifications?userId=${userId}&count=true`);
  return result.success ? result.count : 0;
}

// ─── Dashboard Data ────────────────────────────────────────────────────────

export interface DashboardData {
  properties: Property[];
  units: Unit[];
  tenants: TenantRecord[];
  payments: Payment[];
  trends: MonthlyTrend[];
  propertiesCount: number;
  unitsCount: number;
  tenantsCount: number;
  occupiedUnitsCount: number;
  vacantUnitsCount: number;
  totalRevenue: number;
  totalReceivables: number;
  totalCollected: number;
}

export async function getDashboardData(user?: any): Promise<DashboardData> {
  const [properties, units, tenants, payments, trends] = await Promise.all([
    getProperties(user),
    getUnits(user),
    getTenants(user),
    getPayments(user),
    getPaymentTrends(user),
  ]);

  const totalRevenue = units
    .filter((u) => u.status === "occupied")
    .reduce((sum, u) => sum + (u.rentAmount || 0), 0);

  const totalReceivables = payments
    .filter((p) => p.status === "overdue" || p.status === "partial" || p.status === "pending")
    .reduce((sum, p) => sum + (p.balance || 0), 0);

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  return {
    properties,
    units,
    tenants,
    payments,
    trends,
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

// ─── Computed Helpers ──────────────────────────────────────────────────────

export async function getPropertiesCount(): Promise<number> {
  const props = await getProperties();
  return props.length;
}

export async function getUnitsCount(): Promise<number> {
  const units = await getUnits();
  return units.length;
}

export async function getTenantsCount(): Promise<number> {
  const tenants = await getTenants();
  return tenants.length;
}

export async function getOccupiedUnitsCount(): Promise<number> {
  const units = await getUnits();
  return units.filter((u) => u.status === "occupied").length;
}

export async function getVacantUnitsCount(): Promise<number> {
  const units = await getUnits();
  return units.filter((u) => u.status === "vacant").length;
}

export async function getTotalRevenue(): Promise<number> {
  const units = await getUnits();
  return units.filter((u) => u.status === "occupied").reduce((sum, u) => sum + u.rentAmount, 0);
}

export async function getTotalReceivables(user?: any): Promise<number> {
  const payments = await getPayments(user);
  return payments
    .filter((p) => p.status === "overdue" || p.status === "partial" || p.status === "pending")
    .reduce((sum, p) => sum + p.balance, 0);
}

export async function getTotalCollected(user?: any): Promise<number> {
  const payments = await getPayments(user);
  return payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0);
}

export function getOccupancyRate(_propertyId: string): number {
  return 0; // Will be implemented when needed
}

// ─── Ratings ────────────────────────────────────────────────────────────────

export interface Rating {
  id: string;
  user_id: string;
  target_type: "property" | "unit";
  target_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface RatingSummary {
  average: number;
  total: number;
}

export async function createRating(data: { userId: string; targetType: "property" | "unit"; targetId: string; rating: number; comment?: string }): Promise<Rating> {
  const result = await apiPost("/api/data/ratings", data);
  return result.rating;
}

export async function getRatings(targetType: string, targetId: string): Promise<Rating[]> {
  const result = await apiGet(`/api/data/ratings?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`);
  return result.success ? result.ratings : [];
}

export async function getRatingsByUser(userId: string): Promise<Rating[]> {
  const result = await apiGet(`/api/data/ratings?userId=${encodeURIComponent(userId)}`);
  return result.success ? result.ratings : [];
}

export async function getAverageRating(targetType: string, targetId: string): Promise<RatingSummary> {
  const result = await apiGet(`/api/data/ratings?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`);
  return result.success ? result.average : { average: 0, total: 0 };
}

// ─── Complaints ─────────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  tenant_id: string;
  target_type: "property" | "unit";
  target_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  tenant_name?: string;
  tenant_email?: string;
}

export async function createComplaint(data: { tenantId: string; targetType: "property" | "unit"; targetId: string; subject: string; message: string; priority?: string }): Promise<Complaint> {
  const result = await apiPost("/api/data/complaints", data);
  return result.complaint;
}

export async function getComplaints(tenantId?: string): Promise<Complaint[]> {
  const url = tenantId ? `/api/data/complaints?tenantId=${encodeURIComponent(tenantId)}` : "/api/data/complaints";
  const result = await apiGet(url);
  return result.success ? result.complaints : [];
}

export async function updateComplaintStatus(id: string, status: string, assignedTo?: string): Promise<Complaint | null> {
  const result = await apiPatch("/api/data/complaints", { id, status, assignedTo });
  return result.complaint || null;
}
