"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Building2, Calendar, CheckCircle2, CreditCard, Home, LogOut, ChevronDown, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/lib/auth";
import { getPayments, getTenants, getTenantPaymentSummary, Payment, TenantRecord } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const cardClass = "border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [moveOutReason, setMoveOutReason] = useState("");
  const [moveOutSubmitting, setMoveOutSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPayments(user), getTenants()]).then(([paymentData, tenantData]) => {
      setPayments(paymentData);
      setTenant(tenantData.find((record) => record.id === user.id) || null);
    }).catch(() => undefined);
  }, [user]);

  const tenantPayments = user ? payments.filter((payment) => payment.tenantId === user.id) : [];
  const tenantPaymentSummary = user ? getTenantPaymentSummary(payments, user.id) : { totalPaid: 0, outstanding: 0, hasAwaitingConfirmation: false, waitingForConfirmation: null, hasConfirmedPayment: false };
  const monthlyRent = tenant?.rentAmount || payments[0]?.amountDue || 0;
  const totalPaid = tenantPaymentSummary.totalPaid;
  const outstanding = tenantPaymentSummary.outstanding;
  const nextPayment = tenantPayments.find((payment) => payment.status === "pending" || payment.status === "overdue");
  const paidCount = tenantPayments.filter((payment) => payment.status === "paid").length;
  const pendingCount = tenantPayments.filter((payment) => payment.status === "pending").length;
  const overdueCount = tenantPayments.filter((payment) => payment.status === "overdue").length;
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-blue-900 px-7 py-28 text-white shadow-xl sm:px-10 sm:py-36">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: "url('/images/favicon/Butuan City.webp')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/75 to-blue-900/20" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                opacity: [0.1, 0.6, 0.1],
              }}
              transition={{
                duration: 5 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
              className="absolute rounded-full bg-white"
              style={{
                left: `${10 + i * 4.5}%`,
                top: `${20 + (i % 5) * 18}%`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
              }}
            />
          ))}
        </div>

        <motion.div
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent"
        />

        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-xl" />
          <motion.div animate={{ x: [0, -15, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -left-10 h-56 w-56 rounded-full bg-white/5 blur-xl" />
          <motion.div animate={{ x: [0, 10, 0], y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        </div>
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div><h1 className="mt-1 text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "Tenant"}!</h1><p className="mt-2 text-sm text-blue-100">Here&apos;s your rental and payment overview.</p></div>
        </div>
      </div>

      {tenantPaymentSummary.hasAwaitingConfirmation && tenantPaymentSummary.waitingForConfirmation && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Payment already submitted</p>
            <p className="mt-1 text-sm text-amber-800">
              You already paid {formatCurrency(tenantPaymentSummary.waitingForConfirmation.amountPaid || 0)} and it is waiting for the owner to confirm.
              Once confirmed, your outstanding balance will be updated automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, detail, tone }) => <Card key={label} className={cardClass}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-2 text-xl font-bold text-gray-900">{value}</p><p className="mt-1 text-[11px] text-gray-500">{detail}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className={`${cardClass} xl:col-span-2`}><CardHeader><CardTitle className="text-base">Payment Status</CardTitle><CardDescription>Current payment records</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 items-center gap-3"><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} innerRadius={46} outerRadius={76} paddingAngle={3} dataKey="value" stroke="none">{statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-3">{statusData.map((status) => <div key={status.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />{status.name}</span><strong>{status.value}</strong></div>)}</div></div></CardContent></Card>
          <Card className={`${cardClass} xl:col-span-3`}><CardHeader><CardTitle className="text-base">Rental Information</CardTitle><CardDescription>Your current lease details</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rentalDetails.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-gray-50 p-3"><Icon className="mb-2 h-4 w-4 text-blue-600" /><p className="text-[11px] text-gray-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-gray-900">{value}</p></div>)}</CardContent></Card>

          {tenant?.unitId && (
            <Card className={`${cardClass} xl:col-span-2`}>
              <CardHeader>
                <CardTitle className="text-base">Move Out / End Tenancy</CardTitle>
                <CardDescription>Submit a request to notify the owner/admin</CardDescription>
              </CardHeader>
              <CardContent>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                        <LogOut className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Request Move-Out</p>
                        <p className="text-xs text-gray-500">End your current tenancy</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 px-1">
                    <p className="text-xs text-gray-500 mb-3">This will notify the owner/admin that you want to end your tenancy. Once approved, your unit will be marked as vacant.</p>
                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => setShowMoveOutModal(true)}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Request Move-Out
                    </Button>
                  </div>
                </details>
              </CardContent>
            </Card>
          )}
        </div>

          <Card className={`${cardClass} xl:col-span-5`}><CardHeader><CardTitle className="text-base">Recent Payments</CardTitle><CardDescription>Your latest transactions and receipts</CardDescription></CardHeader><CardContent>{payments.slice(0, 5).length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No payments recorded yet.</p> : <div className="space-y-2">{payments.slice(0, 5).map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-semibold text-gray-900">{formatDate(payment.paymentDate)}</p><p className="text-xs text-gray-500">{payment.paymentMethod} {payment.receiptUrl ? "• Receipt available" : "• No receipt"}</p></div><div className="flex items-center gap-3"><span className="font-semibold text-emerald-600">{formatCurrency(payment.amountPaid)}</span><Badge variant={payment.status === "paid" ? "success" : payment.status === "overdue" ? "destructive" : "warning"} className="capitalize">{payment.status}</Badge></div></div>)}</div>}</CardContent></Card>

      {showMoveOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowMoveOutModal(false)}>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowMoveOutModal(false)} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Move-Out</h3>
                <p className="text-xs text-gray-500">This will notify the owner/admin</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to request a move-out? Once approved, your unit will be marked as vacant and your account will be deactivated.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
              <textarea
                value={moveOutReason}
                onChange={(e) => setMoveOutReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason..."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowMoveOutModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={async () => {
                if (!moveOutReason.trim()) {
                  toast.error("Please provide a reason");
                  return;
                }
                setMoveOutSubmitting(true);
                try {
                  const res = await fetch("/api/move-out", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: moveOutReason }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Move-out request submitted");
                    setShowMoveOutModal(false);
                    setMoveOutReason("");
                  } else {
                    toast.error(data.error || "Failed to submit request");
                  }
                } catch {
                  toast.error("Failed to submit request");
                } finally {
                  setMoveOutSubmitting(false);
                }
              }} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={moveOutSubmitting}>
                {moveOutSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
