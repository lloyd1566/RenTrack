"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, Clock, Home, FileText, Calendar, Building2, CreditCard, Mail, PhilippinePeso, ReceiptText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getPayments, addPayment, getTenants, getConversations, Payment, TenantRecord } from "@/lib/data";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"regular" | "advance">("regular");
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "credit_card" | "bank_transfer" | "cash" | "other">("gcash");
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

  useEffect(() => {
    if (!user) return;
    getPayments(user).then((raw) => {
      const normalized = (raw || []).map((item: any) => ({
        ...item,
        status: item.status || "pending",
        receiptUrl: item.receiptUrl || null,
        paymentMethod: item.paymentMethod || "other",
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
    if (paymentMethod === "other" && !otherMethodName.trim()) {
      toast.error("Please specify the payment method name"); return;
    }
    if (paymentMethod === "gcash") {
      if (!gcashNumber.trim() || !gcashName.trim()) {
        toast.error("Please provide your GCash number and account name"); return;
      }
      const digits = gcashNumber.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) {
        toast.error("GCash number must be 10 to 13 digits"); return;
      }
    }
    if (paymentMethod === "credit_card" && (!accountHolder.trim() || !cardLast4.trim() || !cardExpiry.trim())) {
      toast.error("Please fill in all credit card fields"); return;
    }
    if ((paymentMethod === "bank_transfer" || paymentMethod === "other") && (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim())) {
      toast.error("Please fill in all bank/account details"); return;
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
      const dueDate = new Date(); dueDate.setDate(5); if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
      const methodNote = paymentMethod === "other" ? otherMethodName.trim() : undefined;
      const payment = await addPayment({
        tenantId: user.id,
        tenantName: user.name,
        unitId: tenant?.unitId || "",
        propertyName: tenant?.propertyName || "",
        amountPaid: Number(paymentAmount),
        amountDue: rentAmount,
        balance: Math.max(0, rentAmount - Number(paymentAmount)),
        paymentDate: new Date().toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        status: "pending",
        paymentMethod,
        paymentMethodNote: methodNote,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        accountHolder: accountHolder || undefined,
        cardLast4: cardLast4 || undefined,
        cardExpiry: cardExpiry || undefined,
        gcashNumber: paymentMethod === "gcash" ? gcashNumber.trim() : undefined,
        gcashName: paymentMethod === "gcash" ? gcashName.trim() : undefined,
        stayStart: desiredStart || undefined,
        stayEnd: desiredEnd || undefined,
        notes: `${paymentType === "advance" ? "Advance" : "Regular"} payment — receipt generated automatically`,
        receiptUrl: undefined,
        createdBy: user.id,
      });
      setPayments((current) => [payment, ...current]);
      setShowReceiptForm(false); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("gcash"); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); setGcashNumber(""); setGcashName("");
      toast.success("Payment submitted. Your receipt is ready to download.");
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
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        {paymentType === "advance" ? "Record Advance Payment" : "Make Regular Payment"}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        {paymentType === "advance"
                          ? "Record an advance payment to be credited to your account"
                          : "Submit your payment details; a receipt is generated automatically for verification"}
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
                            <PhilippinePeso className="h-4 w-4 mr-2" />
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

                       {paymentMethod === "gcash" && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           className="mt-3 space-y-3"
                         >
                           <div>
                             <label className="block text-sm font-medium mb-1.5">GCash Mobile Number</label>
                             <input
                               type="tel"
                               placeholder="09XXXXXXXXX"
                               value={gcashNumber}
                               onChange={(e) => setGcashNumber(e.target.value.replace(/[^0-9+]/g, "").slice(0, 13))}
                               className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                             />
                             <p className="text-xs text-text-tertiary mt-1">Enter the GCash number you used for this payment</p>
                           </div>
                           <div>
                             <label className="block text-sm font-medium mb-1.5">GCash Account Name</label>
                             <input
                               type="text"
                               placeholder="Name registered on GCash"
                               value={gcashName}
                               onChange={(e) => setGcashName(e.target.value)}
                               className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-base"
                             />
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
                          <Button variant="outline" onClick={() => {setShowReceiptForm(false); setPaymentAmount(""); setPaymentType("regular"); setPaymentMethod("gcash"); setOtherMethodName(""); setBankName(""); setAccountNumber(""); setAccountHolder(""); setCardLast4(""); setCardExpiry(""); setGcashNumber(""); setGcashName(""); setDesiredStart(""); setDesiredEnd(""); }}>Cancel</Button>
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
                         <>
                           {myPayments.slice().reverse().map((payment, i) => (
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
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
    </div>
  );
}
