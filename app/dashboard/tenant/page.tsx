"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2, AlertCircle, Eye, X, Clock, Home } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getPayments, addPayment, addNotification, Payment } from "@/lib/data";
import { toast } from "sonner";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (user) getPayments(user).then(setPayments);
  }, [user]);

  const myPayments = payments.filter((p) => p.tenantName === user?.name || p.createdBy === user?.id);
  const balance = myPayments.length > 0 ? myPayments[myPayments.length - 1].balance : 0;
  const rentAmount = myPayments.length > 0 ? myPayments[myPayments.length - 1].amountDue : 0;

  const handleUpload = () => {
    if (!selectedFile) { toast.error("Please select a receipt image to upload"); return; }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount"); return;
    }
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (user) {
        const dueDate = new Date();
        dueDate.setDate(5);
        if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
        addPayment({
          tenantId: user.id, tenantName: user.name, unitId: "", propertyName: "",
          amountPaid: Number(paymentAmount), amountDue: rentAmount || 6000,
          balance: Math.max(0, (rentAmount || 6000) - Number(paymentAmount)),
          paymentDate: new Date().toISOString().split("T")[0],
          dueDate: dueDate.toISOString().split("T")[0],
          status: "pending", paymentMethod: "other", notes: "Receipt uploaded",
          receiptUrl: base64Data,
          createdBy: user.id,
        }, undefined, user.id);
        addNotification({
          userId: user.id, title: "Payment Receipt Uploaded",
          message: `Your payment of ${formatCurrency(Number(paymentAmount))} has been submitted for verification`,
          type: "payment", read: false,
        });
        getPayments(user).then(setPayments);
        setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount("");
        setIsUploading(false);
        toast.success("Payment receipt uploaded! Awaiting verification.");
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-300/20 rounded-full blur-xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
            <Home className="h-3 w-3" />
            Welcome Back
          </div>
          <h2 className="text-3xl font-bold text-white">Hello, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-white/70 text-sm mt-1">Here's your rental summary</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border border-border bg-surface shadow-card">
        <div>
          <p className="text-sm text-text-secondary">Current Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          <p className="text-sm text-text-secondary">Monthly: {formatCurrency(rentAmount)}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Next Payment Due</p>
          <p className="text-xl font-bold">5th of each month</p>
        </div>
        <div className="flex items-end justify-center">
          <Button onClick={() => setShowReceiptForm(true)}>Upload Receipt</Button>
        </div>
      </div>

      {showReceiptForm && (
        <div className="rounded-2xl border border-border bg-surface shadow-card p-6">
          <h3 className="text-lg font-semibold">Upload Payment Receipt</h3>
          <p className="text-xs text-text-secondary">Submit proof of payment for verification</p>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Amount</label>
              <input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-lg" />
            </div>
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer mt-4" onClick={() => document.getElementById("receipt-upload")?.click()}>
              <Upload className="h-10 w-10 mx-auto mb-4 text-text-tertiary" />
              <p>{selectedFile ? selectedFile.name : "Click to upload receipt"}</p>
              <input id="receipt-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleUpload} disabled={isUploading}>{isUploading ? "Uploading..." : "Submit Receipt"}</Button>
              <Button variant="outline" onClick={() => {setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount("");}}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mt-6">Payment History</h3>
      <div className="space-y-2">
        {myPayments.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No payments yet</p>
        ) : (
          myPayments.slice().reverse().map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payment.status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                  {payment.status === "paid" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{formatCurrency(payment.amountPaid)}</p>
                  <p className="text-xs text-text-secondary">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {payment.receiptUrl && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewingReceipt(payment.receiptUrl!)}><Eye className="h-4 w-4" /></Button>
                )}
                <Badge variant={payment.status === "paid" ? "success" : "warning"}>{payment.status}</Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewingReceipt(null)}>
          <div className="relative max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingReceipt(null)} className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center"><X className="h-4 w-4" /></button>
            <img src={viewingReceipt} alt="Receipt" className="w-full h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
