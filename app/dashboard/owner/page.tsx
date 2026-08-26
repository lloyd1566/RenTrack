"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Home, ClipboardCheck, Clock,
  CreditCard, FileText, BarChart3, FileSpreadsheet, RefreshCw,
  CheckCircle2, Send as SendIcon, UserPlus, User,
  Eye, Download, Printer, ChevronRight, X, Loader2, Plus, Camera, Users, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  getProperties, getUnits, getTenants, getPayments,
  addTenant, updateTenantAssignment, verifyPayment, addProperty, addUnit,
  deleteProperty, deleteUnit, updateProperty, updateUnit,
  getConversations, sendMessage, notifyAdmins,
  Property, Unit, TenantRecord, Payment, Conversation,
} from "@/lib/data";
import OwnerAgentsPage from "./agents/agents-client";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";
import ProfilePanel from "@/components/profile-panel";

type Step = "overview" | "properties" | "units" | "assignments" | "agents" | "contracts" | "occupancy" | "payments" | "receivables" | "reports" | "profile";

const flowSteps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "properties", label: "Properties", icon: Home },
  { key: "units", label: "Rental Units", icon: ClipboardCheck },
  { key: "assignments", label: "Pending Approvals", icon: FileText },
  { key: "agents", label: "Agents", icon: Users },
  { key: "contracts", label: "Rental Contracts", icon: FileText },
  { key: "occupancy", label: "Occupancy", icon: Home },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "receivables", label: "Receivables", icon: CreditCard },
  { key: "reports", label: "Receipts & Reports", icon: BarChart3 },
  { key: "profile", label: "My Profile", icon: User },
];

export default function OwnerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Step>("overview");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [propertyForm, setPropertyForm] = useState({ name: "", address: "", city: "", province: "", type: "house" as "house" | "condominium", description: "", imageUrl: "" });
  const [unitsForm, setUnitsForm] = useState({ unitNumber: "", floor: "", status: "vacant" as "vacant" | "occupied" | "maintenance", rentAmount: 0, imageUrl: "" });
  const [isUploadingPropertyImage, setIsUploadingPropertyImage] = useState(false);
  const [isUploadingUnitImage, setIsUploadingUnitImage] = useState(false);
  const [termsForm, setTermsForm] = useState({ securityDeposit: 0, advancePayment: 0, duration: "12 months", paymentDueDate: "5th", rentalTerms: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState<TenantRecord | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);
  const [viewingReport, setViewingReport] = useState<"rental" | "property" | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editPropertyForm, setEditPropertyForm] = useState({ name: "", location: "", type: "house" as "house" | "condominium", status: "active" as "active" | "inactive", imageUrl: "" });
  const [editUnitForm, setEditUnitForm] = useState({ unitNumber: "", floor: "", status: "vacant" as "vacant" | "occupied" | "maintenance", rentAmount: 0, imageUrl: "" });
  const [isUploadingEditPropertyImage, setIsUploadingEditPropertyImage] = useState(false);
  const [isUploadingEditUnitImage, setIsUploadingEditUnitImage] = useState(false);

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
      console.error("Owner dashboard load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createStep === 1) {
      setCreateStep(2);
      return;
    }
    if (createStep === 2) {
      setCreateStep(3);
      return;
    }
    if (createStep === 3) {
      setCreateStep(4);
      return;
    }
    setIsSubmitting(true);
    try {
      const newProperty = await addProperty({
        name: propertyForm.name,
        location: `${propertyForm.address}, ${propertyForm.city}, ${propertyForm.province}`,
        type: propertyForm.type,
        units: 1,
        occupiedUnits: 0,
        monthlyRevenue: 0,
        status: "active",
        imageUrl: propertyForm.imageUrl || propertyForm.description || undefined,
      }, user?.id || "");
      await addUnit({
        propertyId: newProperty.id,
        unitNumber: unitsForm.unitNumber,
        floor: unitsForm.floor ? parseInt(unitsForm.floor) : undefined,
        status: unitsForm.status,
        rentAmount: unitsForm.rentAmount,
        imageUrl: unitsForm.imageUrl || undefined,
      });
      toast.success("Property created successfully!");
      setShowCreateProperty(false);
      setCreateStep(1);
      setPropertyForm({ name: "", address: "", city: "", province: "", type: "house", description: "", imageUrl: "" });
      setUnitsForm({ unitNumber: "", floor: "", status: "vacant", rentAmount: 0, imageUrl: "" });
      setTermsForm({ securityDeposit: 0, advancePayment: 0, duration: "12 months", paymentDueDate: "5th", rentalTerms: "" });
      loadData();
    } catch {
      toast.error("Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAssignment = async (tenantId: string) => {
    try {
      const updated = await updateTenantAssignment(tenantId, { assignmentStatus: "confirmed" });
      if (updated) {
        setTenants(tenants.map(t => t.id === tenantId ? { ...t, assignmentStatus: "confirmed" } : t));
        toast.success("Assignment confirmed! Tenant can now access the system.");
        window.dispatchEvent(new Event("owner-data-changed"));
        setReviewAssignment(null);
      }
    } catch {
      toast.error("Failed to confirm assignment");
    }
  };

  const handlePropertyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPropertyForm({ ...propertyForm, imageUrl: localUrl });
    setIsUploadingPropertyImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "property");
      const res = await fetch("/api/auth/upload", { method: "POST", credentials: "include", body: formData });
      const result = await res.json();
      if (result.success) {
        URL.revokeObjectURL(localUrl);
        setPropertyForm({ ...propertyForm, imageUrl: result.url });
        toast.success("Property image uploaded");
      } else {
        URL.revokeObjectURL(localUrl);
        setPropertyForm({ ...propertyForm, imageUrl: "" });
        toast.error(result.error || "Failed to upload image");
      }
    } catch {
      URL.revokeObjectURL(localUrl);
      setPropertyForm({ ...propertyForm, imageUrl: "" });
      toast.error("An error occurred");
    } finally {
      setIsUploadingPropertyImage(false);
    }
  };

  const handleUnitImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUnitsForm({ ...unitsForm, imageUrl: localUrl });
    setIsUploadingUnitImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "unit");
      const res = await fetch("/api/auth/upload", { method: "POST", credentials: "include", body: formData });
      const result = await res.json();
      if (result.success) {
        URL.revokeObjectURL(localUrl);
        setUnitsForm({ ...unitsForm, imageUrl: result.url });
        toast.success("Unit image uploaded");
      } else {
        URL.revokeObjectURL(localUrl);
        setUnitsForm({ ...unitsForm, imageUrl: "" });
        toast.error(result.error || "Failed to upload image");
      }
    } catch {
      URL.revokeObjectURL(localUrl);
      setUnitsForm({ ...unitsForm, imageUrl: "" });
      toast.error("An error occurred");
    } finally {
      setIsUploadingUnitImage(false);
    }
  };

  const handleReturnAssignment = async () => {
    if (!reviewAssignment || !returnReason.trim()) {
      toast.error("Please provide a reason for returning the assignment");
      return;
    }
    try {
      const updated = await updateTenantAssignment(reviewAssignment.id, { assignmentStatus: "rejected", unitId: "", propertyName: "", unitNumber: "" });
      if (updated) {
        setTenants(tenants.map(t => t.id === reviewAssignment.id ? { ...t, assignmentStatus: "rejected", unitId: "", propertyName: "", unitNumber: "" } : t));
        toast.success("Assignment returned to agent with reason");
        setReviewAssignment(null);
        setReturnReason("");
        window.dispatchEvent(new Event("owner-data-changed"));
      }
    } catch {
      toast.error("Failed to return assignment");
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    const propertyUnits = units.filter((u) => u.propertyId === property.id);
    const occupied = propertyUnits.filter((u) => u.status === "occupied").length;
    if (occupied > 0) {
      toast.error("Cannot delete property with occupied units");
      return;
    }
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    try {
      await deleteProperty(property.id);
      setProperties(properties.filter((p) => p.id !== property.id));
      setUnits(units.filter((u) => u.propertyId !== property.id));
      toast.success("Property deleted");
    } catch {
      toast.error("Failed to delete property");
    }
  };

  const handleDeleteUnit = async (unit: Unit) => {
    if (!confirm(`Delete Unit ${unit.unitNumber}? This cannot be undone.`)) return;
    try {
      await deleteUnit(unit.id);
      setUnits(units.filter((u) => u.id !== unit.id));
      toast.success("Unit deleted");
    } catch {
      toast.error("Failed to delete unit");
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setEditPropertyForm({
      name: property.name,
      location: property.location,
      type: property.type,
      status: property.status,
      imageUrl: property.imageUrl || "",
    });
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitForm({
      unitNumber: unit.unitNumber,
      floor: unit.floor?.toString() || "",
      status: unit.status,
      rentAmount: unit.rentAmount,
      imageUrl: unit.imageUrl || "",
    });
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setIsSubmitting(true);
    try {
      await updateProperty(editingProperty.id, {
        name: editPropertyForm.name,
        location: editPropertyForm.location,
        type: editPropertyForm.type,
        status: editPropertyForm.status,
        imageUrl: editPropertyForm.imageUrl || undefined,
      });
      setProperties(properties.map(p => p.id === editingProperty.id ? { ...p, ...editPropertyForm } : p));
      toast.success("Property updated");
      setEditingProperty(null);
    } catch {
      toast.error("Failed to update property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setIsSubmitting(true);
    try {
      await updateUnit(editingUnit.id, {
        unitNumber: editUnitForm.unitNumber,
        floor: editUnitForm.floor ? parseInt(editUnitForm.floor) : undefined,
        status: editUnitForm.status,
        rentAmount: editUnitForm.rentAmount,
        imageUrl: editUnitForm.imageUrl || undefined,
      });
      setUnits(units.map(u => u.id === editingUnit.id ? { ...u, ...editUnitForm, floor: editUnitForm.floor ? parseInt(editUnitForm.floor) : undefined } : u));
      toast.success("Unit updated");
      setEditingUnit(null);
    } catch {
      toast.error("Failed to update unit");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const availableUnits = units.filter((u) => u.status === "vacant");
  const occupiedUnits = units.filter((u) => u.status === "occupied");
  const pendingAssignments = tenants.filter((t) => t.assignmentStatus === "pending" && t.unitId);
  const activeTenants = tenants.filter((t) => t.status === "active");
  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "partial");
  const overduePayments = payments.filter((p) => p.status === "overdue");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-foreground">Owner Dashboard</h1>
                      <p className="text-lg text-text-secondary mt-1">Welcome back, {user?.name?.split(" ")[0] || "Owner"}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: "Total Properties", value: properties.length, icon: Home, color: "from-primary-500 to-primary-600", tab: "properties" as const },
                    { label: "Available Units", value: availableUnits.length, icon: Home, color: "from-secondary-500 to-secondary-600", tab: "units" as const },
                    { label: "Occupied Units", value: occupiedUnits.length, icon: Home, color: "from-green-500 to-green-600", tab: "occupancy" as const },
                    { label: "Pending Assignments", value: pendingAssignments.length, icon: Clock, color: "from-amber-500 to-amber-600", tab: "assignments" as const },
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
                        {properties.slice(0, 5).map((property) => {
                          const propertyUnits = units.filter((u) => u.propertyId === property.id);
                          const vacant = propertyUnits.filter((u) => u.status === "vacant");
                          const occupied = propertyUnits.filter((u) => u.status === "occupied");
                          return (
                            <div key={property.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                              <div>
                                <p className="text-base font-medium text-foreground">{property.name}</p>
                                <p className="text-sm text-text-secondary">{property.location}</p>
                                <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                                  <span>{property.units} units</span>
                                  <span>{vacant.length} available</span>
                                  <span>{occupied.length} occupied</span>
                                </div>
                              </div>
                              <Badge variant={property.status === "active" ? "success" : "outline"} className="text-sm font-semibold capitalize">{property.status}</Badge>
                            </div>
                          );
                        })}
                        {properties.length === 0 && <p className="text-center py-8 text-text-secondary">No properties yet</p>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="min-h-[340px]">
                    <CardHeader>
                       <CardTitle className="text-3xl font-bold">Pending Approvals</CardTitle>
                       <CardDescription>Latest assignments awaiting your review</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-3">
                        {pendingAssignments.slice(0, 5).map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div>
                              <p className="text-base font-medium text-foreground">{tenant.name}</p>
                              <p className="text-sm text-text-secondary">{tenant.propertyName} • Unit {tenant.unitNumber}</p>
                              <p className="text-sm text-text-tertiary">{formatCurrency(tenant.rentAmount || 0)}/mo</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="warning" className="text-sm font-semibold capitalize">{tenant.assignmentStatus}</Badge>
                              <p className="text-xs text-text-tertiary mt-1">{new Date(tenant.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                        {pendingAssignments.length === 0 && <p className="text-center py-8 text-text-secondary">No pending assignments</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* PROPERTIES */}
            {activeTab === "properties" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">Properties</h1>
                      <p className="text-base text-text-secondary mt-1">Manage your rental properties</p>
                    </div>
                    <Button size="sm" onClick={() => setShowCreateProperty(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create Property
                    </Button>
                  </div>
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
                              <div className="flex items-center gap-2">
                                <Badge variant={property.status === "active" ? "success" : "outline"} className="capitalize">{property.status}</Badge>
                                <Button size="sm" variant="outline" onClick={() => handleEditProperty(property)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteProperty(property)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                           {property.imageUrl && (
                             <img src={property.imageUrl} alt={property.name} className="w-full h-40 object-cover rounded-xl mb-4 border border-border" />
                           )}
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
                                   <span className="text-sm font-medium">Unit Number: {unit.unitNumber}</span>
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
                        <p className="text-xs text-text-tertiary mt-1">Create your first property to get started</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* RENTAL UNITS */}
            {activeTab === "units" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Rental Units</h1>
                  <p className="text-base text-text-secondary mt-1">Manage all rental units across your properties</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {units.map((unit) => {
                    const property = properties.find((p) => p.id === unit.propertyId);
                    return (
                      <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                           <div className="flex items-start justify-between mb-4">
                             <div>
                                <h3 className="text-lg font-semibold text-foreground">Unit Number {unit.unitNumber}</h3>
                               <p className="text-sm text-text-secondary mt-1">{property?.name || "Unknown Property"}</p>
                               <p className="text-sm text-text-tertiary">{property?.location || ""}</p>
                             </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant={unit.status === "vacant" ? "success" : unit.status === "occupied" ? "outline" : "warning"} className="text-sm font-semibold capitalize">{unit.status}</Badge>
                                 <Button size="sm" variant="outline" onClick={() => handleEditUnit(unit)}>
                                   <Eye className="h-4 w-4 mr-1" />
                                   Edit
                                 </Button>
                                 <Button size="sm" variant="destructive" onClick={() => handleDeleteUnit(unit)}>
                                   <Trash2 className="h-4 w-4 mr-1" />
                                   Delete
                                 </Button>
                               </div>
                           </div>
                           {unit.imageUrl && (
                             <img src={unit.imageUrl} alt={`Unit ${unit.unitNumber}`} className="w-full h-40 object-cover rounded-xl mb-4 border border-border" />
                           )}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                            <span className="text-sm font-medium">Monthly Rent</span>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(unit.rentAmount || 0)}/mo</span>
                          </div>
                           {unit.tenantName && (
                             <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                               <Avatar src={unit.tenantName ? (tenants.find(t => t.name === unit.tenantName)?.avatarUrl || "") : ""} fallback={getInitials(unit.tenantName)} size="sm" />
                               <div>
                                 <span>{unit.tenantName}</span>
                                 {(() => {
                                   const tenant = tenants.find(t => t.name === unit.tenantName);
                                   return tenant?.phone ? <span className="text-xs text-text-tertiary block">{tenant.phone}</span> : null;
                                 })()}
                               </div>
                             </div>
                           )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {units.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Home className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">No units yet</p>
                        <p className="text-xs text-text-tertiary mt-1">Units will appear here once properties are created</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* TENANT ASSIGNMENTS */}
            {activeTab === "assignments" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
                  <p className="text-base text-text-secondary mt-1">Review and manage tenant assignments from agents</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {tenants.filter(t => t.assignmentStatus === "pending" && t.unitId).length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">All caught up!</p>
                          <p className="text-xs text-text-tertiary mt-1">No pending assignments to review</p>
                        </div>
                      ) : (
                         tenants.filter(t => t.assignmentStatus === "pending" && t.unitId).map((tenant) => (
                           <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50">
                               <div className="flex items-center gap-3">
                               <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} />
                               <div>
                                 <p className="font-medium text-foreground">{tenant.name}</p>
                                 <p className="text-xs text-text-secondary">{tenant.propertyName} • {tenant.unitNumber}</p>
                                 <p className="text-xs text-text-tertiary">{formatCurrency(tenant.rentAmount || 0)}/mo</p>
                                 {tenant.phone && <p className="text-xs text-text-secondary">{tenant.phone}</p>}
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                               <Button size="sm" onClick={() => setReviewAssignment(tenant)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                 <Eye className="h-4 w-4 mr-1" />Review
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

            {/* AGENTS */}
            {activeTab === "agents" && (
              <OwnerAgentsPage />
            )}

            {/* RENTAL CONTRACTS */}
            {activeTab === "contracts" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Rental Contracts</h1>
                  <p className="text-base text-text-secondary mt-1">View and manage active rental contracts</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {activeTenants.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                          <p className="text-text-secondary font-medium">No active contracts</p>
                          <p className="text-xs text-text-tertiary mt-1">Contracts will appear here once tenants are assigned</p>
                        </div>
                      ) : (
                         activeTenants.map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar src={tenant.avatarUrl} fallback={getInitials(tenant.name)} />
                              <div>
                                <p className="font-medium text-foreground">{tenant.name}</p>
                                <p className="text-xs text-text-secondary">{tenant.propertyName} • {tenant.unitNumber}</p>
                                <p className="text-xs text-text-tertiary">{formatCurrency(tenant.rentAmount || 0)}/mo</p>
                                {tenant.phone && <p className="text-xs text-text-secondary">{tenant.phone}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="success" className="text-sm font-semibold capitalize">Active</Badge>
                              <p className="text-xs text-text-tertiary mt-1">Since {tenant.contractStart ? new Date(tenant.contractStart).toLocaleDateString() : "N/A"}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* OCCUPANCY */}
            {activeTab === "occupancy" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Occupancy</h1>
                  <p className="text-base text-text-secondary mt-1">Monitor unit occupancy across all properties</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Total Units</p>
                      <p className="text-3xl font-bold text-foreground">{units.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Available</p>
                      <p className="text-3xl font-bold text-green-600">{availableUnits.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Occupied</p>
                      <p className="text-3xl font-bold text-blue-600">{occupiedUnits.length}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Occupancy by Property</CardTitle>
                    <CardDescription>Unit status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {properties.map((property) => {
                        const propertyUnits = units.filter((u) => u.propertyId === property.id);
                        const vacant = propertyUnits.filter((u) => u.status === "vacant");
                        const occupied = propertyUnits.filter((u) => u.status === "occupied");
                        return (
                          <div key={property.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div>
                              <p className="text-base font-medium text-foreground">{property.name}</p>
                              <p className="text-sm text-text-secondary">{property.location}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600 font-medium">{vacant.length} available</span>
                              <span className="text-blue-600 font-medium">{occupied.length} occupied</span>
                            </div>
                          </div>
                        );
                      })}
                      {properties.length === 0 && <p className="text-center py-8 text-text-secondary">No properties yet</p>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Payments</h1>
                  <p className="text-base text-text-secondary mt-1">Track payment status across all tenants</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Total Collected</p>
                       <p className="text-3xl font-bold text-green-600">{formatCurrency(payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Pending</p>
                      <p className="text-3xl font-bold text-amber-600">{pendingPayments.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Overdue</p>
                      <p className="text-3xl font-bold text-red-600">{overduePayments.length}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Records</CardTitle>
                    <CardDescription>All payment transactions</CardDescription>
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
                            <div className="text-right">
                               <p className="text-base font-semibold text-foreground">{formatCurrency(payment.amountPaid || 0)}</p>
                              <Badge variant={payment.status === "paid" ? "success" : payment.status === "pending" ? "warning" : payment.status === "overdue" ? "destructive" : "outline"} className="text-sm font-semibold capitalize">{payment.status}</Badge>
                              <div className="mt-2 flex justify-end gap-2">
                                {payment.receiptUrl && <Button size="sm" variant="outline" onClick={() => setViewingReceipt(payment)}>View Receipt</Button>}
                                {payment.status === "pending" && <Button size="sm" onClick={async () => { const updated = await verifyPayment(payment, user?.id || "", "paid"); if (updated) { setPayments((current) => current.map((item) => item.id === payment.id ? updated : item)); toast.success("Payment confirmed"); } }}>Confirm</Button>}
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

            {/* RECEIVABLES */}
            {activeTab === "receivables" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Receivables</h1>
                  <p className="text-base text-text-secondary mt-1">Monitor outstanding balances and overdue payments</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Total Receivables</p>
                       <p className="text-3xl font-bold text-foreground">{formatCurrency(payments.filter((p) => p.status === "pending" || p.status === "overdue" || p.status === "partial").reduce((sum, p) => sum + (p.balance || 0), 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Outstanding</p>
                      <p className="text-3xl font-bold text-amber-600">{payments.filter((p) => p.status === "pending" || p.status === "partial").length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="min-h-[140px] p-6">
                      <p className="text-sm font-medium text-text-secondary mb-2">Overdue</p>
                      <p className="text-3xl font-bold text-red-600">{overduePayments.length}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Receivable Details</CardTitle>
                    <CardDescription>Outstanding balances by tenant</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payments.filter((p) => p.status === "pending" || p.status === "overdue" || p.status === "partial").length === 0 ? (
                        <p className="text-center py-8 text-text-secondary">No outstanding receivables</p>
                      ) : (
                        payments.filter((p) => p.status === "pending" || p.status === "overdue" || p.status === "partial").map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar src={payment.tenantName ? (tenants.find(t => t.name === payment.tenantName)?.avatarUrl || "") : ""} fallback={getInitials(payment.tenantName)} size="sm" />
                              <div>
                                <p className="text-base font-medium text-foreground">{payment.tenantName}</p>
                                <p className="text-sm text-text-secondary">{payment.propertyName} • Unit {payment.unitId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-base font-semibold text-foreground">{formatCurrency(payment.balance || 0)}</p>
                              <p className="text-xs text-text-secondary">Due {formatDate(payment.dueDate)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* REPORTS */}
            {activeTab === "reports" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Receipts & Reports</h1>
                  <p className="text-base text-text-secondary mt-1">Review rental income and property performance reports</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary-500 to-secondary-600 text-white flex items-center justify-center">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Rental Income</h3>
                      </div>
                       <p className="text-sm text-text-secondary mb-4">Monthly and annual rental income reports</p>
                       <Button variant="outline" className="w-full" onClick={() => setViewingReport("rental")}>View Report</Button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Property Reports</h3>
                      </div>
                       <p className="text-sm text-text-secondary mb-4">Property performance and occupancy reports</p>
                       <Button variant="outline" className="w-full" onClick={() => setViewingReport("property")}>View Report</Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
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
                properties={[]}
              />
            )}

            {/* Create Property Modal */}
            {showCreateProperty && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreateProperty(false); setCreateStep(1); }} />
                <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Create Property</h3>
                      <p className="text-sm text-text-secondary">Step {createStep} of 5</p>
                    </div>
                    <button onClick={() => { setShowCreateProperty(false); setCreateStep(1); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
                    {createStep === 1 && (
                      <div className="space-y-4">
                        <h4 className="text-base font-medium text-foreground">Property Details</h4>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Property Name *</label>
                          <Input value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Address *</label>
                          <Input value={propertyForm.address} onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">City *</label>
                            <Input value={propertyForm.city} onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Province *</label>
                            <Input value={propertyForm.province} onChange={(e) => setPropertyForm({ ...propertyForm, province: e.target.value })} required />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Property Type</label>
                          <select value={propertyForm.type} onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value as "house" | "condominium" })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                            <option value="house">House</option>
                            <option value="condominium">Condominium</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Description</label>
                          <textarea value={propertyForm.description} onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })} className="w-full h-24 px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm resize-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Property Image</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                              <Camera className="h-4 w-4" />
                              <span className="text-sm">{propertyForm.imageUrl ? "Change Image" : "Upload Image"}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handlePropertyImageUpload} disabled={isUploadingPropertyImage} />
                            </label>
                            {isUploadingPropertyImage && <span className="text-xs text-text-secondary">Uploading...</span>}
                             {propertyForm.imageUrl && <img src={propertyForm.imageUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />}
                          </div>
                        </div>
                      </div>
                    )}
                    {createStep === 2 && (
                      <div className="space-y-4">
                        <h4 className="text-base font-medium text-foreground">Set Up Rental Units</h4>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Unit Number *</label>
                          <Input value={unitsForm.unitNumber} onChange={(e) => setUnitsForm({ ...unitsForm, unitNumber: e.target.value })} required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Floor</label>
                          <Input type="number" value={unitsForm.floor} onChange={(e) => setUnitsForm({ ...unitsForm, floor: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Unit Status</label>
                          <select value={unitsForm.status} onChange={(e) => setUnitsForm({ ...unitsForm, status: e.target.value as any })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                            <option value="vacant">Vacant</option>
                            <option value="occupied">Occupied</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Unit Image</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                              <Camera className="h-4 w-4" />
                              <span className="text-sm">{unitsForm.imageUrl ? "Change Image" : "Upload Image"}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleUnitImageUpload} disabled={isUploadingUnitImage} />
                            </label>
                            {isUploadingUnitImage && <span className="text-xs text-text-secondary">Uploading...</span>}
                             {unitsForm.imageUrl && <img src={unitsForm.imageUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />}
                          </div>
                        </div>
                      </div>
                    )}
                    {createStep === 3 && (
                      <div className="space-y-4">
                        <h4 className="text-base font-medium text-foreground">Rental Rate and Terms</h4>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Monthly Rental Rate (₱) *</label>
                          <Input type="number" value={unitsForm.rentAmount} onChange={(e) => setUnitsForm({ ...unitsForm, rentAmount: Number(e.target.value) })} required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Security Deposit (₱)</label>
                          <Input type="number" value={termsForm.securityDeposit} onChange={(e) => setTermsForm({ ...termsForm, securityDeposit: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Advance Payment (₱)</label>
                          <Input type="number" value={termsForm.advancePayment} onChange={(e) => setTermsForm({ ...termsForm, advancePayment: Number(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Rental Duration</label>
                            <select value={termsForm.duration} onChange={(e) => setTermsForm({ ...termsForm, duration: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                              <option value="6 months">6 Months</option>
                              <option value="12 months">12 Months</option>
                              <option value="24 months">24 Months</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">Payment Due Date</label>
                            <select value={termsForm.paymentDueDate} onChange={(e) => setTermsForm({ ...termsForm, paymentDueDate: e.target.value })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                              <option value="1st">1st of month</option>
                              <option value="5th">5th of month</option>
                              <option value="10th">10th of month</option>
                              <option value="15th">15th of month</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Rental Terms</label>
                          <textarea value={termsForm.rentalTerms} onChange={(e) => setTermsForm({ ...termsForm, rentalTerms: e.target.value })} className="w-full h-24 px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm resize-none" />
                        </div>
                      </div>
                    )}
                    {createStep === 4 && (
                      <div className="space-y-4">
                        <h4 className="text-base font-medium text-foreground">Review Property</h4>
                        <div className="p-4 rounded-xl border border-border space-y-2">
                          <p className="text-sm"><span className="font-medium">Name:</span> {propertyForm.name}</p>
                          <p className="text-sm"><span className="font-medium">Address:</span> {propertyForm.address}, {propertyForm.city}, {propertyForm.province}</p>
                          <p className="text-sm"><span className="font-medium">Type:</span> {propertyForm.type}</p>
                          <p className="text-sm"><span className="font-medium">Unit:</span> {unitsForm.unitNumber} (Floor {unitsForm.floor || "N/A"})</p>
                           <p className="text-sm"><span className="font-medium">Rent:</span> {formatCurrency(unitsForm.rentAmount)}/mo</p>
                           <p className="text-sm"><span className="font-medium">Deposit:</span> {formatCurrency(termsForm.securityDeposit)}</p>
                          <p className="text-sm"><span className="font-medium">Duration:</span> {termsForm.duration}</p>
                        </div>
                      </div>
                    )}
                    {createStep === 5 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-lg font-medium text-foreground">Property Created Successfully!</p>
                        <p className="text-sm text-text-secondary mt-1">You can now manage units and assign tenants</p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      {createStep < 5 && (
                        <>
                          <Button type="button" variant="outline" onClick={() => setCreateStep(Math.max(1, createStep - 1))} disabled={createStep === 1}>Back</Button>
                          <Button type="submit" disabled={isSubmitting} className="flex-1">{createStep === 4 ? (isSubmitting ? "Creating..." : "Create Property") : "Next"}</Button>
                        </>
                      )}
                      {createStep === 5 && (
                        <Button type="button" onClick={() => { setShowCreateProperty(false); setCreateStep(1); }} className="flex-1">Done</Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

             {/* Review Assignment Modal */}
             {reviewAssignment && (
               <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-black/50" onClick={() => { setReviewAssignment(null); setReturnReason(""); }} />
                 <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl">
                   <div className="p-6 border-b border-border flex items-center justify-between">
                     <div>
                       <h3 className="text-lg font-semibold text-foreground">Review Tenant Assignment</h3>
                       <p className="text-sm text-text-secondary">Review the details before confirming</p>
                     </div>
                     <button onClick={() => { setReviewAssignment(null); setReturnReason(""); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                   <div className="p-6 space-y-4">
                     <div className="flex items-center gap-3">
                       <Avatar src={reviewAssignment.avatarUrl} fallback={getInitials(reviewAssignment.name)} />
                       <div>
                         <p className="font-medium text-foreground">{reviewAssignment.name}</p>
                         <p className="text-sm text-text-secondary">{reviewAssignment.email}</p>
                       </div>
                     </div>
                     <div className="p-4 rounded-xl border border-border space-y-2">
                       <p className="text-sm"><span className="font-medium">Property:</span> {reviewAssignment.propertyName}</p>
                       <p className="text-sm"><span className="font-medium">Unit:</span> {reviewAssignment.unitNumber}</p>
                       <p className="text-sm"><span className="font-medium">Rental Rate:</span> {formatCurrency(reviewAssignment.rentAmount || 0)}/mo</p>
                       <p className="text-sm"><span className="font-medium">Status:</span> {reviewAssignment.assignmentStatus}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium mb-1.5">Reason for returning (if applicable)</label>
                       <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full h-20 px-3 py-2 rounded-xl border border-border bg-surface-secondary text-sm resize-none" placeholder="Enter reason if returning to agent..." />
                     </div>
                   </div>
                   <div className="p-6 border-t border-border flex gap-3">
                     <Button variant="outline" onClick={() => { setReviewAssignment(null); setReturnReason(""); }} className="flex-1">Cancel</Button>
                     <Button variant="outline" onClick={handleReturnAssignment} className="flex-1 text-red-600 hover:text-red-700">Return to Agent</Button>
                     <Button onClick={() => handleConfirmAssignment(reviewAssignment.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Confirm Assignment</Button>
                   </div>
                 </div>
               </div>
             )}
            {viewingReceipt && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setViewingReceipt(null)} />
                <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Payment Receipt</h3>
                      <p className="text-sm text-text-secondary">{viewingReceipt.tenantName} • {formatDate(viewingReceipt.paymentDate)}</p>
                    </div>
                    <button onClick={() => setViewingReceipt(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {payments.filter(p => p.receiptUrl).length === 0 ? (
                      <div className="text-center py-12 text-text-secondary">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">No receipts uploaded yet</p>
                        <p className="text-xs mt-1">Receipts will appear here once tenants upload payment proofs</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {payments.filter(p => p.receiptUrl).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setViewingReceipt(p)}
                              className={`p-2 rounded-lg border text-left transition-colors ${viewingReceipt.id === p.id ? "border-blue-500 bg-blue-50" : "border-border hover:bg-surface-secondary"}`}
                            >
                              <p className="text-xs font-medium truncate">{p.tenantName}</p>
                              <p className="text-[10px] text-text-secondary">{formatDate(p.paymentDate)}</p>
                            </button>
                          ))}
                        </div>
                        {viewingReceipt.receiptUrl ? (
                          <img src={viewingReceipt.receiptUrl} alt="Receipt" className="w-full h-auto max-h-80 object-contain rounded-xl border border-border" />
                        ) : (
                          <div className="text-center py-8 text-text-secondary">No receipt image for this payment</div>
                        )}
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const receiptPayments = payments.filter(p => p.receiptUrl);
                              const currentIndex = receiptPayments.findIndex(p => p.id === viewingReceipt.id);
                              if (currentIndex > 0) setViewingReceipt(receiptPayments[currentIndex - 1]);
                            }}
                            disabled={payments.filter(p => p.receiptUrl).findIndex(p => p.id === viewingReceipt.id) === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const receiptPayments = payments.filter(p => p.receiptUrl);
                              const currentIndex = receiptPayments.findIndex(p => p.id === viewingReceipt.id);
                              if (currentIndex < receiptPayments.length - 1) setViewingReceipt(receiptPayments[currentIndex + 1]);
                            }}
                            disabled={payments.filter(p => p.receiptUrl).findIndex(p => p.id === viewingReceipt.id) === payments.filter(p => p.receiptUrl).length - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-surface-secondary">
                        <p className="text-xs text-text-secondary mb-1">Amount Paid</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(viewingReceipt.amountPaid || 0)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-secondary">
                        <p className="text-xs text-text-secondary mb-1">Balance</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(viewingReceipt.balance || 0)}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-secondary">
                        <p className="text-xs text-text-secondary mb-1">Status</p>
                        <Badge variant={viewingReceipt.status === "paid" ? "success" : viewingReceipt.status === "pending" ? "warning" : "outline"} className="capitalize">{viewingReceipt.status}</Badge>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-secondary">
                        <p className="text-xs text-text-secondary mb-1">Payment ID</p>
                        <p className="text-sm font-mono text-foreground">{viewingReceipt.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border">
                    <Button variant="outline" onClick={() => setViewingReceipt(null)} className="w-full">Close</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Rental Income Report Modal */}
            {viewingReport === "rental" && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setViewingReport(null)} />
                <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Rental Income Report</h3>
                      <p className="text-sm text-text-secondary">Monthly and annual rental income overview</p>
                    </div>
                    <button onClick={() => setViewingReport(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Total Collected</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0))}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Total Receivables</p>
                          <p className="text-2xl font-bold text-amber-600">{formatCurrency(payments.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.balance || 0), 0))}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Monthly Revenue</p>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(properties.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0))}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Overdue Payments</p>
                          <p className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === "overdue").length}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Payment History</h4>
                      <div className="space-y-2">
                        {payments.slice(0, 20).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                            <div>
                              <p className="text-sm font-medium text-foreground">{payment.tenantName}</p>
                              <p className="text-xs text-text-secondary">{formatDate(payment.paymentDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</p>
                              <Badge variant={payment.status === "paid" ? "success" : payment.status === "pending" ? "warning" : "outline"} className="text-xs capitalize">{payment.status}</Badge>
                            </div>
                          </div>
                        ))}
                        {payments.length === 0 && <p className="text-center py-6 text-text-secondary">No payment records yet</p>}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border">
                    <Button variant="outline" onClick={() => setViewingReport(null)} className="w-full">Close</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Property Reports Modal */}
            {viewingReport === "property" && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setViewingReport(null)} />
                <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Property Reports</h3>
                      <p className="text-sm text-text-secondary">Property performance and occupancy overview</p>
                    </div>
                    <button onClick={() => setViewingReport(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Total Properties</p>
                          <p className="text-2xl font-bold text-foreground">{properties.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Total Units</p>
                          <p className="text-2xl font-bold text-foreground">{units.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <p className="text-sm text-text-secondary mb-1">Occupancy Rate</p>
                          <p className="text-2xl font-bold text-foreground">{units.length > 0 ? Math.round((units.filter(u => u.status === "occupied").length / units.length) * 100) : 0}%</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Property Breakdown</h4>
                      <div className="space-y-3">
                        {properties.map((property) => {
                          const propertyUnits = units.filter(u => u.propertyId === property.id);
                          const occupied = propertyUnits.filter(u => u.status === "occupied").length;
                          return (
                            <div key={property.id} className="p-4 rounded-xl border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-foreground">{property.name}</p>
                                <Badge variant={property.status === "active" ? "success" : "outline"} className="capitalize">{property.status}</Badge>
                              </div>
                              <p className="text-xs text-text-secondary mb-2">{property.location}</p>
                              <div className="flex items-center gap-4 text-xs text-text-secondary">
                                <span>{propertyUnits.length} units</span>
                                <span>{occupied} occupied</span>
                                <span>{propertyUnits.length - occupied} vacant</span>
                              </div>
                            </div>
                          );
                        })}
                        {properties.length === 0 && <p className="text-center py-6 text-text-secondary">No properties registered yet</p>}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border">
                    <Button variant="outline" onClick={() => setViewingReport(null)} className="w-full">Close</Button>
                  </div>
                </div>
              </div>
              )}
            {editingProperty && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setEditingProperty(null)} />
                <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Edit Property</h3>
                      <p className="text-sm text-text-secondary">Update property details</p>
                    </div>
                    <button onClick={() => setEditingProperty(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveProperty} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Property Name *</label>
                      <Input value={editPropertyForm.name} onChange={(e) => setEditPropertyForm({ ...editPropertyForm, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Location *</label>
                      <Input value={editPropertyForm.location} onChange={(e) => setEditPropertyForm({ ...editPropertyForm, location: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Type</label>
                        <select value={editPropertyForm.type} onChange={(e) => setEditPropertyForm({ ...editPropertyForm, type: e.target.value as "house" | "condominium" })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                          <option value="house">House</option>
                          <option value="condominium">Condominium</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Status</label>
                        <select value={editPropertyForm.status} onChange={(e) => setEditPropertyForm({ ...editPropertyForm, status: e.target.value as "active" | "inactive" })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Property Image</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                          <Camera className="h-4 w-4" />
                          <span className="text-sm">{editPropertyForm.imageUrl ? "Change Image" : "Upload Image"}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingEditPropertyImage(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              formData.append("type", "property");
                              const res = await fetch("/api/auth/upload", { method: "POST", credentials: "include", body: formData });
                              const result = await res.json();
                              if (result.success) {
                                setEditPropertyForm({ ...editPropertyForm, imageUrl: result.url });
                                toast.success("Property image uploaded");
                              } else {
                                toast.error(result.error || "Failed to upload image");
                              }
                            } catch {
                              toast.error("An error occurred");
                            } finally {
                              setIsUploadingEditPropertyImage(false);
                            }
                          }} disabled={isUploadingEditPropertyImage} />
                        </label>
                        {isUploadingEditPropertyImage && <span className="text-xs text-text-secondary">Uploading...</span>}
                        {editPropertyForm.imageUrl && <img src={editPropertyForm.imageUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setEditingProperty(null)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {editingUnit && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setEditingUnit(null)} />
                <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Edit Unit</h3>
                      <p className="text-sm text-text-secondary">Update unit details</p>
                    </div>
                    <button onClick={() => setEditingUnit(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Unit Number *</label>
                      <Input value={editUnitForm.unitNumber} onChange={(e) => setEditUnitForm({ ...editUnitForm, unitNumber: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Floor</label>
                        <Input type="number" value={editUnitForm.floor} onChange={(e) => setEditUnitForm({ ...editUnitForm, floor: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Status</label>
                        <select value={editUnitForm.status} onChange={(e) => setEditUnitForm({ ...editUnitForm, status: e.target.value as "vacant" | "occupied" | "maintenance" })} className="h-10 px-3 rounded-xl border border-border bg-surface-secondary text-sm">
                          <option value="vacant">Vacant</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Monthly Rent (₱) *</label>
                      <Input type="number" value={editUnitForm.rentAmount} onChange={(e) => setEditUnitForm({ ...editUnitForm, rentAmount: Number(e.target.value) })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Unit Image</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                          <Camera className="h-4 w-4" />
                          <span className="text-sm">{editUnitForm.imageUrl ? "Change Image" : "Upload Image"}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingEditUnitImage(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              formData.append("type", "unit");
                              const res = await fetch("/api/auth/upload", { method: "POST", credentials: "include", body: formData });
                              const result = await res.json();
                              if (result.success) {
                                setEditUnitForm({ ...editUnitForm, imageUrl: result.url });
                                toast.success("Unit image uploaded");
                              } else {
                                toast.error(result.error || "Failed to upload image");
                              }
                            } catch {
                              toast.error("An error occurred");
                            } finally {
                              setIsUploadingEditUnitImage(false);
                            }
                          }} disabled={isUploadingEditUnitImage} />
                        </label>
                        {isUploadingEditUnitImage && <span className="text-xs text-text-secondary">Uploading...</span>}
                        {editUnitForm.imageUrl && <img src={editUnitForm.imageUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === "profile" && (
              <ProfilePanel />
            )}
          </div>
    );
  }
