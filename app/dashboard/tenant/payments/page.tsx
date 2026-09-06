"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, Clock, Home, FileText, Calendar, Building2, CreditCard, Mail, PhilippinePeso, ReceiptText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getPayments, addPayment, getTenants, getConversations, getTenantPaymentSummary, Payment, TenantRecord } from "@/lib/data";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";
import ReceiptModal from "@/components/receipt-modal";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"regular" | "advance" | "outstanding">("regular");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upload_receipt">("cash");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [otherMethodName, setOtherMethodName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [desiredStart, setDesiredStart] = useState("");
  const [desiredEnd, setDesiredEnd] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const averageOutstandingBalance = payments.reduce((sum, p) => sum + (p.balance || 0), 0);
  const tenantPaymentSummary = user ? getTenantPaymentSummary(payments, user.id) : { totalPaid: 0, outstanding: 0, hasAwaitingConfirmation: false, waitingForConfirmation: null, hasConfirmedPayment: false };
  const outstandingBalance = tenantPaymentSummary.outstanding;

  useEffect(() => {
    if (!user) return;
    getPayments(user).then((raw) => {
      const normalized = (raw || []).map((item: any) => ({
        ...item,
        status: item.status || "pending",
        receiptUrl: item.receiptUrl || null,
        paymentMethod: item.paymentMethod || "cash",
        amountPaid: item.amountPaid || 0,
        amountDue: item.amountDue || 0,
        balance: item.balance || 0,
        paymentDate: item.paymentDate || "",
        notes: item.notes || "",
        gcashNumber: item.gcashNumber || undefined,
      }));
      setPayments(normalized);
    }).catch(() => setPayments([]));
    getTenants().then(records => {
      const found = records.find(t => t.id === user.id);
      setTenant(found || null);
    }).catch(() => setTenant(null));
    getConversations().then(setConversations).catch(() => setConversations([]));
  }, [user]);

  const myPayments = payments;
  const latestPayment = myPayments.length > 0 ? myPayments[0] : null;
  const rentAmountDisplay = tenant?.rentAmount ?? latestPayment?.amountDue ?? 0;
  const rentAmount = rentAmountDisplay;

  const contractStart = tenant?.contractStart ? new Date(tenant.contractStart) : null;
  const contractEnd = tenant?.contractEnd ? new Date(tenant.contractEnd) : null;
  const contractDuration = contractStart && contractEnd
    ? Math.ceil((contractEnd.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  const handleUpload = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount"); return;
    }
    if (paymentMethod === "upload_receipt" && !receiptFile) {
      toast.error("Please upload your payment receipt"); return;
    }
    if (!desiredStart || !desiredEnd) {
      toast.error("Please select your desired stay dates"); return;
    }
    if (new Date(desiredEnd) <= new Date(desiredStart)) {
      toast.error("End date must be after start date"); return;
    }
    if (!user) return;
    setIsUploading(true);
    try {
      let uploadedReceiptUrl: string | undefined;
      if (paymentMethod === "upload_receipt") {
        const formData = new FormData();
        formData.append("file", receiptFile!);
        formData.append("type", "receipt");
        const uploadResponse = await fetch("/api/auth/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || "Receipt upload failed");
        }
        uploadedReceiptUrl = uploadData.url;
      }

      const dueDate = new Date(); dueDate.setDate(5); if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
      const isOutstanding = paymentType === "outstanding";
      const paymentAmountNum = Number(paymentAmount);
      const payment = await addPayment({
        tenantId: user.id,
        tenantName: user.name,
        unitId: tenant?.unitId || "",
        propertyName: tenant?.propertyName || "",
        amountPaid: paymentAmountNum,
        amountDue: isOutstanding ? paymentAmountNum : rentAmount,
        balance: isOutstanding ? 0 : Math.max(0, rentAmount - paymentAmountNum),
        paymentDate: new Date().toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pending",
        paymentMethod,
        paymentMethodNote: paymentMethod === "upload_receipt" ? "Receipt uploaded for agent review" : undefined,
        stayStart: desiredStart || undefined,
        stayEnd: desiredEnd || undefined,
        notes: `${isOutstanding ? "Outstanding balance" : paymentType === "advance" ? "Advance" : "Regular"} payment${paymentMethod === "upload_receipt" ? " with uploaded receipt" : " paid in cash"}`,
        receiptUrl: uploadedReceiptUrl,
        createdBy: user.id,
      });
      setPayments((current) => [payment, ...current]);
      setShowReceiptForm(false); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("cash"); setReceiptFile(null); setReceiptPreviewUrl(null); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); setGcashNumber(""); setGcashName(""); setDesiredStart(""); setDesiredEnd("");
      toast.success(paymentMethod === "upload_receipt" ? "Receipt uploaded and submitted for agent review." : "Payment submitted successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit payment");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-surface border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contract">Rental Contract</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
          </div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary-500" />
                    Payment Center
                  </CardTitle>
                  <CardDescription className="text-xs">Submit and review your rental payments</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => { setActiveTab("payments"); setPaymentType("regular"); setShowReceiptForm(true); }} className="w-full h-20 flex flex-col gap-1.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    <CreditCard className="h-5 w-5" />
                     <span className="text-sm font-medium">Submit Regular Payment</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => { setActiveTab("payments"); setPaymentType("advance"); setShowReceiptForm(true); }} className="w-full h-20 flex flex-col gap-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                    <PhilippinePeso className="h-5 w-5" />
                     <span className="text-sm font-medium">Submit Advance Payment</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    onClick={() => { 
                      setActiveTab("payments"); 
                      setPaymentType("outstanding"); 
                      setPaymentAmount(String(outstandingBalance)); 
                      setShowReceiptForm(true); 
                    }} 
                    className="w-full h-20 flex flex-col gap-1.5 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    disabled={outstandingBalance <= 0}
                  >
                    <AlertCircle className="h-5 w-5" />
                     <span className="text-sm font-medium">Pay Outstanding Balance</span>
                     {outstandingBalance > 0 && <span className="text-xs opacity-90">{formatCurrency(outstandingBalance)}</span>}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => setActiveTab("contract")} variant="outline" className="w-full h-20 flex flex-col gap-1.5 border-2">
                    <FileText className="h-5 w-5" />
                     <span className="text-sm font-medium">View Rental Contract</span>
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
                      { label: "Rent Amount", value: formatCurrency(tenant.rentAmount || 0), icon: PhilippinePeso },
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
              {tenantPaymentSummary.hasAwaitingConfirmation && tenantPaymentSummary.waitingForConfirmation && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Already paid — waiting for owner confirmation</p>
                    <p className="mt-1 text-xs text-amber-800">
                      Your payment of {formatCurrency(tenantPaymentSummary.waitingForConfirmation.amountPaid || 0)} is already recorded. Please wait for the owner to confirm it before the balance is deducted.
                    </p>
                  </div>
                </div>
              )}

              {!showReceiptForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-primary-500" />
                        Make a Payment
                      </CardTitle>
                      <CardDescription>Pay securely and receive an automatic receipt for verification</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => { setActiveTab("payments"); setPaymentType("regular"); setShowReceiptForm(true); }} className="w-full h-32 flex flex-col gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                            <CreditCard className="h-8 w-8" />
                            <span className="font-medium">Regular Payment</span>
                            <span className="text-xs opacity-80">Receipt generated automatically</span>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => { setActiveTab("payments"); setPaymentType("advance"); setShowReceiptForm(true); }} className="w-full h-32 flex flex-col gap-2 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                            <PhilippinePeso className="h-8 w-8" />
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
                         <ReceiptText className="h-5 w-5 text-primary-500" />
                         {paymentType === "advance" ? "Record Advance Payment" : paymentType === "outstanding" ? "Pay Outstanding Balance" : "Make Regular Payment"}
                       </h3>
                       <p className="text-xs text-text-secondary mt-1">
                         {paymentType === "advance"
                           ? "Record an advance payment to be credited to your account"
                           : paymentType === "outstanding"
                           ? "Pay your outstanding balance in full"
                           : "Submit your payment details; a receipt is generated automatically for verification"}
                       </p>
                      </div>
                     <div className="p-6 space-y-4">
                       {(() => {
                         const now = new Date();
                         const currentMonth = now.getMonth();
                         const currentYear = now.getFullYear();
                         const recentPaidPayment = myPayments.find(p => {
                           if (!p.paymentDate || p.status !== "paid") return false;
                           const paymentDate = new Date(p.paymentDate);
                           return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                         });
                         if (recentPaidPayment) {
                           return (
                             <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                               <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                               <div>
                                 <p className="font-semibold">You already have a paid payment this month</p>
                                 <p className="mt-1 text-xs text-amber-700">
                                   Amount: {formatCurrency(recentPaidPayment.amountPaid || 0)} • Date: {formatDate(recentPaidPayment.paymentDate)}
                                 </p>
                                 <p className="mt-1 text-xs text-amber-700">
                                   If this is incorrect or you need to make an additional payment, please contact support.
                                 </p>
                               </div>
                             </div>
                           );
                         }
                         return null;
                       })()}
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
                            <PhilippinePeso className="h-4 w-4 mr-2" />
                            Advance Payment
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as "cash" | "upload_receipt")}
                          className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                        >
                          <option value="cash">Cash</option>
                          <option value="upload_receipt">Upload Receipt</option>
                        </select>
                        {paymentMethod === "upload_receipt" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-3"
                          >
                            <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-3">
                              <label className="block text-sm font-medium mb-2 text-blue-900">Upload Payment Receipt</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setReceiptFile(file);
                                  if (file && file.type.startsWith("image/")) {
                                    setReceiptPreviewUrl(URL.createObjectURL(file));
                                  } else {
                                    setReceiptPreviewUrl(null);
                                  }
                                }}
                                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-blue-700"
                              />
                              <p className="mt-2 text-xs text-blue-700">Upload a receipt image or PDF. The agent will review it and forward it to the owner.</p>
                            </div>
                            {receiptPreviewUrl && (
                              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <img src={receiptPreviewUrl} alt="Payment receipt preview" className="max-h-52 w-full object-contain" />
                              </div>
                            )}
                            {receiptFile && (
                              <p className="text-xs text-slate-600">Selected: {receiptFile.name}</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Payment Amount (₱)</label>
                       <input
                         type="number"
                         placeholder="₱0.00"
                         value={paymentAmount}
                         onChange={(e) => setPaymentAmount(e.target.value)}
                         className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-lg"
                       />
                       </div>
                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Start Date</label>
                          <input
                            type="date"
                            value={desiredStart}
                            onChange={(e) => setDesiredStart(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">End Date</label>
                          <input
                            type="date"
                            value={desiredEnd}
                            onChange={(e) => setDesiredEnd(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                       <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                       <div><p className="font-semibold">Automatic receipt included</p><p className="mt-1 text-xs text-blue-700">After you submit, RentTrack creates a downloadable receipt and sends it to the owner/agent for confirmation.</p></div>
                     </div>
                     <div className="flex gap-3">
                       <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                         {isUploading ? (
                           <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Processing payment...</>
                         ) : (
                           <>{paymentType === "advance" ? "Record Advance" : "Submit Payment"}</>
                         )}
                       </Button>
                          <Button variant="outline" onClick={() => {setShowReceiptForm(false); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("cash"); setReceiptFile(null); setReceiptPreviewUrl(null); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); setGcashNumber(""); setGcashName(""); setDesiredStart(""); setDesiredEnd(""); }}>Cancel</Button>
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
                    <div className="mb-4">
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full"
                        placeholder="Filter by date"
                      />
                    </div>
                    <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1">
                      {myPayments.length === 0 ? (
                        <div className="text-center py-12">
                          <CreditCard className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                          <p className="text-text-secondary font-medium">No payments yet</p>
                          <p className="text-text-tertiary text-sm mt-1">Payment records will appear here once you make your first payment</p>
                        </div>
                        ) : (
                          <>
                            {(dateFilter ? myPayments.slice().reverse().filter(p => p.paymentDate === dateFilter) : myPayments.slice().reverse()).map((payment, i) => (
                              payment ? (
                                <motion.div
                                  key={payment.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05, duration: 0.3 }}
                                  className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all duration-200 hover:shadow-md"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${(payment?.status || "pending") === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                                      {(payment?.status || "pending") === "paid" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    </div>
                                     <div>
                                       <p className="font-medium text-foreground">{formatCurrency(payment?.amountPaid || 0)}</p>
                                       <p className="text-xs text-text-secondary">{formatDate(payment?.paymentDate || "")} • {payment?.paymentMethod || "other"}</p>
                                       {payment?.stayStart && payment?.stayEnd && (
                                         <p className="text-[10px] text-blue-600">Stay: {formatDate(payment.stayStart)} - {formatDate(payment.stayEnd)}</p>
                                       )}
                                       {payment?.gcashNumber && <p className="text-[10px] text-text-tertiary">GCash: {payment.gcashNumber}</p>}
                                       {payment?.notes && <p className="text-xs text-text-tertiary mt-0.5">{payment.notes}</p>}
                                     </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     {payment?.receiptUrl && (
                                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewingReceipt(payment)}>
                                         <Eye className="h-4 w-4" />
                                       </Button>
                                     )}
                                     <Badge variant={(payment?.status || "pending") === "paid" ? "success" : "warning"} className="capitalize">{payment?.status || "pending"}</Badge>
                                   </div>
                                </motion.div>
                              ) : null
                            ))}
                          </>
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
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={conv.otherUser?.avatarUrl || ""} fallback={getInitials(conv.otherUser?.name)} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{conv.otherUser?.name}</p>
                            <p className="text-sm text-text-secondary">{conv.lastMessage || "No messages yet"}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedConversation(conv); setIsMessagingOpen(true); }}>Open</Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {selectedConversation && (
        <MessagingModal
          isOpen={isMessagingOpen}
          onClose={() => {
            setIsMessagingOpen(false);
            setSelectedConversation(null);
          }}
          otherUser={{
            id: selectedConversation.otherUser?.id || "",
            name: selectedConversation.otherUser?.name || "Unknown",
            email: selectedConversation.otherUser?.email || "",
            role: selectedConversation.otherUser?.role || "tenant",
            avatarUrl: selectedConversation.otherUser?.avatarUrl,
            allowMessages: true,
          }}
          properties={[]}
         />
       )}

       <ReceiptModal
         isOpen={!!viewingReceipt}
         onClose={() => setViewingReceipt(null)}
         receiptUrl={viewingReceipt?.receiptUrl || null}
         payment={viewingReceipt || undefined}
       />
     </div>
   );
 }
