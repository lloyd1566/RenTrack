"use client";

// ─── PostgreSQL-backed Data Store ───────────────────────────────────────────

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
  assignmentStatus?: "pending" | "confirmed" | "rejected";
  createdBy?: string;
  createdAt: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
  profileVisibility?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  allowMessages?: boolean;
  dataSharing?: boolean;
  experience?: string;
  aboutMe?: string;
  gender?: string;
  birthdate?: string;
  country?: string;
  languages?: string;
  hobbies?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  createdAt: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
  experience?: string;
  aboutMe?: string;
  gender?: string;
  birthdate?: string;
  country?: string;
  languages?: string;
  hobbies?: string;
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
  paymentMethod: "cash" | "bank_transfer" | "credit_card" | "gcash" | "other";
  paymentMethodNote?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  cardLast4?: string;
  cardExpiry?: string;
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

export interface AuditLog {
  id: string;
  userId?: string;
  actor: string;
  action: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
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
    credentials: "include",
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

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  const result = await apiPatch("/api/data/properties/patch", { id, data });
  return result.success ? result.property || data as any : null;
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

export async function updateUnit(id: string, data: Partial<Unit>): Promise<Unit | null> {
  const result = await apiPatch("/api/data/units/patch", { id, data });
  return result.success ? result.unit || data as any : null;
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

export async function updateTenantAssignment(tenantId: string, data: {
  unitId?: string; propertyName?: string; unitNumber?: string;
  contractStart?: string; contractEnd?: string; rentAmount?: number;
  assignmentStatus?: string;
}): Promise<TenantRecord | null> {
  const result = await apiPatch("/api/data/tenants", { tenantId, ...data });
  return result.tenant || null;
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  otherUser: { id: string; name: string; email: string; role: string; avatarUrl?: string } | null;
  lastMessage: Message;
  unreadCount: number;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function sendMessage(data: { receiverId: string; subject?: string; body: string }): Promise<Message> {
  const result = await apiPost("/api/messages", data);
  return result.message || result;
}

export async function getConversations(): Promise<Conversation[]> {
  const result = await apiGet("/api/messages");
  return result.success ? result.conversations : [];
}

export async function getMessages(otherUserId: string): Promise<Message[]> {
  const result = await apiGet(`/api/messages/${encodeURIComponent(otherUserId)}`);
  return result.success ? result.messages : [];
}

export async function markAllMessagesRead(otherUserId: string): Promise<void> {
  await apiPatch(`/api/messages/${encodeURIComponent(otherUserId)}`, { action: "markAllRead" });
}

export async function getUnreadMessageCount(): Promise<number> {
  const result = await apiGet("/api/messages?count=true");
  return result.success ? result.count : 0;
}

export async function getAgents(): Promise<UserRecord[]> {
  const result = await apiGet("/api/auth/users/agents");
  if (result.success && result.users) {
    return result.users.filter((u: UserRecord) => u.role === "agent");
  }
  return [];
}

export async function registerAgent(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  experience?: string;
  aboutMe?: string;
  gender?: string;
  birthdate?: string;
  country?: string;
  languages?: string;
  hobbies?: string;
}): Promise<UserRecord> {
  const result = await apiPost("/api/auth/signup", { ...data, role: "agent" });
  if (result && result.success) {
    return {
      id: result.userId,
      name: data.name,
      email: data.email,
      role: "agent",
      phone: data.phone,
      address: data.address,
      createdAt: new Date().toISOString(),
      experience: data.experience,
      aboutMe: data.aboutMe,
      gender: data.gender,
      birthdate: data.birthdate,
      country: data.country,
      languages: data.languages,
      hobbies: data.hobbies,
    } as UserRecord;
  }
  throw new Error(result?.error || result?.message || "Failed to register agent");
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
  const results = await Promise.allSettled([
    getProperties(user),
    getUnits(user),
    getTenants(user),
    getPayments(user),
    getPaymentTrends(user),
  ]);

  const properties = results[0].status === "fulfilled" ? results[0].value : [];
  const units = results[1].status === "fulfilled" ? results[1].value : [];
  const tenants = results[2].status === "fulfilled" ? results[2].value : [];
  const payments = results[3].status === "fulfilled" ? results[3].value : [];
  const trends = results[4].status === "fulfilled" ? results[4].value : [];

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

export async function getAllRatings(): Promise<Rating[]> {
  const result = await apiGet("/api/admin/ratings");
  return result.success ? result.ratings : [];
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

// ─── Admin User Management ────────────────────────────────────────────────

export async function getUsers(): Promise<UserRecord[]> {
  const result = await apiGet("/api/auth/users");
  return result.success ? result.users : [];
}

export async function getSampleUserIds(): Promise<Set<string>> {
  const users = await getUsers();
  const sampleEmails = ["admin@renttrack.com", "owner@renttrack.com", "renttrackowner@gmail.com", "agent@renttrack.com", "tenant@renttrack.com"];
  return new Set(users.filter(u => sampleEmails.includes(u.email.toLowerCase())).map(u => u.id));
}

export async function getAuditLogs(limit = 40): Promise<AuditLog[]> {
  const result = await apiGet(`/api/data/audit-logs?limit=${Math.min(Math.max(limit, 1), 100)}`);
  return result.success ? result.logs : [];
}

export async function resetAgentPassword(userId: string, newPassword: string, currentPassword: string): Promise<void> {
  const result = await apiPost("/api/auth/reset-password", { userId, newPassword, currentPassword });
  if (!result.success) {
    throw new Error(result.error || "Failed to reset password");
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await apiDelete("/api/auth/users", { userId });
  return result.success;
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  const result = await apiPatch("/api/auth/users", { userId, role });
  return result.success;
}

export async function updateUser(userId: string, data: Partial<Pick<UserRecord, "name" | "email" | "phone" | "address">>): Promise<UserRecord | null> {
  const result = await apiPatch("/api/auth/users/patch", { userId, data });
  return result.success ? (result.user || data as any) : null;
}

export async function getAgentStats(userId: string): Promise<{ properties: number; tenants: number; payments: number }> {
  const [properties, tenants, payments] = await Promise.all([
    getProperties(),
    getTenants(),
    getPayments(),
  ]);

  return {
    properties: properties.filter((p) => p.createdBy === userId).length,
    tenants: tenants.filter((t) => t.createdBy === userId).length,
    payments: payments.filter((p) => p.createdBy === userId || p.verifiedBy === userId).length,
  };
}
