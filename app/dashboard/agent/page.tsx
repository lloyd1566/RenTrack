"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Home, UserPlus, ClipboardCheck, Clock,
  CreditCard, FileText, Send, RefreshCw,
  CheckCircle2, MessageSquare, Send as SendIcon, Loader2,
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
  getConversations, sendMessage, notifyAdmins,
  Property, Unit, TenantRecord, Payment, Conversation,
} from "@/lib/data";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";

type Step = "overview" | "properties" | "assign" | "confirmations" | "payments" | "history" | "messages";

const flowSteps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "properties", label: "Properties", icon: Home },
  { key: "assign", label: "Assign Unit", icon: ClipboardCheck },
  { key: "confirmations", label: "Confirmations", icon: Clock },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "history", label: "History", icon: FileText },
  { key: "messages", label: "Messages", icon: Send },
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

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignForm, setAssignForm] = useState({ unitId: "", propertyName: "", unitNumber: "", rentAmount: 0 });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [props, unitsData, tenantsData, paymentsData, convs] = await Promise.all([
        getProperties(user),
        getUnits(user),
        getTenants(user),
        getPayments(user),
        getConversations(),
      ]);
      setProperties(props);
      setUnits(unitsData);
      setTenants(tenantsData);
      setPayments(paymentsData);
      setConversations(convs);
    } catch (err) {
      console.error("Agent dashboard load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    if (!selectedTenant || !assignForm.unitId) {
      toast.error("Please select a unit");
      return;
    }
    setIsSubmitting(true);
    try {
      const unit = units.find((u) => u.id === assignForm.unitId);
      const property = properties.find((p) => p.id === unit?.propertyId);
      const updated = await updateTenantAssignment(selectedTenant.id, {
        unitId: assignForm.unitId,
        propertyName: property?.name || assignForm.propertyName,
        unitNumber: unit?.unitNumber || assignForm.unitNumber,
        rentAmount: unit?.rentAmount || assignForm.rentAmount,
        assignmentStatus: "pending",
      });
      if (updated) {
        setTenants(tenants.map((t) => t.id === selectedTenant.id ? { ...t, ...updated } : t));
        setAssignForm({ unitId: "", propertyName: "", unitNumber: "", rentAmount: 0 });
        toast.success("Assignment submitted for owner confirmation!");
        setActiveTab("confirmations");
        window.location.hash = "confirmations";
      }
    } catch {
      toast.error("Failed to assign tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToOwner = async (payment: Payment) => {
    try {
      await notifyAdmins({
        title: "Payment Receipt Pending Review",
        message: `${payment.tenantName} uploaded a payment receipt of ${formatCurrency(payment.amountPaid)} for property "${payment.propertyName}". Please review and confirm.`,
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

  const currentStepIdx = flowSteps.findIndex((s) => s.key === activeTab);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* Flow Progress */}
            <div className="mb-8">
              <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-3">
                {flowSteps.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-xs", i <= currentStepIdx ? "bg-primary-600 text-white" : "bg-surface-secondary text-text-tertiary border border-border")}>
                      {i <= currentStepIdx ? "✓" : String(i + 1)}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                    {i < flowSteps.length - 1 && <span className="text-text-tertiary mx-1">›</span>}
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-primary-600/20 overflow-hidden">
                <div className="h-full rounded-full bg-primary-600 transition-all duration-500" style={{ width: `${(currentStepIdx / (flowSteps.length - 1)) * 100}%` }} />
              </div>
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-foreground">Agent Dashboard</h1>
                      <p className="text-lg text-text-secondary mt-1">Welcome back, {user?.name?.split(" ")[0] || "Agent"}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={loadData} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: "Properties", value: properties.length, icon: Home, color: "from-primary-500 to-primary-600" },
                    { label: "Active Tenants", value: activeTenants.length, icon: UserPlus, color: "from-secondary-500 to-secondary-600" },
                    { label: "Pending", value: pendingTenants.length, icon: Clock, color: "from-amber-500 to-amber-600" },
                    { label: "Payments Due", value: pendingPayments.length, icon: CreditCard, color: "from-accent-500 to-accent-600" },
                  ].map((stat, i) => (
                    <Card key={i} className="hover:shadow-lg transition-shadow">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Tenant</CardTitle>
                      <CardDescription>Choose from registered tenants without a unit</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tenants.filter((t) => !t.unitId).length === 0 ? (
                          <p className="text-center py-8 text-text-secondary">No unassigned tenants</p>
                        ) : (
                          tenants.filter((t) => !t.unitId).map((tenant) => (
                            <div key={tenant.id} onClick={() => setSelectedTenant(tenant)} className={cn("flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", selectedTenant?.id === tenant.id ? "border-primary-500 bg-primary-50" : "border-border hover:bg-surface-secondary")}>
                              <div className="flex items-center gap-3">
                                 <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} size="sm" />
                                <div>
                                  <p className="text-base font-medium text-foreground">{tenant.name}</p>
                                  <p className="text-sm text-text-secondary">{tenant.email}</p>
                                </div>
                              </div>
                              {selectedTenant?.id === tenant.id && <CheckCircle2 className="h-5 w-5 text-primary-600" />}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Vacant Unit</CardTitle>
                      <CardDescription>Available units for assignment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {vacantUnits.length === 0 ? (
                          <p className="text-center py-8 text-text-secondary">No vacant units available</p>
                        ) : (
                          vacantUnits.map((unit) => {
                            const property = properties.find((p) => p.id === unit.propertyId);
                            return (
                              <div key={unit.id} onClick={() => setSelectedUnit(unit)} className={cn("flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", selectedUnit?.id === unit.id ? "border-primary-500 bg-primary-50" : "border-border hover:bg-surface-secondary")}>
                                <div>
                                  <p className="text-base font-medium text-foreground">Unit {unit.unitNumber}</p>
                                  <p className="text-sm text-text-secondary">{property?.name || "Unknown Property"}</p>
                                  <p className="text-sm text-text-tertiary">{formatCurrency(unit.rentAmount)}/mo</p>
                                </div>
                                {selectedUnit?.id === unit.id && <CheckCircle2 className="h-5 w-5 text-primary-600" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {selectedTenant && selectedUnit && (
                  <Card className="max-w-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-primary-50 border border-primary-200">
                         <Avatar src={selectedTenant.avatarUrl} fallback={getInitials(selectedTenant.name)} size="sm" />
                        <div>
                          <p className="text-base font-medium text-foreground">{selectedTenant.name}</p>
                          <p className="text-sm text-text-secondary">{selectedTenant.email}</p>
                        </div>
                      </div>
                      <form onSubmit={handleAssignTenant} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-base font-medium mb-1.5">Property</label>
                            <Input value={properties.find((p) => p.id === selectedUnit.propertyId)?.name || ""} readOnly />
                          </div>
                          <div>
                            <label className="block text-base font-medium mb-1.5">Unit</label>
                            <Input value={selectedUnit.unitNumber} readOnly />
                          </div>
                        </div>
                        <div>
                          <label className="block text-base font-medium mb-1.5">Monthly Rent (₱)</label>
                          <Input type="number" value={selectedUnit.rentAmount} readOnly />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? "Assigning..." : "Assign Tenant & Submit for Confirmation"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* PENDING CONFIRMATIONS */}
            {activeTab === "confirmations" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Pending Owner Confirmations</h1>
                  <p className="text-base text-text-secondary mt-1">Track tenant assignments awaiting owner approval</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {pendingTenants.length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">All caught up!</p>
                          <p className="text-xs text-text-tertiary mt-1">No pending assignments</p>
                        </div>
                      ) : (
                        pendingTenants.map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-3">
                              <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} />
                              <div>
                                <p className="font-medium text-foreground">{tenant.name}</p>
                                <p className="text-xs text-text-secondary">{tenant.propertyName} • {tenant.unitNumber}</p>
                                <p className="text-xs text-text-tertiary">{formatCurrency(tenant.rentAmount || 0)}/mo</p>
                              </div>
                            </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(tenant.assignmentStatus || "pending")}
                                <Button size="sm" onClick={() => handleResubmitAssignment(tenant.id)} disabled={resubmittingId === tenant.id} className="bg-amber-500 hover:bg-amber-600">
                                  {resubmittingId === tenant.id ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Resubmitting...</>
                                  ) : (
                                    <><SendIcon className="h-3.5 w-3.5 mr-1" />Resubmit</>
                                  )}
                                </Button>
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
                  <p className="text-base text-text-secondary mt-1">Communicate with owners and tenants</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {conversations.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">No messages yet</p>
                          <p className="text-xs text-text-tertiary mt-1">Start a conversation with an owner or tenant</p>
                        </div>
                      ) : (
                        conversations.map((conv) => (
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
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
  
        {/* Messaging Modal */}
        {selectedConversation && (
          <MessagingModal
            isOpen={isMessagingOpen}
            onClose={() => { setIsMessagingOpen(false); setSelectedConversation(null); }}
            otherUser={{
              id: selectedConversation.userId,
              name: selectedConversation.otherUser?.name || "Unknown",
              email: selectedConversation.otherUser?.email || "",
              role: selectedConversation.otherUser?.role || "tenant",
              avatarUrl: selectedConversation.otherUser?.avatarUrl,
              allowMessages: true,
            }}
          />
        )}
      </div>
  );
}
