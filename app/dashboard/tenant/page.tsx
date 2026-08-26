"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, Bell, Building2, Calendar, CheckCircle2, CreditCard, Home, Upload } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/lib/auth";
import { getPayments, getTenants, getNotifications, Payment, TenantRecord, Notification } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cardClass = "border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [notices, setNotices] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPayments(user), getTenants(), getNotifications(user.id)]).then(([paymentData, tenantData, notificationData]) => {
      setPayments(paymentData);
      setTenant(tenantData.find((record) => record.id === user.id) || null);
      setNotices(notificationData.slice(0, 4));
    }).catch(() => undefined);
  }, [user]);

  const monthlyRent = tenant?.rentAmount || payments[0]?.amountDue || 0;
  const totalPaid = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amountPaid, 0);
  const outstanding = payments.reduce((sum, payment) => sum + Math.max(0, payment.balance || 0), 0);
  const nextPayment = payments.find((payment) => payment.status === "pending" || payment.status === "partial" || payment.status === "overdue");
  const paidCount = payments.filter((payment) => payment.status === "paid").length;
  const pendingCount = payments.filter((payment) => payment.status === "pending" || payment.status === "partial").length;
  const overdueCount = payments.filter((payment) => payment.status === "overdue").length;
  const statusData = [{ name: "Paid", value: paidCount, color: "#16a34a" }, { name: "Pending", value: pendingCount, color: "#f59e0b" }, { name: "Overdue", value: overdueCount, color: "#ef4444" }];
  const summaryCards = [
    { label: "Monthly Rent", value: formatCurrency(monthlyRent), icon: Home, detail: "Due on the 5th", tone: "text-blue-600 bg-blue-50" },
    { label: "Total Paid", value: formatCurrency(totalPaid), icon: CheckCircle2, detail: `${paidCount} completed payments`, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Outstanding Balance", value: formatCurrency(outstanding), icon: CreditCard, detail: outstanding ? "Payment required" : "All clear", tone: "text-amber-600 bg-amber-50" },
    { label: "Next Payment Due", value: nextPayment?.dueDate ? formatDate(nextPayment.dueDate) : "No payment due", icon: Calendar, detail: nextPayment ? formatCurrency(nextPayment.amountDue) : "You are all caught up", tone: "text-indigo-600 bg-indigo-50" },
  ];
  const rentalDetails = [
    { label: "Property Name", value: tenant?.propertyName || "Not assigned", icon: Building2 },
    { label: "Unit / Room", value: tenant?.unitNumber || "Not assigned", icon: Home },
    { label: "Monthly Rent", value: formatCurrency(monthlyRent), icon: CreditCard },
    { label: "Lease Start Date", value: tenant?.contractStart ? formatDate(tenant.contractStart) : "Not set", icon: Calendar },
    { label: "Lease End Date", value: tenant?.contractEnd ? formatDate(tenant.contractEnd) : "Not set", icon: Calendar },
    { label: "Lease Status", value: tenant?.assignmentStatus === "confirmed" ? "Active" : tenant?.assignmentStatus || "Not assigned", icon: CheckCircle2 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-7xl space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-blue-900 p-7 text-white shadow-xl sm:p-10">
        <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: "url('/images/favicon/Butuan City.webp')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/75 to-blue-900/20" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div><p className="text-sm text-blue-100">Tenant Home</p><h1 className="mt-1 text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "Tenant"}!</h1><p className="mt-2 text-sm text-blue-100">Here&apos;s your rental and payment overview.</p></div>
          <Link href="/dashboard/tenant/payments"><Button className="border border-white/30 bg-white/10 text-white hover:bg-white/20"><Upload className="mr-2 h-4 w-4" /> Make a Payment</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, detail, tone }) => <Card key={label} className={cardClass}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-xl font-bold text-gray-900">{value}</p><p className="mt-1 text-[11px] text-gray-500">{detail}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className={`${cardClass} xl:col-span-2`}><CardHeader><CardTitle className="text-base">Payment Status</CardTitle><CardDescription>Current payment records</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 items-center gap-3"><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} innerRadius={46} outerRadius={76} paddingAngle={3} dataKey="value" stroke="none">{statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-3">{statusData.map((status) => <div key={status.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />{status.name}</span><strong>{status.value}</strong></div>)}</div></div></CardContent></Card>
        <Card className={`${cardClass} xl:col-span-3`}><CardHeader><CardTitle className="text-base">Rental Information</CardTitle><CardDescription>Your current lease details</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rentalDetails.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-gray-50 p-3"><Icon className="mb-2 h-4 w-4 text-blue-600" /><p className="text-[11px] text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-gray-900">{value}</p></div>)}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className={`${cardClass} xl:col-span-3`}><CardHeader><CardTitle className="text-base">Recent Payments</CardTitle><CardDescription>Your latest transactions and receipts</CardDescription></CardHeader><CardContent>{payments.slice(0, 5).length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No payments recorded yet.</p> : <div className="space-y-2">{payments.slice(0, 5).map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-semibold text-gray-900">{formatDate(payment.paymentDate)}</p><p className="text-xs text-gray-500">{payment.paymentMethod} {payment.receiptUrl ? "• Receipt available" : "• No receipt"}</p></div><div className="flex items-center gap-3"><span className="font-semibold text-emerald-600">{formatCurrency(payment.amountPaid)}</span><Badge variant={payment.status === "paid" ? "success" : payment.status === "overdue" ? "destructive" : "warning"} className="capitalize">{payment.status}</Badge></div></div>)}</div>}</CardContent></Card>
        <Card className={`${cardClass} xl:col-span-2`}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-blue-600" />Announcements / Notices</CardTitle><CardDescription>Updates from your rental team</CardDescription></CardHeader><CardContent>{notices.length ? <div className="space-y-3">{notices.map((notice) => <div key={notice.id} className="border-b border-gray-100 pb-3 last:border-0"><p className="text-sm font-medium text-gray-900">{notice.title}</p><p className="mt-1 text-xs text-gray-500">{notice.message}</p></div>)}</div> : <div className="py-6 text-center"><AlertCircle className="mx-auto mb-2 h-7 w-7 text-gray-300" /><p className="text-sm text-gray-500">No announcements yet.</p></div>}</CardContent></Card>
      </div>
    </motion.div>
  );
}
