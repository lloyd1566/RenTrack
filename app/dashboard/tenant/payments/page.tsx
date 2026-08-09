"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { addPayment, addNotification, notifyAdmins, getPayments, Payment } from "@/lib/data";
import { toast } from "sonner";

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const rentAmount = 6000;

  useEffect(() => {
    if (user) {
      getPayments(user).then(setPayments).catch(() => setPayments([]));
    }
  }, [user]);

  useEffect(() => {
    const withReceipt = payments.filter((p) => !!p.receiptUrl);
    setLastReceipt(withReceipt.length > 0 ? withReceipt[withReceipt.length - 1].receiptUrl || null : null);
  }, [payments]);

  const handleUpload = () => {
    if (!selectedFile) { toast.error("Please select a receipt image to upload"); return; }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) { toast.error("Please enter a valid payment amount"); return; }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (user) {
        const dueDate = new Date(); dueDate.setDate(5); if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
        addPayment({ tenantId: user.id, tenantName: user.name, unitId: "", propertyName: "", amountPaid: Number(paymentAmount), amountDue: rentAmount, balance: Math.max(0, rentAmount - Number(paymentAmount)), paymentDate: new Date().toISOString().split("T")[0], dueDate: dueDate.toISOString().split("T")[0], status: "pending", paymentMethod: "other", notes: "Receipt uploaded", receiptUrl: base64Data, createdBy: user.id });
        addNotification({ userId: user.id, title: "Payment Receipt Uploaded", message: `Your payment of ${formatCurrency(Number(paymentAmount))} has been submitted for verification`, type: "payment", read: false });
        notifyAdmins({ title: "New Payment Receipt Uploaded", message: `${user.name} uploaded a payment receipt of ${formatCurrency(Number(paymentAmount))} for verification`, type: "payment", read: false });
        getPayments(user).then(setPayments);
        setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount(""); setIsUploading(false);
        toast.success("Payment receipt uploaded! Awaiting verification.");
      }
    };
    reader.onerror = () => { setIsUploading(false); toast.error("Failed to read file. Please try again."); };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upload Payment</h1>
            <p className="text-xl text-blue-100">Submit your payment receipt for verification</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-gray-200 shadow-lg max-w-2xl">
            <CardContent className="p-8">
              {!showReceiptForm ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Upload Payment Receipt</h3>
                      <p className="text-sm text-gray-500 mt-1">Submit proof of payment for verification</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowReceiptForm(true)} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₱</span>
                      <Input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="pl-10 h-12" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors" onClick={() => document.getElementById("receipt-upload")?.click()}>
                      <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium text-gray-900">{selectedFile ? selectedFile.name : "Click to upload receipt"}</p>
                      <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, PDF</p>
                      <input id="receipt-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleUpload} disabled={isUploading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      {isUploading ? "Uploading..." : "Submit Receipt"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowReceiptForm(false); setSelectedFile(null); setPaymentAmount(""); }} className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {lastReceipt && (
            <Card className="border-gray-200 shadow-lg max-w-2xl mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Last Uploaded Receipt</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img src={lastReceipt} alt="Uploaded receipt" className="w-full max-h-96 object-contain bg-gray-50" />
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
