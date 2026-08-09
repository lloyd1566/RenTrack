"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Phone, Mail, Building2, Home, DollarSign, CheckCircle2, XCircle, Trash2, Shield, Eye, X, MoreHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getTenants, TenantRecord, addNotification } from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function TenantsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const canVerify = user && (user.role === "admin" || user.role === "owner" || user.role === "agent");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const records = await getTenants(user);
        setTenants(records);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = async (tenantId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/auth/verify-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: tenantId, status }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`ID verification ${status}`);
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, idVerificationStatus: status } : t));
        if (selectedTenant?.id === tenantId) {
          setSelectedTenant(prev => prev ? { ...prev, idVerificationStatus: status } : null);
        }
      } else {
        toast.error(result.error || "Failed to update verification");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/data/tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Tenant deleted successfully");
        setTenants(prev => prev.filter(t => t.id !== deleteTarget.id));
        setDeleteTarget(null);
        if (selectedTenant?.id === deleteTarget.id) setSelectedTenant(null);
      } else {
        toast.error(result.error || "Failed to delete tenant");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const avgRent = tenants.length > 0 ? tenants.reduce((s, t) => s + (t.rentAmount || 0), 0) / tenants.length : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tenants</h2>
          <p className="text-text-secondary text-sm mt-1">All tenants currently using the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Tenants", value: tenants.length, color: "from-primary-500 to-primary-600" },
          { label: "Active", value: activeCount, color: "from-green-500 to-green-600" },
          { label: "Inactive", value: tenants.length - activeCount, color: "from-gray-500 to-gray-600" },
          { label: "Avg. Rent", value: formatCurrency(avgRent), color: "from-accent-500 to-accent-600" },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeInUp} whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-lg transition-all duration-300"><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
                <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold", stat.color)}>
                  {typeof stat.value === "number" ? stat.value : "₱"}
                </div>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-22rem)] min-h-[400px]">
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input placeholder="Search tenants..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-10">
                <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-text-secondary">Loading...</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-text-secondary">No tenants found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200",
                      selectedTenant?.id === tenant.id
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-surface-secondary border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={tenant.avatarUrl} fallback={tenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tenant.name}</p>
                        <p className="text-xs text-text-secondary truncate">{tenant.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedTenant ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={selectedTenant.avatarUrl} fallback={selectedTenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedTenant.name}</h3>
                    <p className="text-sm text-text-secondary">{selectedTenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTenant.idVerificationStatus && (
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      selectedTenant.idVerificationStatus === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                      selectedTenant.idVerificationStatus === "rejected" ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-yellow-50 text-yellow-600 border-yellow-200"
                    )}>
                      ID: {selectedTenant.idVerificationStatus}
                    </Badge>
                  )}
                  {canVerify && (
                    <div className="relative" ref={dropdownRef}>
                      <Button variant="ghost" size="sm" onClick={() => setOpenDropdownId(openDropdownId === selectedTenant.id ? null : selectedTenant.id)}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <AnimatePresence>
                        {openDropdownId === selectedTenant.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20"
                          >
                            <button
                              onClick={() => {
                                addNotification({
                                  userId: selectedTenant.id,
                                  title: "ID Verification Required",
                                  message: "Please upload a valid ID to verify your identity and enable booking/reservation features.",
                                  type: "id_verification",
                                  read: false,
                                }).then(() => toast.success("ID verification request sent to tenant")).catch(() => toast.error("Failed to send notification"));
                                setOpenDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Shield className="h-4 w-4 text-blue-500" />
                              Request ID
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); setDeleteTarget(selectedTenant); }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                    <p className="text-sm font-medium text-foreground">{selectedTenant.phone || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Address</label>
                    <p className="text-sm font-medium text-foreground">{selectedTenant.address || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Property</label>
                    <p className="text-sm font-medium text-foreground">{selectedTenant.propertyName || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
                    <p className="text-sm font-medium text-foreground">{selectedTenant.unitNumber ? `Unit ${selectedTenant.unitNumber}` : "-"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Rent Amount</label>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedTenant.rentAmount || 0)}/mo</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0 capitalize",
                      selectedTenant.status === "active" ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>{selectedTenant.status}</Badge>
                  </div>
                </div>

                {selectedTenant.idVerificationUrl && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">ID Verification</label>
                    <div
                      onClick={() => setShowIdModal(true)}
                      className="relative rounded-xl border border-border overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={selectedTenant.idVerificationUrl}
                        alt="ID Verification"
                        className="w-full h-auto max-h-[40vh] object-contain bg-gray-50 blur-sm group-hover:blur-none transition-all duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Eye className="h-5 w-5 text-gray-700" />
                        </div>
                      </div>
                    </div>
                    {canVerify && selectedTenant.idVerificationStatus === "pending" && selectedTenant.idVerificationUrl && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleVerify(selectedTenant.id, "approved")} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleVerify(selectedTenant.id, "rejected")} className="text-red-600 hover:text-red-700">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Select a tenant to view details</p>
              </div>
            </div>
          )}
        </Card>

        <AnimatePresence>
          {showIdModal && selectedTenant?.idVerificationUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowIdModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-3xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowIdModal(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <img
                  src={selectedTenant.idVerificationUrl}
                  alt="ID Verification"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Tenant">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
            <Button onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
