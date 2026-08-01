"use client";

// ─── Neon PostgreSQL-backed Data Store ─────────────────────────────────────

import { User } from "./auth";

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
  phone: string;
  address: string;
  occupation: string;
  emergencyContact: string;
  emergencyPhone: string;
  unitId: string;
  propertyName: string;
  unitNumber: string;
  contractStart: string;
  contractEnd: string;
  rentAmount: number;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
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
  type: "payment" | "tenant" | "property" | "system";
  read: boolean;
  createdAt: string;
}

// ─── API Helper ────────────────────────────────────────────────────────────

async function apiGet(url: string) {
  const res = await fetch(url);
  return res.json();
}

async function apiPost(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiPatch(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export async function getProperties(user?: any): Promise<Property[]> {
  const result = await apiGet("/api/data/properties");
  return result.success ? result.properties : [];
}

export async function addProperty(data: Omit<Property, "id" | "createdAt" | "createdBy">, userId: string): Promise<Property> {
  const result = await apiPost("/api/data/properties", { data, userId });
  return result.property;
}

export function updateProperty(id: string, data: Partial<Property>): Property | null {
  // Will be implemented when needed
  return null;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const result = await apiDelete("/api/data/properties", { id });
  return result.success;
}

// ─── Units ─────────────────────────────────────────────────────────────────

export async function getUnits(user?: any): Promise<Unit[]> {
  const result = await apiGet("/api/data/units");
  return result.success ? result.units : [];
}

export async function addUnit(data: Omit<Unit, "id">): Promise<Unit> {
  const result = await apiPost("/api/data/units", data);
  return result.unit;
}

export function updateUnit(id: string, data: Partial<Unit>): Unit | null {
  return null;
}

export async function deleteUnit(id: string): Promise<boolean> {
  const result = await apiDelete("/api/data/units", { id });
  return result.success;
}

// ─── Tenants ───────────────────────────────────────────────────────────────

export async function getTenants(user?: any): Promise<TenantRecord[]> {
  const result = await apiGet("/api/data/tenants");
  return result.success ? result.tenants : [];
}

export async function addTenant(data: Omit<TenantRecord, "id" | "createdAt" | "createdBy">, userId: string): Promise<TenantRecord> {
  const result = await apiPost("/api/data/tenants", { data, userId });
  return result.tenant;
}

// ─── Payments ──────────────────────────────────────────────────────────────

export async function getPayments(user?: any): Promise<Payment[]> {
  const result = await apiGet("/api/data/payments");
  return result.success ? result.payments : [];
}

export async function addPayment(data: Omit<Payment, "id">, userId: string): Promise<Payment> {
  const result = await apiPost("/api/data/payments", { data, userId });
  return result.payment;
}

export function updatePayment(id: string, data: Partial<Payment>): Payment | null {
  apiPatch("/api/data/payments", { id, data });
  return null;
}

export async function verifyPayment(id: string, verifiedBy: string, status: "paid" | "rejected"): Promise<Payment | null> {
  const updateData: any = { verifiedBy, verifiedAt: new Date().toISOString() };
  if (status === "paid") {
    updateData.status = "paid";
    updateData.balance = 0;
  } else {
    updateData.status = "pending";
  }
  await apiPatch("/api/data/payments", { id, data: updateData });
  return null;
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

export async function getTotalReceivables(): Promise<number> {
  const payments = await getPayments();
  return payments
    .filter((p) => p.status === "overdue" || p.status === "partial" || p.status === "pending")
    .reduce((sum, p) => sum + p.balance, 0);
}

export async function getTotalCollected(): Promise<number> {
  const payments = await getPayments();
  return payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0);
}

export function getOccupancyRate(propertyId: string): number {
  return 0; // Will be implemented when needed
}
