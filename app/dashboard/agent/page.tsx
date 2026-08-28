"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Home, UserPlus, ClipboardCheck, Clock,
  CreditCard, FileText, Send,
  CheckCircle2, MessageSquare, Send as SendIcon, Loader2, Mail, User,
  Search, Plus, X, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  getProperties, getUnits, getTenants, getPayments,
  addTenant, updateTenantAssignment, verifyPayment,
  getConversations, sendMessage, notifyAdmins, updateTenantVerification,
  getInquiries, updateInquiryStatus,
  Property, Unit, TenantRecord, Payment, Conversation, ChatInquiry,
} from "@/lib/data";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";
import ProfilePanel from "@/components/profile-panel";

type Step = "overview" | "properties" | "assign" | "payments" | "history" | "messages" | "verifications" | "inquiries" | "profile";

const flowSteps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "properties", label: "Properties", icon: Home },
  { key: "assign", label: "Assign Unit", icon: ClipboardCheck },
  { key: "verifications", label: "Verifications", icon: CheckCircle2 },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "history", label: "History", icon: FileText },
  { key: "messages", label: "Messages", icon: Send },
  { key: "inquiries", label: "Inquiries", icon: Mail },
  { key: "profile", label: "Profile", icon: User },
];

export default function AgentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Step>("overview");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [inquiries, setInquiries] = useState<ChatInquiry[]>([]);
  const [replyingInquiry, setReplyingInquiry] = useState<string | null>(null);
  const [inquiryReply, setInquiryReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [viewingThread, setViewingThread] = useState<ChatInquiry | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatInquiry[]>([]);
  const [threadReply, setThreadReply] = useState("");
  const [threadSending, setThreadSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterTenant, setShowRegisterTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", email: "", phone: "" });

  const [assignForm, setAssignForm] = useState({ unitId: "", propertyName: "", unitNumber: "", rentAmount: 0, contractStart: "" });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return [];
    setIsRefreshing(true);
    try {
      const [props, unitsData, tenantsData, paymentsData, convs, inquiriesData] = await Promise.all([
        getProperties(user),
        getUnits(user),
        getTenants(user),
        getPayments(user),
        getConversations(),
        getInquiries(),
      ]);
      setProperties(props);
      setUnits(unitsData);
      setTenants(tenantsData);
      setPayments(paymentsData);
      setConversations(convs);
      setInquiries(inquiriesData);
      return inquiriesData;
    } catch (err) {
      console.error("Agent dashboard load error:", err);
      return [];
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const openThread = async (inquiry: ChatInquiry) => {
    const inquiriesData = await loadData();
    const thread = (inquiriesData || [])
      .filter((item) => item.senderEmail && inquiry.senderEmail && item.senderEmail.toLowerCase().trim() === inquiry.senderEmail.toLowerCase().trim())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setThreadMessages(thread);
    setViewingThread(inquiry);
    setThreadReply("");
  };

  const closeThread = () => {
    setViewingThread(null);
    setThreadMessages([]);
    setThreadReply("");
  };

  const sendThreadReply = async () => {
    if (!viewingThread || !threadReply.trim()) return;
    setThreadSending(true);
    try {
      await updateInquiryStatus(viewingThread.id, "replied", threadReply.trim());
      const reply = threadReply.trim();
      setThreadMessages((prev) => {
        const targetEmail = viewingThread.senderEmail;
        const refreshed = prev.filter((item) => item.senderEmail && targetEmail && item.senderEmail.toLowerCase().trim() === targetEmail.toLowerCase().trim());
        return refreshed.map((item) => item.id === viewingThread.id ? { ...item, status: "replied", replyText: reply, repliedAt: new Date().toISOString(), agentName: user?.name } : item);
      });
      setInquiries((prev) => prev.map((item) => item.id === viewingThread.id ? { ...item, status: "replied", replyText: reply, repliedAt: new Date().toISOString(), agentName: user?.name } : item));
      setThreadReply("");
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setThreadSending(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!viewingThread) return;
    let cancelled = false;
    const refreshThread = async () => {
      try {
        const result = await getInquiries();
        if (cancelled) return;
        const thread = result.filter((item) => item.senderEmail && viewingThread.senderEmail && item.senderEmail.toLowerCase().trim() === viewingThread.senderEmail.toLowerCase().trim()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setThreadMessages(thread);
        setInquiries(result);
      } catch {
        // ignore background poll errors
      }
    };
    refreshThread();
    const interval = window.setInterval(refreshThread, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [viewingThread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && flowSteps.some((s) => s.key === hash)) {
        setActiveTab(hash as Step);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isLoading, isAuthenticated]);

  const vacantUnits = units.filter((u) => u.status === "vacant");
  const pendingTenants = tenants.filter((t) => t.assignmentStatus === "pending");
  const activeTenants = tenants.filter((t) => t.status === "active");
  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "partial");
  const overduePayments = payments.filter((p) => p.status === "overdue");
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === "all") return true;
    return p.status === paymentFilter;
  });

  const handleAssignTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !selectedUnit) {
      toast.error("Please select a unit");
      return;
    }
    setIsSubmitting(true);
    try {
      const property = properties.find((p) => p.id === selectedUnit.propertyId);
      const updated = await updateTenantAssignment(selectedTenant.id, {
        unitId: selectedUnit.id,
        propertyName: assignForm.propertyName || property?.name || "",
        unitNumber: assignForm.unitNumber || selectedUnit.unitNumber,
        rentAmount: assignForm.rentAmount || selectedUnit.rentAmount,
        contractStart: assignForm.contractStart || undefined,
        assignmentStatus: "pending",
      });
      if (updated) {
        await loadData();
        setSelectedTenant(null);
        setSelectedUnit(null);
        setAssignForm({ unitId: "", propertyName: "", unitNumber: "", rentAmount: 0, contractStart: "" });
        toast.success("Assignment submitted for owner confirmation!");
        setActiveTab("assign");
        window.location.hash = "assign";
        notifyAdmins({
          title: "New Assignment Pending",
          message: `${selectedTenant.name} has been assigned to ${assignForm.propertyName || property?.name || "a unit"}. Please review and confirm.`,
          type: "tenant",
          read: false,
        }).catch(() => {});
      }
    } catch {
      toast.error("Failed to assign tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.email) {
      toast.error("Name and email are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/data/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tenant registered successfully!");
        setNewTenant({ name: "", email: "", phone: "" });
        setShowRegisterTenant(false);
        loadData();
      } else {
        toast.error(data.error || "Failed to register tenant");
      }
    } catch {
      toast.error("Failed to register tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToOwner = async (payment: Payment) => {
    try {
      await notifyAdmins({
        title: "Payment Pending Owner Review",
        message: `${payment.tenantName} submitted a payment of ${formatCurrency(payment.amountPaid)} for property "${payment.propertyName}". Please review the automatic receipt and confirm.`,
        type: "payment",
        read: false,
      });
      toast.success("Payment forwarded to owner for confirmation!");
    } catch {
      toast.error("Failed to forward payment");
    }
  };

  const handleResubmitAssignment = async (tenantId: string) => {
    setResubmittingId(tenantId);
    try {
      await notifyAdmins({
        title: "Assignment Resubmitted",
        message: `An assignment for a tenant has been resubmitted for owner confirmation. Please review.`,
        type: "tenant",
        read: false,
      });
      toast.success("Assignment resubmitted to owner successfully!");
    } catch {
      toast.error("Failed to resubmit assignment");
    } finally {
      setResubmittingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
      paid: "success", pending: "warning", overdue: "destructive", partial: "outline",
      confirmed: "success", rejected: "destructive", active: "success", inactive: "outline",
    };
    return <Badge variant={variants[status] || "outline"} className="text-sm font-semibold capitalize">{status}</Badge>;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-foreground">Agent Dashboard</h1>
                      <p className="text-lg text-text-secondary mt-1">Welcome back, {user?.name?.split(" ")[0] || "Agent"}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: "Properties", value: properties.length, icon: Home, color: "from-primary-500 to-primary-600", tab: "properties" as const },
                    { label: "Active Tenants", value: activeTenants.length, icon: UserPlus, color: "from-secondary-500 to-secondary-600", tab: "assign" as const },
                    { label: "Pending", value: pendingTenants.length, icon: Clock, color: "from-amber-500 to-amber-600", tab: "assign" as const },
                    { label: "Payments Due", value: pendingPayments.length, icon: CreditCard, color: "from-accent-500 to-accent-600", tab: "payments" as const },
                  ].map((stat, i) => (
                    <Card key={i} onClick={() => { setActiveTab(stat.tab); window.location.hash = stat.tab; }} className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95">
                      <CardContent className="min-h-[180px] p-8">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-medium text-text-secondary">{stat.label}</span>
                          <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br text-white flex items-center justify-center", stat.color)}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="text-5xl font-bold text-foreground">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="min-h-[340px]">
                    <CardHeader>
                      <CardTitle className="text-3xl font-bold">Recent Properties</CardTitle>
                      <CardDescription>Latest registered properties</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-3">
                        {properties.slice(0, 5).map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-6 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div>
                              <p className="text-xl font-semibold text-foreground">{property.name}</p>
                              <p className="text-base text-text-secondary">{property.location}</p>
                            </div>
                            <Badge variant={property.status === "active" ? "success" : "outline"} className="text-sm font-semibold capitalize">{property.status}</Badge>
                          </div>
                        ))}
                        {properties.length === 0 && <p className="text-center py-8 text-text-secondary">No properties yet</p>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="min-h-[340px]">
                    <CardHeader>
                      <CardTitle className="text-3xl font-bold">Recent Payments</CardTitle>
                      <CardDescription>Latest payment transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-3">
                        {payments.slice(0, 5).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-6 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div>
                              <p className="text-xl font-semibold text-foreground">{payment.tenantName}</p>
                              <p className="text-base text-text-secondary">{formatDate(payment.paymentDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</p>
                              {getStatusBadge(payment.status)}
                              {payment.receiptUrl && (
                                <a href={payment.receiptUrl} download={`renttrack-receipt-${payment.id}.svg`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs text-text-secondary hover:bg-surface-secondary hover:text-primary-600" onClick={(event) => event.stopPropagation()}>
                                  <Download className="h-3.5 w-3.5" />Receipt
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {payments.length === 0 && <p className="text-center py-8 text-text-secondary">No payments yet</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* PROPERTIES & UNITS */}
            {activeTab === "properties" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Available Properties & Units</h1>
                  <p className="text-base text-text-secondary mt-1">Browse properties and their units</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {properties.map((property) => {
                    const propertyUnits = units.filter((u) => u.propertyId === property.id);
                    const vacant = propertyUnits.filter((u) => u.status === "vacant");
                    return (
                      <Card key={property.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{property.name}</h3>
                              <p className="text-sm text-text-secondary mt-1">{property.location}</p>
                            </div>
                            <Badge variant={property.status === "active" ? "success" : "outline"} className="capitalize">{property.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                            <span className="flex items-center gap-1.5"><Home className="h-4 w-4" />{property.units} units</span>
                            <span className="flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4" />{vacant.length} vacant</span>
                          </div>
                          <div className="space-y-2.5">
                            <p className="text-sm font-medium text-text-secondary">Units:</p>
                            {propertyUnits.length === 0 ? (
                              <p className="text-sm text-text-tertiary">No units registered</p>
                            ) : (
                              propertyUnits.map((unit) => (
                                <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                                  <span className="text-sm font-medium">Unit {unit.unitNumber}</span>
                                  <Badge variant={unit.status === "vacant" ? "success" : unit.status === "occupied" ? "outline" : "warning"} className="text-xs capitalize">{unit.status}</Badge>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {properties.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Home className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">No properties yet</p>
                        <p className="text-xs text-text-tertiary mt-1">Properties will appear here once registered by the owner</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* ASSIGN UNIT */}
            {activeTab === "assign" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Assign Tenant to Unit</h1>
                  <p className="text-base text-text-secondary mt-1">Select a tenant and assign them to an available unit</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* SELECT TENANT */}
                   <Card className="flex flex-col">
                     <CardHeader>
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                             <UserPlus className="h-5 w-5 text-blue-600" />
                           </div>
                           <div>
                             <CardTitle className="text-lg">Step 1: Select Tenant</CardTitle>
                             <CardDescription>Choose a tenant without a unit assignment</CardDescription>
                           </div>
                         </div>
                         <Button size="sm" onClick={() => setShowRegisterTenant(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                           <Plus className="h-4 w-4 mr-1" /> Register
                         </Button>
                       </div>
                     </CardHeader>
                     <CardContent className="flex-1 flex flex-col">
                       <div className="relative mb-4">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                         <Input
                           placeholder="Search tenants..."
                           value={tenantSearch}
                           onChange={(e) => setTenantSearch(e.target.value)}
                           className="pl-9"
                         />
                       </div>
                       <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
                         {(() => {
                           const unassigned = tenants.filter((t) => !t.unitId);
                           const filtered = unassigned.filter((t) => t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || t.email.toLowerCase().includes(tenantSearch.toLowerCase()));
                           if (unassigned.length === 0) {
                             return (
                               <div className="text-center py-12">
                                 <UserPlus className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                                 <p className="text-text-secondary font-medium">No unassigned tenants</p>
                                 <p className="text-xs text-text-tertiary mt-1">All tenants have been assigned to units</p>
                               </div>
                             );
                           }
                           if (filtered.length === 0 && tenantSearch) {
                             return (
                               <div className="text-center py-8">
                                 <p className="text-text-secondary font-medium">No matching tenants</p>
                                 <p className="text-xs text-text-tertiary mt-1">Try a different search term</p>
                               </div>
                             );
                           }
                           return filtered.map((tenant) => (
                             <motion.div
                               key={tenant.id}
                               whileHover={{ scale: 1.01 }}
                               whileTap={{ scale: 0.99 }}
                               onClick={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
                               className={cn("flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all", selectedTenant?.id === tenant.id ? "border-primary-500 bg-primary-50 shadow-sm" : "border-border hover:bg-surface-secondary hover:shadow-sm")}
                             >
                               <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} size="sm" className={selectedTenant?.id === tenant.id ? "ring-2 ring-primary-200" : ""} />
                               <div className="flex-1 min-w-0">
                                 <p className="text-base font-medium text-foreground truncate">{tenant.name}</p>
                                 <p className="text-sm text-text-secondary truncate">{tenant.email}</p>
                               </div>
                               {selectedTenant?.id === tenant.id && (
                                 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                                   <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                 </motion.div>
                               )}
                             </motion.div>
                           ));
                        })()}
                      </div>
                      {selectedTenant && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTenant(null)} className="w-full">
                            <X className="h-4 w-4 mr-1.5" /> Clear Selection
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                   {/* SELECT UNIT */}
                   <Card className="flex flex-col">
                     <CardHeader>
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                             <Home className="h-5 w-5 text-emerald-600" />
                           </div>
                           <div>
                             <CardTitle className="text-lg">Step 2: Select Vacant Unit</CardTitle>
                             <CardDescription>Available units for assignment</CardDescription>
                           </div>
                         </div>
                         {selectedUnit && (
                           <Button size="sm" variant="outline" onClick={() => setSelectedUnit(null)} className="text-red-600 hover:text-red-700">
                             <X className="h-4 w-4 mr-1" /> Cancel
                           </Button>
                         )}
                       </div>
                     </CardHeader>
                     <CardContent className="flex-1 flex flex-col">
                       <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-1">
                         {vacantUnits.length === 0 ? (
                           <div className="text-center py-12">
                             <Home className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                             <p className="text-text-secondary font-medium">No vacant units available</p>
                             <p className="text-xs text-text-tertiary mt-1">All units are currently occupied</p>
                           </div>
                         ) : (
                           vacantUnits.map((unit) => {
                             const property = properties.find((p) => p.id === unit.propertyId);
                             const isSelected = selectedUnit?.id === unit.id;
                             return (
                               <motion.div
                                 key={unit.id}
                                 whileHover={{ scale: 1.01 }}
                                 whileTap={{ scale: 0.99 }}
                                 onClick={() => setSelectedUnit(isSelected ? null : unit)}
                                 className={cn("p-4 rounded-xl border cursor-pointer transition-all", isSelected ? "border-primary-500 bg-primary-50 shadow-sm" : "border-border hover:bg-surface-secondary hover:shadow-sm")}
                               >
                                 <div className="flex items-start justify-between">
                                   <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
                                       {unit.unitNumber}
                                     </div>
                                     <div>
                                       <p className="text-base font-medium text-foreground">{property?.name || "Unknown Property"}</p>
                                       <p className="text-sm text-text-secondary">Unit {unit.unitNumber}</p>
                                     </div>
                                   </div>
                                   {isSelected && (
                                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                                       <CheckCircle2 className="h-5 w-5 text-primary-600" />
                                     </motion.div>
                                   )}
                                 </div>
                                 <div className="mt-3 flex items-center gap-4 text-sm">
                                   <span className="text-text-secondary">Floor {unit.floor || "N/A"}</span>
                                   <span className="text-text-tertiary">|</span>
                                   <span className="font-semibold text-foreground">{formatCurrency(unit.rentAmount)}/mo</span>
                                 </div>
                               </motion.div>
                             );
                           })
                         )}
                       </div>
                     </CardContent>
                   </Card>
                </div>

                {/* REVIEW & CONFIRM */}
                {selectedTenant && selectedUnit && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card className="border-primary-200 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <ClipboardCheck className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Step 3: Review & Confirm</CardTitle>
                            <CardDescription>Verify the assignment details before submitting</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Tenant Information</h4>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary">
                              <Avatar src={selectedTenant.avatarUrl} fallback={getInitials(selectedTenant.name)} size="md" />
                              <div>
                                <p className="font-medium text-foreground">{selectedTenant.name}</p>
                                <p className="text-sm text-text-secondary">{selectedTenant.email}</p>
                                {selectedTenant.phone && <p className="text-sm text-text-tertiary">{selectedTenant.phone}</p>}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Unit Information</h4>
                            <div className="p-4 rounded-xl bg-surface-secondary space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Property</span>
                                <span className="text-sm font-medium text-foreground">{properties.find((p) => p.id === selectedUnit.propertyId)?.name || "N/A"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Unit</span>
                                <span className="text-sm font-medium text-foreground">{selectedUnit.unitNumber}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Floor</span>
                                <span className="text-sm font-medium text-foreground">{selectedUnit.floor || "N/A"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Monthly Rent</span>
                                <span className="text-sm font-bold text-foreground">{formatCurrency(selectedUnit.rentAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-border">
                          <form onSubmit={handleAssignTenant} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Property Name</label>
                                <Input value={assignForm.propertyName || properties.find((p) => p.id === selectedUnit.propertyId)?.name || ""} onChange={(e) => setAssignForm({ ...assignForm, propertyName: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Unit Number</label>
                                <Input value={assignForm.unitNumber || selectedUnit.unitNumber} onChange={(e) => setAssignForm({ ...assignForm, unitNumber: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Monthly Rent (₱)</label>
                                <Input type="number" value={assignForm.rentAmount || selectedUnit.rentAmount} onChange={(e) => setAssignForm({ ...assignForm, rentAmount: parseFloat(e.target.value) || 0 })} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Contract Start</label>
                                <Input type="date" value={assignForm.contractStart || ""} onChange={(e) => setAssignForm({ ...assignForm, contractStart: e.target.value })} />
                              </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                               {isSubmitting ? (
                                 <span className="flex items-center gap-2">
                                   <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                   Assigning...
                                 </span>
                               ) : (
                                 <span className="flex items-center gap-2">
                                   <CheckCircle2 className="h-4 w-4" />
                                   Assign Tenant & Submit for Confirmation
                                 </span>
                               )}
                             </Button>
                           </form>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>
                 )}
               </motion.div>
             )}

             {/* Register Tenant Modal */}
             {showRegisterTenant && (
               <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-black/50" onClick={() => setShowRegisterTenant(false)} />
                 <div className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl">
                   <div className="p-6 border-b border-border flex items-center justify-between">
                     <div>
                       <h3 className="text-lg font-semibold text-foreground">Register New Tenant</h3>
                       <p className="text-sm text-text-secondary">Add a tenant to the system</p>
                     </div>
                     <button onClick={() => setShowRegisterTenant(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                   <form onSubmit={handleRegisterTenant} className="p-6 space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                       <Input value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="Juan Dela Cruz" required />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                       <Input type="email" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} placeholder="juan@example.com" required />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                       <Input value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} placeholder="+63 XXX XXX XXXX" />
                     </div>
                     <Button type="submit" disabled={isSubmitting} className="w-full">
                       {isSubmitting ? (
                         <span className="flex items-center gap-2">
                           <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Registering...
                         </span>
                       ) : (
                         <span className="flex items-center gap-2">
                           <UserPlus className="h-4 w-4" />
                           Register Tenant
                         </span>
                       )}
                     </Button>
                   </form>
                 </div>
               </div>
              )}

             {/* VERIFICATIONS */}
            {activeTab === "verifications" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Tenant Verifications</h1>
                  <p className="text-base text-text-secondary mt-1">Review and verify tenant ID documents</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {tenants.filter(t => t.idVerificationStatus === "pending").length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">All caught up!</p>
                          <p className="text-xs text-text-tertiary mt-1">No pending verifications</p>
                        </div>
                      ) : (
                        tenants.filter(t => t.idVerificationStatus === "pending").map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} />
                              <div>
                                <p className="font-medium text-foreground">{tenant.name}</p>
                                <p className="text-xs text-text-secondary">{tenant.email}</p>
                                {tenant.phone && <p className="text-xs text-text-tertiary">{tenant.phone}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {tenant.idVerificationUrl && (
                                <a href={tenant.idVerificationUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline">View ID</Button>
                                </a>
                              )}
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => { await updateTenantVerification(tenant.id, "approved"); toast.success("Tenant verified"); loadData(); }}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={async () => { await updateTenantVerification(tenant.id, "rejected"); toast.success("Verification rejected"); loadData(); }}>Reject</Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Payment Monitoring</h1>
                  <p className="text-base text-text-secondary mt-1">Track payment status across all tenants</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Total Collected</p>
                       <p className="text-3xl font-bold text-green-600">{formatCurrency(payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Pending</p>
                      <p className="text-3xl font-bold text-amber-600">{pendingPayments.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Overdue</p>
                      <p className="text-3xl font-bold text-red-600">{overduePayments.length}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Payment Records</CardTitle>
                        <CardDescription>All payment transactions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payments.length === 0 ? (
                        <p className="text-center py-8 text-text-secondary">No payment records yet</p>
                      ) : (
                        payments.slice().reverse().map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div className="flex items-center gap-3">
                               <Avatar src={payment.tenantName ? (tenants.find(t => t.name === payment.tenantName)?.avatarUrl || "") : ""} fallback={getInitials(payment.tenantName)} size="sm" />
                              <div>
                                <p className="text-base font-medium text-foreground">{payment.tenantName}</p>
                                <p className="text-sm text-text-secondary">{payment.propertyName} • {formatDate(payment.paymentDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-base font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</p>
                                <p className="text-sm text-text-secondary">of {formatCurrency(payment.amountDue)}</p>
                              </div>
                              {getStatusBadge(payment.status)}
                              {payment.receiptUrl && (
                                <a href={payment.receiptUrl} download={`renttrack-receipt-${payment.id}.svg`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs text-text-secondary hover:bg-surface-secondary hover:text-primary-600">
                                  <Download className="h-3.5 w-3.5" />Receipt
                                </a>
                              )}
                            </div>
                            {payment.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleForwardToOwner(payment)}>
                                <Send className="h-3.5 w-3.5 mr-1" />Forward to Owner
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PAYMENT HISTORY */}
            {activeTab === "history" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
                  <p className="text-base text-text-secondary mt-1">Complete transaction history across all properties</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="h-10 px-4 rounded-xl border border-border bg-surface-secondary text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="partial">Partial</option>
                      </select>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Tenant</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Property</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.slice().reverse().map((payment) => (
                            <tr key={payment.id} className="border-b border-border/50 hover:bg-surface-secondary transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Avatar src={payment.tenantName ? (tenants.find(t => t.name === payment.tenantName)?.avatarUrl || "") : ""} fallback={getInitials(payment.tenantName)} size="sm" />
                                  <span className="font-medium text-foreground">{payment.tenantName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-text-secondary">{payment.propertyName}</td>
                              <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(payment.amountPaid)}</td>
                              <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                              <td className="py-3 px-4 text-text-secondary">{formatDate(payment.paymentDate)}</td>
                            </tr>
                          ))}
                          {filteredPayments.length === 0 && (
                            <tr><td colSpan={5} className="py-8 text-center text-text-secondary">No payments found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* MESSAGES */}
            {activeTab === "messages" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                  <p className="text-base text-text-secondary mt-1">Communicate with owners, tenants, and landing-page visitors</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {conversations.length === 0 && inquiries.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-text-secondary font-medium">No messages yet</p>
                          <p className="text-xs text-text-tertiary mt-1">Start a conversation with an owner or tenant</p>
                        </div>
                      ) : (
                        <>
                          {conversations.map((conv) => (
                            <div key={conv.userId} onClick={() => { setSelectedConversation(conv); setIsMessagingOpen(true); }} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                 <Avatar src={conv.otherUser?.avatarUrl} fallback={conv.otherUser?.name ? getInitials(conv.otherUser.name) : "?"} />
                                <div>
                                  <p className="font-medium text-foreground">{conv.otherUser?.name || "Unknown"}</p>
                                  <p className="text-xs text-text-secondary truncate max-w-[200px]">{conv.lastMessage.subject && `${conv.lastMessage.subject} - `}{conv.lastMessage.body}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-tertiary">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</span>
                                {conv.unreadCount > 0 && <Badge variant="default" className="bg-blue-600 text-white text-[10px]">{conv.unreadCount}</Badge>}
                              </div>
                            </div>
                          ))}
                          {inquiries.map((inq) => (
                            <div key={`inquiry-${inq.id}`} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    <p className="font-medium text-foreground">{inq.senderName}</p>
                                    <Badge variant="outline" className="text-[10px]">Landing inquiry</Badge>
                                  </div>
                                  <p className="text-xs text-text-secondary">{inq.senderEmail}</p>
                                  <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{inq.text}</p>
                                  {inq.replyText ? (
                                    <div className="mt-3 rounded-lg bg-white border border-blue-100 p-3">
                                      <p className="text-xs font-semibold text-blue-700">Your reply{inq.agentName ? ` • ${inq.agentName}` : ""}</p>
                                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{inq.replyText}</p>
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-text-tertiary">Awaiting reply</p>
                                  )}
                                </div>
                                <Button size="sm" variant="outline" onClick={() => { setReplyingInquiry(inq.id); setInquiryReply(inq.replyText || ""); }}>Reply</Button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* INQUIRIES */}
            {activeTab === "inquiries" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Landing Inquiries</h1>
                  <p className="text-base text-text-secondary mt-1">Messages from visitors through the landing page</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {inquiries.length === 0 ? (
                        <div className="text-center py-12">
                          <Mail className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">No inquiries yet</p>
                          <p className="text-xs text-text-tertiary mt-1">When visitors contact you from the landing page, they will appear here.</p>
                        </div>
                      ) : (
                        inquiries.map((inq) => (
                          <div key={inq.id} className="p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-foreground">{inq.senderName}</p>
                                  <Badge variant={inq.status === "new" ? "default" : "outline"} className="text-[10px]">{inq.status}</Badge>
                                </div>
                                <p className="text-xs text-text-secondary mb-1">{inq.senderEmail}{inq.senderPhone ? ` • ${inq.senderPhone}` : ""}</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{inq.text}</p>
                                {inq.replyText && <div className="mt-3 rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-700">Your reply{inq.agentName ? ` • ${inq.agentName}` : ""}</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{inq.replyText}</p></div>}
                                <p className="text-[10px] text-text-tertiary mt-2">{new Date(inq.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setReplyingInquiry(inq.id); setInquiryReply(""); }}>Reply</Button>
                                <Button size="sm" variant="ghost" onClick={() => openThread(inq)}>View Conversation</Button>
                                {inq.status === "new" && (
                                  <Button size="sm" onClick={async () => { try { await updateInquiryStatus(inq.id, "read"); setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: "read" } : i)); } catch (e) { toast.error("Failed to mark as read"); } }}>Mark Read</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={async () => { try { await updateInquiryStatus(inq.id, "replied"); setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: "replied" } : i)); } catch (e) { toast.error("Failed to mark as replied"); } }}>Mark Replied</Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

        {/* Landing inquiry reply modal */}
        {replyingInquiry && (() => {
          const inquiry = inquiries.find((item) => item.id === replyingInquiry);
          if (!inquiry) return null;
          return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="inquiry-reply-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !replying) setReplyingInquiry(null); }}>
              <div className="w-full max-w-lg rounded-2xl bg-surface shadow-2xl border border-border" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 id="inquiry-reply-title" className="text-lg font-semibold text-foreground">Reply to {inquiry.senderName}</h2>
                    <p className="text-xs text-text-secondary mt-1">{inquiry.senderEmail}</p>
                  </div>
                  <button type="button" aria-label="Close reply dialog" onClick={() => { if (!replying) setReplyingInquiry(null); }} className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-lg bg-surface-secondary p-3">
                    <p className="text-xs font-medium text-text-secondary mb-1">Visitor message</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{inquiry.text}</p>
                  </div>
                  <form onSubmit={async (event) => {
                    event.preventDefault();
                    const reply = inquiryReply.trim();
                    if (!reply) return;
                    setReplying(true);
                    try {
                      await updateInquiryStatus(inquiry.id, "replied", reply);
                      setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status: "replied", replyText: reply, repliedAt: new Date().toISOString(), agentName: user?.name } : item));
                      setReplyingInquiry(null);
                      setInquiryReply("");
                      toast.success("Reply sent");
                    } catch {
                      toast.error("Failed to send reply");
                    } finally {
                      setReplying(false);
                    }
                  }}>
                    <textarea autoFocus value={inquiryReply} onChange={(event) => setInquiryReply(event.target.value)} placeholder="Write your reply..." rows={5} className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <div className="mt-4 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setReplyingInquiry(null)} disabled={replying}>Cancel</Button>
                      <Button type="submit" disabled={replying || !inquiryReply.trim()}>{replying ? "Sending..." : "Send Reply"}</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          );
        })()}

        {viewingThread && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) closeThread(); }}>
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-surface shadow-2xl border border-border" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Conversation with {viewingThread.senderName}</h2>
                  <p className="text-xs text-text-secondary mt-1">{viewingThread.senderEmail}{viewingThread.senderPhone ? ` • ${viewingThread.senderPhone}` : ""}</p>
                </div>
                <button type="button" onClick={closeThread} className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {threadMessages.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-8">No messages in this conversation.</p>
                ) : (
                  threadMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.replyText ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.replyText ? "bg-blue-600 text-white" : "bg-surface-secondary text-foreground"}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.replyText || msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.replyText ? "text-blue-100" : "text-text-tertiary"}`}>{new Date(msg.repliedAt || msg.createdAt).toLocaleString()}</p>
                        {msg.replyText && <p className="text-[10px] text-blue-100 mt-0.5">You • {msg.agentName || user?.name}</p>}
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>
              <div className="border-t border-border p-4">
                <form onSubmit={async (event) => {
                  event.preventDefault();
                  await sendThreadReply();
                }}>
                  <div className="flex gap-2">
                    <textarea
                      value={threadReply}
                      onChange={(event) => setThreadReply(event.target.value)}
                      placeholder="Write your reply..."
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-border bg-surface p-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <Button type="submit" disabled={threadSending || !threadReply.trim()}>{threadSending ? "Sending..." : "Send"}</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Messaging Modal */}
        {selectedConversation && (
          <MessagingModal
            isOpen={isMessagingOpen}
            onClose={() => { setIsMessagingOpen(false); setSelectedConversation(null); }}
            otherUser={{
              id: selectedConversation.otherUser?.id || "",
              name: selectedConversation.otherUser?.name || "Unknown",
              email: selectedConversation.otherUser?.email || "",
              role: selectedConversation.otherUser?.role || "tenant",
              avatarUrl: selectedConversation.otherUser?.avatarUrl,
              allowMessages: true,
            }}
            properties={properties.map(p => ({ id: p.id, name: p.name, location: p.location, type: p.type, units: p.units, rentAmount: p.monthlyRevenue }))}
          />
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <ProfilePanel />
        )}
      </div>
  );
}
