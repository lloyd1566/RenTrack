"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle, Eye, X, Clock, Home, FileText, Calendar, DollarSign, Building2, User, CreditCard, TrendingUp, Shield, Bell, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getPayments, addPayment, addNotification, notifyAdmins, getTenants, getConversations, getMessages, markAllMessagesRead, Message, Payment, TenantRecord } from "@/lib/data";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"regular" | "advance">("regular");
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "credit_card" | "bank_transfer" | "cash" | "other">("gcash");
  const [otherMethodName, setOtherMethodName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  const rentAmount = 6000;

  useEffect(() => {
    if (!user) return;
    getPayments(user).then(setPayments).catch(() => setPayments([]));
    getTenants().then(records => {
      const found = records.find(t => t.id === user.id);
      setTenant(found || null);
    }).catch(() => setTenant(null));
    getConversations().then(setConversations).catch(() => setConversations([]));
  }, [user]);

  const myPayments = payments;
  const latestPayment = myPayments.length > 0 ? myPayments[myPayments.length - 1] : null;
  const balance = latestPayment?.balance ?? 0;
  const rentAmountDisplay = tenant?.rentAmount ?? latestPayment?.amountDue ?? 0;

  const contractStart = tenant?.contractStart ? new Date(tenant.contractStart) : null;
  const contractEnd = tenant?.contractEnd ? new Date(tenant.contractEnd) : null;
  const contractDuration = contractStart && contractEnd
    ? Math.ceil((contractEnd.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  const getNextDueDate = () => {
    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth(), 5);
    if (due < now) due.setMonth(due.getMonth() + 1);
    return due.toISOString().split("T")[0];
  };

  const handleUpload = () => {
    if (!selectedFile) { toast.error("Please select a receipt image to upload"); return; }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount"); return;
    }
    if (paymentMethod === "other" && !otherMethodName.trim()) {
      toast.error("Please specify the payment method name"); return;
    }
    if (paymentMethod === "credit_card" && (!accountHolder.trim() || !cardLast4.trim() || !cardExpiry.trim())) {
      toast.error("Please fill in all credit card fields"); return;
    }
    if ((paymentMethod === "bank_transfer" || paymentMethod === "other") && (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim())) {
      toast.error("Please fill in all bank/account details"); return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (user) {
        const dueDate = new Date(); dueDate.setDate(5); if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
        const methodNote = paymentMethod === "other" ? otherMethodName.trim() : undefined;
        addPayment({ tenantId: user.id, tenantName: user.name, unitId: "", propertyName: "", amountPaid: Number(paymentAmount), amountDue: rentAmount, balance: Math.max(0, rentAmount - Number(paymentAmount)), paymentDate: new Date().toISOString().split("T")[0], dueDate: dueDate.toISOString().split("T")[0], status: "pending", paymentMethod, paymentMethodNote: methodNote, bankName: bankName || undefined, accountNumber: accountNumber || undefined, accountHolder: accountHolder || undefined, cardLast4: cardLast4 || undefined, cardExpiry: cardExpiry || undefined, notes: "Receipt uploaded", receiptUrl: base64Data, createdBy: user.id });
        addNotification({ userId: user.id, title: "Payment Receipt Uploaded", message: `Your payment of ${formatCurrency(Number(paymentAmount))} has been submitted for verification`, type: "payment", read: false });
        notifyAdmins({ title: "New Payment Receipt Uploaded", message: `${user.name} uploaded a payment receipt of ${formatCurrency(Number(paymentAmount))} for verification`, type: "payment", read: false });
        getPayments(user).then((latest) => {
          setPayments(latest);
          const last = latest[0];
          if (last && last.receiptUrl) {
            setViewingReceipt(last.receiptUrl);
          }
        });
        setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("gcash"); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); setIsUploading(false);
        toast.success("Payment receipt uploaded! Awaiting verification.");
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5 p-4 sm:p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-surface border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contract">Rental Contract</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          {/* Stats Grid */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Current Balance", value: formatCurrency(balance), icon: DollarSign, color: "from-blue-500 to-blue-600", change: balance > 0 ? "Outstanding" : "Cleared" },
              { label: "Monthly Rent", value: formatCurrency(rentAmountDisplay), icon: Home, color: "from-purple-500 to-purple-600", change: "Due on 5th" },
              { label: "Total Payments", value: myPayments.length.toString(), icon: CreditCard, color: "from-emerald-500 to-emerald-600", change: "All time" },
              { label: "Account Status", value: tenant?.status === "active" ? "Active" : "Inactive", icon: Shield, color: "from-amber-500 to-amber-600", change: tenant?.idVerificationStatus === "approved" ? "Verified" : "Pending verification" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-text-secondary">{stat.label}</span>
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md", stat.color)}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                        <TrendingUp className="h-3 w-3" />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs">Manage your rental payments and account</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => { setActiveTab("payments"); setPaymentType("regular"); setShowReceiptForm(true); }} className="w-full h-20 flex flex-col gap-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-medium">Regular Payment</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => { setActiveTab("payments"); setPaymentType("advance"); setShowReceiptForm(true); }} className="w-full h-20 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm font-medium">Advance Payment</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => setActiveTab("contract")} variant="outline" className="w-full h-20 flex flex-col gap-1.5 border-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-medium">View Contract</span>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="contract" className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border border-border overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary-500" />
                  Rental Contract Details
                </CardTitle>
                <CardDescription className="text-xs">Your current rental agreement information</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {tenant ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Property", value: tenant.propertyName || "Not assigned", icon: Building2 },
                      { label: "Unit Number", value: tenant.unitNumber || "Not assigned", icon: Home },
                      { label: "Rent Amount", value: formatCurrency(tenant.rentAmount || 0), icon: DollarSign },
                      { label: "Contract Start", value: contractStart ? formatDate(tenant.contractStart!) : "Not set", icon: Calendar },
                      { label: "Contract End", value: contractEnd ? formatDate(tenant.contractEnd!) : "Not set", icon: Calendar },
                      { label: "Duration", value: contractDuration ? `${contractDuration} months` : "Not set", icon: Clock },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 shrink-0">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">{item.label}</p>
                          <p className="text-base font-semibold text-foreground">{item.value}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Home className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-secondary font-medium text-sm">No rental contract assigned yet</p>
                    <p className="text-text-tertiary text-xs mt-1">Contact your agent to get assigned to a unit</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Payment actions and form */}
            <div className="lg:col-span-2 space-y-6">
              {!showReceiptForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary-500" />
                        Make a Payment
                      </CardTitle>
                      <CardDescription>Upload a payment receipt or record an advance payment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => { setActiveTab("payments"); setPaymentType("regular"); setShowReceiptForm(true); }} className="w-full h-32 flex flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                            <CreditCard className="h-8 w-8" />
                            <span className="font-medium">Regular Payment</span>
                            <span className="text-xs opacity-80">Upload receipt for verification</span>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => { setActiveTab("payments"); setPaymentType("advance"); setShowReceiptForm(true); }} className="w-full h-32 flex flex-col gap-2 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                            <DollarSign className="h-8 w-8" />
                            <span className="font-medium">Advance Payment</span>
                            <span className="text-xs opacity-80">Record advance payment credit</span>
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Form */}
              <AnimatePresence>
                {showReceiptForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary-500" />
                        {paymentType === "advance" ? "Record Advance Payment" : "Upload Payment Receipt"}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {paymentType === "advance"
                          ? "Record an advance payment to be credited to your account"
                          : "Submit proof of payment for verification"}
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Payment Type</label>
                        <div className="flex gap-2">
                          <Button
                            variant={paymentType === "regular" ? "default" : "outline"}
                            onClick={() => setPaymentType("regular")}
                            className="flex-1"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Regular Payment
                          </Button>
                          <Button
                            variant={paymentType === "advance" ? "default" : "outline"}
                            onClick={() => setPaymentType("advance")}
                            className="flex-1"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Advance Payment
                          </Button>
                        </div>
                      </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as "gcash" | "credit_card" | "bank_transfer" | "cash" | "other")}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                    >
                      <option value="gcash">GCash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                    {paymentMethod === "other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <input
                          type="text"
                          placeholder="Enter payment method name"
                          value={otherMethodName}
                          onChange={(e) => setOtherMethodName(e.target.value)}
                          className="mt-2 w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                        />
                      </motion.div>
                    )}

                    {paymentMethod === "credit_card" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Name on card"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Last 4 Digits</label>
                            <input
                              type="text"
                              placeholder="1234"
                              maxLength={4}
                              value={cardLast4}
                              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                                setCardExpiry(v);
                              }}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {(paymentMethod === "bank_transfer" || paymentMethod === "other") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{paymentMethod === "bank_transfer" ? "Bank Name" : "Provider Name"}</label>
                          <input
                            type="text"
                            placeholder={paymentMethod === "bank_transfer" ? "e.g. BDO, BPI, GCash" : "e.g. Palawan Express, Western Union"}
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">{paymentMethod === "bank_transfer" ? "Account Number" : "Reference / Tracking Number"}</label>
                          <input
                            type="text"
                            placeholder={paymentMethod === "bank_transfer" ? "Your account number" : "Transaction reference number"}
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Account Holder Name</label>
                          <input
                            type="text"
                            placeholder="Name on the account"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Payment Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-lg"
                    />
                  </div>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary-300 transition-colors" onClick={() => document.getElementById("receipt-upload")?.click()}>
                    <Upload className="h-10 w-10 mx-auto mb-4 text-text-tertiary" />
                    <p className="font-medium">{selectedFile ? selectedFile.name : "Click to upload receipt"}</p>
                    <p className="text-xs text-text-tertiary mt-1">Supports images and PDF files</p>
                    <input id="receipt-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                      {isUploading ? (
                        <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Uploading...</>
                      ) : (
                        <>{paymentType === "advance" ? "Record Advance" : "Submit Receipt"}</>
                      )}
                    </Button>
                     <Button variant="outline" onClick={() => {setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("gcash"); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); }}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Right: Payment History */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <Card className="border border-border h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary-500" />
                    Payment History
                  </CardTitle>
                  <CardDescription>Track all your payment transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                        <p className="text-text-secondary font-medium">No payments yet</p>
                        <p className="text-text-tertiary text-sm mt-1">Payment records will appear here once you make your first payment</p>
                      </div>
                    ) : (
                      myPayments.slice().reverse().map((payment, i) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payment.status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                              {payment.status === "paid" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{formatCurrency(payment.amountPaid)}</p>
                              <p className="text-xs text-text-secondary">{formatDate(payment.paymentDate)} • {payment.paymentMethod}</p>
                              {payment.notes && <p className="text-xs text-text-tertiary mt-0.5">{payment.notes}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.receiptUrl && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewingReceipt(payment.receiptUrl!)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Badge variant={payment.status === "paid" ? "success" : "warning"} className="capitalize">{payment.status}</Badge>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary-500" />
                Messages
              </CardTitle>
              <CardDescription>Your conversations with agents and managers</CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary font-medium">No messages yet</p>
                  <p className="text-text-tertiary text-sm mt-1">Messages from your conversations will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <motion.div
                      key={conv.otherUser?.id || conv.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedConversation(conv);
                        setIsMessagingOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={conv.otherUser?.avatarUrl} fallback={conv.otherUser?.name ? getInitials(conv.otherUser.name) : "?"} />
                        <div>
                          <p className="font-medium text-foreground">{conv.otherUser?.name || "Unknown User"}</p>
                          <p className="text-xs text-text-secondary truncate max-w-[200px]">
                            {conv.lastMessage.subject && `${conv.lastMessage.subject} - `}
                            {conv.lastMessage.body}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-tertiary">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="bg-blue-600 text-white text-[10px]">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Viewer */}
      <AnimatePresence>
        {viewingReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setViewingReceipt(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewingReceipt(null)}
                className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </motion.button>
              <img src={viewingReceipt} alt="Receipt" className="w-full h-auto rounded-2xl shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messaging Modal */}
      {selectedConversation && (
        <MessagingModal
          isOpen={isMessagingOpen}
          onClose={() => {
            setIsMessagingOpen(false);
            setSelectedConversation(null);
            setChatMessages([]);
          }}
          otherUser={{
            id: selectedConversation.otherUser?.id || "",
            name: selectedConversation.otherUser?.name || "Unknown",
            email: selectedConversation.otherUser?.email || "",
            role: selectedConversation.otherUser?.role || "tenant",
            avatarUrl: selectedConversation.otherUser?.avatarUrl,
            allowMessages: true,
          }}
        />
      )}
    </motion.div>
  );
}
