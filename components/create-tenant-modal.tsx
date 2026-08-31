"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    propertyName: string;
    unitNumber: string;
    rentAmount: string;
    contractStart: string;
    contractEnd: string;
    password: string;
  }) => Promise<void>;
  submitting: boolean;
}

export default function CreateTenantModal({ isOpen, onClose, onSubmit, submitting }: CreateTenantModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    propertyName: "",
    unitNumber: "",
    rentAmount: "",
    contractStart: "",
    contractEnd: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({ name: "", email: "", phone: "", address: "", propertyName: "", unitNumber: "", rentAmount: "", contractStart: "", contractEnd: "", password: "" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-[520px] h-[520px] rounded-2xl border border-border bg-white shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Create Tenant</h3>
                <p className="text-xs text-text-secondary">Add tenant, rental, and account information</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto h-[calc(100%-140px)]">
              <div>
                <h4 className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">Tenant Information</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Dela Cruz" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@example.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 XXX XXX XXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Address</label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Tenant address" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">Rental Information</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Property Name *</label>
                    <Input value={form.propertyName} onChange={(e) => setForm({ ...form, propertyName: e.target.value })} placeholder="Property name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Unit Number *</label>
                    <Input value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="Rental unit / room" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Monthly Rent</label>
                    <Input type="number" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} placeholder="Monthly rent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Contract Start</label>
                    <Input type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Contract End</label>
                    <Input type="date" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">Account Information</h4>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Password *</label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" required />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Tenant Account
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
