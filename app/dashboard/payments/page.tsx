"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Search, Filter, CheckCircle2, XCircle, Download, DollarSign, TrendingUp, AlertCircle, Wallet
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getPayments, verifyPayment, addNotification, Payment } from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusStyles: Record<string, string> = {
  paid: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400",
  pending: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  overdue: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  partial: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getPayments(user).then(setPayments);
  }, [user]);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountPaid, 0);
  const totalPending = payments.filter((p) => p.status === "pending" || p.status === "partial").reduce((s, p) => s + p.balance, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.balance, 0);

  const handleVerify = async (id: string, status: "paid" | "rejected") => {
    const result = await verifyPayment(id, user?.id || "", status);
    if (result) {
      const payments = await getPayments(user);
      setPayments(payments);
      await addNotification({
        userId: result.tenantId,
        title: status === "paid" ? "Payment Verified" : "Payment Rejected",
        message: `Your payment of ${formatCurrency(result.amountPaid)} has been ${status}`,
        type: "payment",
        read: false,
      });
      toast.success(`Payment ${status === "paid" ? "approved" : "rejected"}`);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* 💳 Payments Hero — Professional Finance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-8 sm:p-10">
        <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
              <CreditCard className="h-3 w-3" />
              Payment Ledger
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Payments</h2>
            <p className="text-white/70 text-sm mt-1.5">Track and manage all rental payment transactions</p>
          </div>
          <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"><Download className="h-4 w-4 mr-1.5" />Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "from-green-500 to-green-600", change: "This month" },
          { label: "Pending", value: formatCurrency(totalPending), icon: Wallet, color: "from-amber-500 to-amber-600", change: "Awaiting approval" },
          { label: "Overdue", value: formatCurrency(totalOverdue), icon: AlertCircle, color: "from-red-500 to-red-600", change: `${payments.filter(p => p.status === "overdue").length} accounts` },
          { label: "Transactions", value: payments.length, icon: CreditCard, color: "from-primary-500 to-primary-600", change: `${payments.filter(p => p.status === "paid").length} completed` },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{stat.change}</p>
                </div>
                <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Payment Ledger</CardTitle>
              <CardDescription>Complete record of all payment transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input placeholder="Search by tenant..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface text-sm text-foreground px-3">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardHeader>
<CardContent className="overflow-x-auto">
          <div className="min-w-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {(user?.role === "owner" || user?.role === "admin" || user?.role === "agent") && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-secondary text-sm">
                    No payment records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment, i) => (
                  <motion.tr key={payment.id} variants={fadeInUp} custom={i}
                    className="border-b border-border transition-colors hover:bg-surface-secondary/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={payment.tenantName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                        <span className="text-sm font-medium text-foreground">{payment.tenantName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">{payment.propertyName || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</span>
                      <span className="text-xs text-text-tertiary ml-1">of {formatCurrency(payment.amountDue)}</span>
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0.5 capitalize", statusStyles[payment.status])}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    {(user?.role === "owner" || user?.role === "admin" || user?.role === "agent") && (
                      <TableCell>
                        <div className="flex gap-1">
                          {payment.status === "pending" && (
                            <>
                              <Button size="sm" className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600"
                                onClick={() => handleVerify(payment.id, "paid")}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500"
                                onClick={() => handleVerify(payment.id, "rejected")}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {payment.status === "paid" && (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">Verified</Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
