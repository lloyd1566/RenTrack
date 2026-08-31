"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Settings, Activity, FileText, Stethoscope,
  Heart, Wrench, CheckCircle2, XCircle, Search, Eye, Trash2,
  UserPlus, RefreshCw, Download, Server, Gauge, Sliders,
  Bell, Home, Building2, CreditCard, Star, MessageSquare, ToggleLeft, ToggleRight, Plus, X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getUsers, getProperties, getUnits, getTenants, getNotifications,
  getPayments, getComplaints, getAllRatings, getAuditLogs,
  UserRecord, Property, Unit, TenantRecord, Notification, Payment, Complaint, Rating, AuditLog,
  deleteUser, updateUserRole, updateUser, adminResetUserPassword,
  getConversations,
  updateComplaintStatus,
  getComplaintById,
} from "@/lib/data";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import MessagingModal from "@/components/messaging-modal";
import CreateTenantModal from "@/components/create-tenant-modal";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AdminDashboard() {
  const { user, login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "overview";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState<Record<string, string> | null>(null);
  const [isRunningDiagnosis, setIsRunningDiagnosis] = useState(false);
  const [healthData, setHealthData] = useState<{ success: boolean; checks: Record<string, string> } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<string>("");
  const [maintenanceLoading, setMaintenanceLoading] = useState<Record<string, boolean>>({});
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [resettingPassword, setResettingPassword] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [replyingComplaint, setReplyingComplaint] = useState<string | null>(null);
  const [complaintReply, setComplaintReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        getUsers(), getProperties(), getUnits(), getTenants(), getNotifications(user?.id),
        getPayments(), getComplaints(), getAllRatings(), getAuditLogs(40),
      ]);
      const [usersRes, propsRes, unitsRes, tenantsRes, notifRes, paymentsRes, complaintsRes, ratingsRes, auditRes] = results;
      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
      if (propsRes.status === "fulfilled") setProperties(propsRes.value);
      if (unitsRes.status === "fulfilled") setUnits(unitsRes.value);
      if (tenantsRes.status === "fulfilled") setTenants(tenantsRes.value);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value);
      if (paymentsRes.status === "fulfilled") setPayments(paymentsRes.value);
      if (complaintsRes.status === "fulfilled") setComplaints(complaintsRes.value);
      if (ratingsRes.status === "fulfilled") setRatings(ratingsRes.value);
      if (auditRes.status === "fulfilled") setAuditLogs(auditRes.value);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const openComplaint = useCallback(async (complaint: Complaint) => {
    try {
      const fresh = await getComplaintById(complaint.id);
      setSelectedComplaint(fresh || complaint);
    } catch {
      setSelectedComplaint(complaint);
    }
    if (complaint.tenantId) {
      try {
        const tenantList = await getTenants();
        setTenants(tenantList);
        const tenant = tenantList.find(t => t.id === complaint.tenantId);
        setSelectedTenant(tenant || null);
      } catch {
        // ignore
      }
    }
    router.push("/dashboard/admin?tab=complaints");
  }, [router]);

  useEffect(() => {
    loadData();
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(() => {});
    fetch("/api/admin/config", { credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data.success && data.config) setSystemConfig(data.config); })
      .catch(() => {});
    fetch("/api/admin/maintenance/mode", { credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data.success) setMaintenanceMode(data.enabled); })
      .catch(() => {});
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      getNotifications(user.id).then(setNotifications).catch(() => {});
      if (activeTab === "complaints") {
        getComplaints().then(setComplaints).catch(() => {});
      }
    }, 10000);
    const handleFocus = () => {
      getNotifications(user.id).then(setNotifications).catch(() => {});
      if (activeTab === "complaints") {
        getComplaints().then(setComplaints).catch(() => {});
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, activeTab]);

  useEffect(() => {
    const refreshAllUsers = async () => {
      try {
        const [usersData, tenantsData] = await Promise.all([
          getUsers(),
          getTenants(),
        ]);
        setUsers(usersData);
        setTenants(tenantsData);
      } catch {
        // ignore
      }
    };
    window.addEventListener("renttrack-profile-updated", refreshAllUsers);
    return () => window.removeEventListener("renttrack-profile-updated", refreshAllUsers);
  }, []);

  useEffect(() => {
    if (activeTab === "messages" && user) {
      (async () => {
        try {
          const convs = await getConversations();
          setConversations(convs);
        } catch (err) {
          console.error("Failed to load conversations:", err);
        }
      })();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "complaints") {
      getTenants().then(setTenants).catch(() => {});
      getComplaints().then(setComplaints).catch(() => {});
    }
  }, [activeTab]);

  const saveConfig = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (data.success && data.config) {
        setSystemConfig(data.config);
        toast.success(`${key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} updated`);
      } else {
        toast.error(data.error || "Failed to update config");
      }
    } catch {
      toast.error("Failed to update config");
    }
  };

  const handleCreateTenant = async (formData: {
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
  }) => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setIsCreatingTenant(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "tenant" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetch("/api/data/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, address: formData.address, propertyName: formData.propertyName, unitNumber: formData.unitNumber, rentAmount: Number(formData.rentAmount) || 0, contractStart: formData.contractStart || undefined, contractEnd: formData.contractEnd || undefined, assignmentStatus: "confirmed" }) });
        toast.success("Tenant account created successfully!");
        setShowCreateTenant(false);
        loadData();
      } else {
        toast.error(data.error || "Failed to create tenant account");
      }
    } catch {
      toast.error("Failed to create tenant account");
    } finally {
      setIsCreatingTenant(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("User role updated");
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, { name: editForm.name, email: editForm.email });
      if (updated) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
        toast.success("User updated successfully");
        setEditingUser(null);
      } else {
        toast.error("Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPassword || !newPassword) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await adminResetUserPassword(resettingPassword.id, newPassword);
      toast.success("Password reset successfully");
      setResettingPassword(null);
      setNewPassword("");
    } catch {
      toast.error("Failed to reset password");
    }
  };

  const systemStats = useMemo(() => [
    { label: "Total Users", value: users.length, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Properties", value: properties.length, icon: Building2, color: "from-emerald-500 to-emerald-600" },
    { label: "Units", value: units.length, icon: Home, color: "from-purple-500 to-purple-600" },
    { label: "Tenants", value: tenants.length, icon: UserPlus, color: "from-amber-500 to-amber-600" },
    { label: "Payments", value: payments.length, icon: CreditCard, color: "from-green-500 to-green-600" },
    { label: "Notifications", value: notifications.length, icon: Bell, color: "from-pink-500 to-pink-600" },
  ], [users.length, properties.length, units.length, tenants.length, payments.length, notifications.length]);

  const occupiedUnits = units.filter((unit) => unit.status === "occupied").length;
  const availableUnits = units.filter((unit) => unit.status === "vacant").length;
  const rentingTenants = tenants.filter((tenant) => tenant.status === "active" && tenant.assignmentStatus === "confirmed").length;
  const roleCounts = {
    admin: users.filter((account) => account.role === "admin").length,
    owner: users.filter((account) => account.role === "owner").length,
    agent: users.filter((account) => account.role === "agent").length,
    tenant: users.filter((account) => account.role === "tenant").length,
  };
  const recentActivities = [...notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    title: notification.title,
    detail: notification.message,
    type: notification.type,
    date: notification.createdAt,
  })), ...auditLogs.map((log) => ({
    id: `audit-${log.id}`,
    title: log.action.replace(/_/g, " "),
    detail: `${log.actor} • ${formatDate(log.createdAt)}`,
    type: "system",
    date: log.createdAt,
  }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const userRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.role));
    return map;
  }, [users]);

  const userUpdates = useMemo(() => {
    const updates: { id: string; title: string; detail: string; role: string; date: string }[] = [];
    notifications.forEach((notification) => {
      const role = userRoleMap.get(notification.userId);
      if (role === "owner" || role === "tenant" || role === "agent") {
        updates.push({
          id: `notification-${notification.id}`,
          title: notification.title,
          detail: notification.message,
          role,
          date: notification.createdAt,
        });
      }
    });
    auditLogs.forEach((log) => {
      if (!log.userId) return;
      const role = userRoleMap.get(log.userId);
      if (role === "owner" || role === "tenant" || role === "agent") {
        updates.push({
          id: `audit-${log.id}`,
          title: log.action.replace(/_/g, " "),
          detail: `${log.actor} • ${formatDate(log.createdAt)}`,
          role,
          date: log.createdAt,
        });
      }
    });
    return updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [notifications, auditLogs, userRoleMap]);

  const getRoleBadge = (role: string) => {
    if (role === "owner") return { label: "Owner", className: "bg-amber-50 text-amber-700 border-amber-200" };
    if (role === "tenant") return { label: "Tenant", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (role === "agent") return { label: "Agent", className: "bg-blue-50 text-blue-700 border-blue-200" };
    return { label: role, className: "bg-gray-50 text-gray-700 border-gray-200" };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6 w-full max-w-none">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Administrator Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">System at a glance</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor properties, occupancy, users, and platform health.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Properties", value: properties.length, icon: Building2, tone: "text-blue-600 bg-blue-50" },
              { label: "Total Units", value: units.length, icon: Home, tone: "text-indigo-600 bg-indigo-50" },
              { label: "Occupied Units", value: occupiedUnits, icon: Users, tone: "text-emerald-600 bg-emerald-50" },
              { label: "Available Units", value: availableUnits, icon: Home, tone: "text-amber-600 bg-amber-50" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-gray-200 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <motion.p
                        className="mt-2 text-3xl font-bold text-gray-900 dark:text-white"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.tone)}
                    >
                      <stat.icon className="h-5 w-5" />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[
              { title: "Unit Occupancy", description: "Occupied and available rental units", primary: occupiedUnits, secondary: availableUnits, primaryLabel: "Occupied Units", secondaryLabel: "Available Units", primaryColor: "#2563eb", secondaryColor: "#cbd5e1" },
              { title: "Rental Status", description: "Tenants renting versus units available", primary: rentingTenants, secondary: availableUnits, primaryLabel: "Currently Renting", secondaryLabel: "Available Units", primaryColor: "#16a34a", secondaryColor: "#cbd5e1" },
            ].map((chart) => {
              const total = chart.primary + chart.secondary;
              const primaryPercent = total ? Math.round((chart.primary / total) * 100) : 0;
              return <motion.div key={chart.title} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}><Card className="border-gray-200 shadow-sm dark:border-gray-700">
                <CardHeader><CardTitle className="text-base text-gray-900 dark:text-white">{chart.title}</CardTitle><CardDescription>{chart.description}</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[220px_1fr]">
                  <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: chart.primaryLabel, value: chart.primary }, { name: chart.secondaryLabel, value: chart.secondary }]} innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value" stroke="none"><Cell fill={chart.primaryColor} /><Cell fill={chart.secondaryColor} /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                  <div className="space-y-4">{[[chart.primaryLabel, chart.primary, chart.primaryColor, primaryPercent], [chart.secondaryLabel, chart.secondary, chart.secondaryColor, 100 - primaryPercent]].map(([label, value, color, percent]) => <motion.div key={String(label)} whileHover={{ x: 2 }} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700 transition-all"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: String(color) }} /><span className="text-sm text-gray-600 dark:text-gray-300">{label}</span></div><span className="text-sm font-semibold text-gray-900 dark:text-white">{value} <span className="ml-1 text-xs font-normal text-gray-400">({percent}%)</span></span></motion.div>)}</div>
                </CardContent>
              </Card>
              </motion.div>
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="border-gray-200 shadow-sm dark:border-gray-700"><CardHeader><CardTitle className="text-base text-gray-900 dark:text-white">User Overview</CardTitle><CardDescription>Accounts by role</CardDescription></CardHeader><CardContent className="space-y-3">{[["Total Users", users.length], ["Administrators", roleCounts.admin], ["Property Owners", roleCounts.owner], ["Agents", roleCounts.agent], ["Tenants", roleCounts.tenant]].map(([label, value]) => <motion.div key={String(label)} whileHover={{ x: 2 }} className="flex justify-between text-sm transition-all"><span className="text-gray-500 dark:text-gray-400">{label}</span><span className="font-semibold text-gray-900 dark:text-white">{value}</span></motion.div>)}</CardContent></Card>
            <Card className="border-gray-200 shadow-sm dark:border-gray-700"><CardHeader><CardTitle className="text-base text-gray-900 dark:text-white">Recent Updates</CardTitle><CardDescription>Latest activity from owners, tenants, and agents</CardDescription></CardHeader><CardContent className="space-y-3">{userUpdates.length ? userUpdates.map((update) => { const badge = getRoleBadge(update.role); return <motion.div key={update.id} whileHover={{ x: 2 }} className="flex gap-2 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700 cursor-default transition-all"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium capitalize text-gray-900 dark:text-white">{update.title}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>{badge.label}</span></div><p className="truncate text-xs text-gray-500 dark:text-gray-400">{update.detail}</p></div></motion.div>; }) : <p className="py-4 text-center text-sm text-gray-500">No updates from owners, tenants, or agents yet</p>}</CardContent></Card>
            <Card className="border-gray-200 shadow-sm dark:border-gray-700 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push("/dashboard/admin?tab=complaints")}><CardHeader><CardTitle className="text-base text-gray-900 dark:text-white">Recent Complaints</CardTitle><CardDescription>Latest tenant complaints</CardDescription></CardHeader><CardContent className="space-y-3">{complaints.slice(0, 5).length ? complaints.slice(0, 5).map((c) => { const tenant = tenants.find(t => t.id === c.tenantId); return (<motion.div key={c.id} whileHover={{ scale: 1.01 }} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700 cursor-pointer transition-all" onClick={() => openComplaint(c)}><Avatar src={tenant?.avatarUrl} fallback={(tenant?.name || c.tenantName || c.tenantId || "T").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.subject}</p><motion.span whileHover={{ scale: 1.05 }} className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all", c.priority === "urgent" && "bg-red-50 text-red-700 border-red-200", c.priority === "high" && "bg-orange-50 text-orange-700 border-orange-200", c.priority === "medium" && "bg-amber-50 text-amber-700 border-amber-200", c.priority === "low" && "bg-gray-50 text-gray-700 border-gray-200")}>{c.priority}</motion.span></div><p className="truncate text-xs text-gray-500 dark:text-gray-400">{tenant?.name || c.tenantName || c.tenantId}</p><div className="mt-1">                                <motion.span whileHover={{ scale: 1.05 }} className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all", c.status === "open" && "bg-red-50 text-red-700 border-red-200", c.status === "in_progress" && "bg-amber-50 text-amber-700 border-amber-200", c.status === "resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200", c.status === "closed" && "bg-gray-50 text-gray-700 border-gray-200")}>{c.status.replace("_", " ")}</motion.span>
                                {c.tenantReplyText && <motion.span whileHover={{ scale: 1.05 }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">Tenant Replied</motion.span>}</div></div></motion.div>); }) : <p className="py-4 text-center text-sm text-gray-500">No complaints yet</p>}</CardContent></Card>
          </div>
        </div>
      )}

      {/* User Accounts Tab */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Users className="h-5 w-5 text-gray-600" />
                    </motion.div>
                    All User Accounts
                  </CardTitle>
                  <CardDescription>Manage user accounts and roles across the system</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search users..." className="pl-9 h-10 w-64 border-gray-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        whileHover={{ scale: 1.005, backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                        className="border-b border-border/50 hover:bg-surface-secondary transition-all duration-200"
                      >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatarUrl} fallback={u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                          <span className="font-medium">{u.name || "Unnamed"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">{u.email}</TableCell>
                      <TableCell>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                            u.role === "admin" && "bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100",
                            u.role === "owner" && "bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100",
                            u.role === "agent" && "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100",
                            u.role === "tenant" && "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100",
                          )}
                        >
                          {u.role}
                        </motion.span>
                      </TableCell>
                      <TableCell className="text-text-secondary text-xs">{u.createdAt ? formatDate(u.createdAt) : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu
                          align="end"
                          trigger={
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                              </Button>
                            </motion.div>
                          }
                        >
                          <DropdownItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>} onClick={() => handleEditUser(u)}>Edit</DropdownItem>
                          <DropdownItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-amber-500"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>} onClick={() => setResettingPassword(u)}>Reset password</DropdownItem>
                          <DropdownItem icon={<Trash2 className="h-4 w-4 text-red-500" />} onClick={() => handleDeleteUser(u.id)} className="text-red-600">Delete</DropdownItem>
                        </DropdownMenu>
                      </TableCell>
                     </motion.tr>
                   ))}
                 </TableBody>
               </Table>
             </div>
           </CardContent>
         </Card>
       </motion.div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="h-5 w-5 text-gray-600" />
              Properties
            </CardTitle>
            <CardDescription>Manage properties across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No properties found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-text-secondary">{p.location}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            p.type === "house" && "bg-blue-50 text-blue-600",
                            p.type === "condominium" && "bg-purple-50 text-purple-600",
                          )}>
                            {p.type}
                          </span>
                        </TableCell>
                        <TableCell>{p.units}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            p.status === "active" && "bg-green-50 text-green-600",
                            p.status === "inactive" && "bg-gray-50 text-gray-600",
                          )}>
                            {p.status}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Units Tab */}
      {activeTab === "units" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Home className="h-5 w-5 text-gray-600" />
              Units
            </CardTitle>
            <CardDescription>Manage units across all properties</CardDescription>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No units found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{u.unitNumber}</TableCell>
                        <TableCell className="text-text-secondary">{properties.find((p) => p.id === u.propertyId)?.name || u.propertyId}</TableCell>
                        <TableCell>{u.floor ?? "-"}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(u.rentAmount || 0)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            u.status === "occupied" && "bg-green-50 text-green-600",
                            u.status === "vacant" && "bg-gray-50 text-gray-600",
                            u.status === "maintenance" && "bg-amber-50 text-amber-600",
                          )}>
                            {u.status}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tenants Tab */}
      {activeTab === "tenants" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <UserPlus className="h-5 w-5 text-gray-600" />
                  Tenants
                </CardTitle>
                <CardDescription>Manage tenant accounts and assignments</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowCreateTenant(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Tenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No tenants found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((t, i) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-text-secondary">{t.email}</TableCell>
                        <TableCell className="text-text-secondary">{t.phone}</TableCell>
                        <TableCell>{t.unitNumber || "-"}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            t.status === "active" && "bg-green-50 text-green-600",
                            t.status === "inactive" && "bg-gray-50 text-gray-600",
                          )}>
                            {t.status}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-gray-600" />
              Payments
            </CardTitle>
            <CardDescription>View and manage payment records</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No payments found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{p.tenantName}</TableCell>
                        <TableCell className="text-text-secondary">{p.unitId}</TableCell>
                        <TableCell className="text-text-secondary">{formatCurrency(p.amountPaid || 0)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            p.status === "paid" && "bg-green-50 text-green-600",
                            p.status === "pending" && "bg-amber-50 text-amber-600",
                            p.status === "overdue" && "bg-red-50 text-red-600",
                            p.status === "partial" && "bg-blue-50 text-blue-600",
                          )}>
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs">{p.paymentDate ? formatDate(p.paymentDate) : "N/A"}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ratings Tab */}
      {activeTab === "ratings" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Star className="h-5 w-5 text-gray-600" />
              Ratings
            </CardTitle>
            <CardDescription>View ratings across properties and units</CardDescription>
          </CardHeader>
          <CardContent>
            {ratings.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No ratings found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratings.map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{r.userName || r.userId}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            r.targetType === "property" && "bg-blue-50 text-blue-600",
                            r.targetType === "unit" && "bg-purple-50 text-purple-600",
                          )}>
                            {r.targetType} ({r.targetId})
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-amber-600 font-medium">{r.rating}/5</span>
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs max-w-xs truncate">{r.comment || "-"}</TableCell>
                        <TableCell className="text-text-secondary text-xs">{r.createdAt ? formatDate(r.createdAt) : "N/A"}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complaints Tab */}
      {activeTab === "complaints" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              Complaints
            </CardTitle>
            <CardDescription>View and manage tenant complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No complaints found</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((c) => {
                        const tenant = tenants.find(t => t.id === c.tenantId);
                        return (
                           <motion.tr
                             key={c.id}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             onClick={() => openComplaint(c)}
                             whileHover={{ scale: 1.005 }}
                             className={`border-b border-border/50 cursor-pointer transition-all ${selectedComplaint?.id === c.id ? "bg-blue-50" : "hover:bg-surface-secondary"}`}
                           >
                            <TableCell className="font-medium">{c.subject}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar src={tenant?.avatarUrl} fallback={(tenant?.name || c.tenantName || c.tenantId || "T").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()} size="sm" />
                                <span className="text-text-secondary">{c.tenantName || c.tenantId}</span>
                              </div>
                            </TableCell>
                             <TableCell>
                               <div className="flex flex-wrap items-center gap-1.5">
                                 <motion.span
                                   whileHover={{ scale: 1.05 }}
                                   className={cn(
                                     "inline-flex whitespace-nowrap items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all",
                                     c.status === "open" && "bg-red-50 text-red-700 border-red-200",
                                     c.status === "in_progress" && "bg-amber-50 text-amber-700 border-amber-200",
                                     c.status === "resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                     c.status === "closed" && "bg-gray-50 text-gray-700 border-gray-200",
                                   )}
                                 >
                                   {c.status}
                                 </motion.span>
                                 {c.tenantReplyText && (
                                   <motion.span whileHover={{ scale: 1.05 }} className="inline-flex whitespace-nowrap items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">Tenant Replied</motion.span>
                                 )}
                               </div>
                             </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="lg:col-span-2">
                  {selectedComplaint ? (
                    <div className="rounded-xl border border-gray-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Avatar src={selectedTenant?.avatarUrl} fallback={(selectedTenant?.name || selectedComplaint.tenantName || selectedComplaint.tenantId || "T").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()} size="md" />
                           <div>
                             <h3 className="text-lg font-semibold text-gray-900">{selectedComplaint.subject}</h3>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">Tenant: {selectedComplaint.tenantName || selectedComplaint.tenantId}</span>
                                <motion.span whileHover={{ scale: 1.05 }} className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all", selectedComplaint.priority === "urgent" && "bg-red-50 text-red-700 border-red-200", selectedComplaint.priority === "high" && "bg-orange-50 text-orange-700 border-orange-200", selectedComplaint.priority === "medium" && "bg-amber-50 text-amber-700 border-amber-200", selectedComplaint.priority === "low" && "bg-gray-50 text-gray-700 border-gray-200")}>{selectedComplaint.priority}</motion.span>
                                <motion.span whileHover={{ scale: 1.05 }} className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all", selectedComplaint.status === "open" && "bg-red-50 text-red-700 border-red-200", selectedComplaint.status === "in_progress" && "bg-amber-50 text-amber-700 border-amber-200", selectedComplaint.status === "resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200", selectedComplaint.status === "closed" && "bg-gray-50 text-gray-700 border-gray-200")}>{selectedComplaint.status.replace("_", " ")}</motion.span>
                                {selectedComplaint.tenantReplyText && (
                                  <motion.span whileHover={{ scale: 1.05 }} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">Tenant Replied</motion.span>
                                )}
                              </div>
                              {selectedTenant && (
                               <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                 <span>{selectedTenant.email}</span>
                                 {selectedTenant.phone && <span>• {selectedTenant.phone}</span>}
                                 {selectedTenant.address && <span>• {selectedTenant.address}</span>}
                               </div>
                             )}
                           </div>
                         </div>
                         {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
                           <Button size="sm" onClick={async () => {
                             try {
                               const updated = await updateComplaintStatus(selectedComplaint.id, "resolved", selectedComplaint.assignedTo || user?.id, selectedComplaint.responseText, user?.name);
                               if (updated) {
                                 setSelectedComplaint(updated);
                                 setComplaints((current) => current.map((item) => item.id === selectedComplaint.id ? updated : item));
                                 toast.success("Complaint marked as resolved");
                               }
                             } catch { toast.error("Failed to update status"); }
                           }}>Mark as Resolved</Button>
                         )}
                         {selectedComplaint.status !== "closed" && (
                           <Button size="sm" variant="outline" onClick={async () => {
                             try {
                               const updated = await updateComplaintStatus(selectedComplaint.id, "closed", selectedComplaint.assignedTo || user?.id, selectedComplaint.responseText, user?.name);
                               if (updated) {
                                 setSelectedComplaint(updated);
                                 setComplaints((current) => current.map((item) => item.id === selectedComplaint.id ? updated : item));
                                 toast.success("Complaint closed");
                               }
                             } catch { toast.error("Failed to close complaint"); }
                           }}>Mark as Closed</Button>
                         )}
                      </div>
                      <div className="mt-4 rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                        <p className="text-xs font-semibold text-gray-500">Original Request</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{selectedComplaint.message}</p>
                      </div>
                      {selectedComplaint.tenantReplyText && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-lg bg-blue-50 p-4 transition-colors hover:bg-blue-100"
                        >
                          <p className="text-xs font-semibold text-blue-700">Tenant Reply</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{selectedComplaint.tenantReplyText}</p>
                        </motion.div>
                      )}
                      {selectedComplaint.responseText && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-lg bg-emerald-50 p-4 transition-colors hover:bg-emerald-100"
                        >
                          <p className="text-xs font-semibold text-emerald-700">Support Response</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{selectedComplaint.responseText}</p>
                        </motion.div>
                      )}
                      <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!complaintReply.trim()) return;
                          setReplying(true);
                          try {
                              const updated = await updateComplaintStatus(selectedComplaint.id, "in_progress", user?.id, complaintReply, user?.name);
                            if (updated) {
                              setSelectedComplaint(updated);
                              setComplaints((current) => current.map((item) => item.id === selectedComplaint.id ? updated : item));
                              setComplaintReply("");
                              toast.success("Support response sent");
                            }
                          } catch { toast.error("Failed to send response"); }
                          finally { setReplying(false); }
                        }}
                      >
                        <textarea value={complaintReply} onChange={(event) => setComplaintReply(event.target.value)} rows={3} placeholder="Write a response to the tenant..." className="w-full rounded-lg border border-gray-200 p-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <Button type="submit" className="mt-2" disabled={replying}>{replying ? "Sending..." : "Send Response"}</Button>
                        </motion.div>
                      </motion.form>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200">
                      <p className="text-sm text-gray-500">Select a complaint to view details and reply</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              Messages
            </CardTitle>
            <CardDescription>Conversations with owners and agents</CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 font-medium">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1">Messages from your conversations will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv, index) => (
                  <motion.div
                    key={conv.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setIsMessagingOpen(true);
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={conv.otherUser?.avatarUrl}
                        fallback={conv.otherUser?.name ? conv.otherUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{conv.otherUser?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {conv.lastMessage?.subject && `${conv.lastMessage.subject} - `}
                          {conv.lastMessage?.body}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {conv.otherUser?.role || "user"}
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-500 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messaging Modal */}
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
        />
      )}

      {/* Demo Accounts Tab */}
      {activeTab === "demo" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <UserPlus className="h-5 w-5 text-gray-600" />
              Quick Demo Login
            </CardTitle>
            <CardDescription>Click a role below to instantly log in as that built-in account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { role: "Property Owner", email: "owner@renttrack.com", password: "owner", icon: Users, color: "bg-blue-600 text-white", description: "Property and unit management", route: "/dashboard/owner" },
                { role: "Property Owner 2", email: "renttrackowner@gmail.com", password: "RentrackOwner", icon: Users, color: "bg-indigo-600 text-white", description: "RentTrack owner account", route: "/dashboard/owner" },
                { role: "Agent", email: "agent@renttrack.com", password: "agent", icon: Users, color: "bg-amber-500 text-white", description: "Tenant and payment management", route: "/dashboard" },
                { role: "Tenant", email: "tenant@renttrack.com", password: "tenant", icon: Users, color: "bg-green-600 text-white", description: "Rental and payment access", route: "/dashboard/tenant" },
              ].map((account, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <Card
                    className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg cursor-pointer"
                    onClick={() => {
                      login(account.email, account.password).then((success) => {
                        if (success) {
                          window.location.href = account.route;
                        }
                      });
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg ${account.color}`}>
                        <account.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{account.role}</h3>
                      <p className="text-xs text-gray-500 mb-4">{account.description}</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                          Login as {account.role}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Activity Tab */}
      {activeTab === "activity" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="h-5 w-5 text-gray-600" />
              System Activity
            </CardTitle>
            <CardDescription>Real-time system events and user activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No recent activity</p>
              ) : (
                notifications.slice(0, 20).map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        n.type === "payment" && "bg-green-50 text-green-600",
                        n.type === "tenant" && "bg-blue-50 text-blue-600",
                        n.type === "property" && "bg-amber-50 text-amber-600",
                        n.type === "system" && "bg-purple-50 text-purple-600",
                      )}>
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-200">{n.type}</Badge>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Audit Logs
              </div>
            </CardTitle>
            <CardDescription>System activity and user action logs</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No audit logs found</p>
                <p className="text-gray-400 mt-2">All system activities are logged and monitored</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, i) => (
                  <motion.div
                    key={`audit-${log.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-500">
                          {log.actor} • {formatDateTime(log.createdAt)}
                          {log.ipAddress && log.ipAddress !== "system" && ` • IP: ${log.ipAddress}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {String(log.details?.source || "audit")}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Tab */}
      {activeTab === "diagnosis" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Stethoscope className="h-5 w-5 text-gray-600" />
              System Diagnosis
            </CardTitle>
            <CardDescription>Run diagnostics to check system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "database", label: "Database Connection" },
                { key: "apiServer", label: "API Server" },
                { key: "authentication", label: "Authentication Service" },
                { key: "fileStorage", label: "File Storage" },
              ].map((item, i) => {
                const status = diagnosisResults?.[item.key] ?? "pending";
                const isHealthy = status === "healthy";
                const isUnhealthy = status === "unhealthy";
                const isLoading = status === "pending" && isRunningDiagnosis;

                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isHealthy ? "bg-green-50 text-green-600" :
                        isUnhealthy ? "bg-red-50 text-red-600" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : isHealthy ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isUnhealthy ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg capitalize ${
                      isHealthy ? "text-green-600 bg-green-50" :
                      isUnhealthy ? "text-red-600 bg-red-50" :
                      isLoading ? "text-gray-500 bg-gray-100" : "text-gray-400 bg-gray-50"
                    }`}>
                      {isLoading ? "Checking..." : status}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={async () => {
                  setIsRunningDiagnosis(true);
                  setDiagnosisResults({
                    database: "pending",
                    apiServer: "pending",
                    authentication: "pending",
                    fileStorage: "pending",
                  });
                  try {
                    const res = await fetch("/api/health");
                    const data = await res.json();
                    if (res.ok && data.success && data.checks) {
                      setDiagnosisResults(data.checks);
                      toast.success("Diagnostics completed - All systems healthy");
                    } else {
                      setDiagnosisResults(data.checks || {
                        database: "unhealthy",
                        apiServer: "healthy",
                        authentication: "unknown",
                        fileStorage: "unknown",
                      });
                      toast.error("Diagnostics completed - Some systems are unhealthy");
                    }
                  } catch {
                    setDiagnosisResults({
                      database: "unhealthy",
                      apiServer: "healthy",
                      authentication: "unknown",
                      fileStorage: "unknown",
                    });
                    toast.error("Diagnostics failed - Unable to connect to server");
                  } finally {
                    setIsRunningDiagnosis(false);
                  }
                }}
                disabled={isRunningDiagnosis}
                className="w-full mt-4"
              >
                {isRunningDiagnosis ? (
                  <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Running Diagnostics...</>
                ) : (
                  <><Stethoscope className="h-4 w-4 mr-1.5" />Run Diagnostics</>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      )}

      {/* System Health Tab */}
      {activeTab === "health" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Heart className="h-5 w-5 text-gray-600" />
              System Health Monitoring
            </CardTitle>
            <CardDescription>Real-time system status and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Database", status: healthData?.checks?.database ?? "Loading..." },
                { label: "API Status", status: healthData?.checks?.apiServer ?? "Loading..." },
                { label: "Active Users", status: users.length.toString() },
                { label: "Properties", status: properties.length.toString() },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-base font-semibold px-2 py-1 rounded-lg inline-block capitalize ${
                    item.status === "healthy" ? "text-green-600 bg-green-50" :
                    item.status === "unhealthy" ? "text-red-600 bg-red-50" :
                    "text-gray-500 bg-gray-100"
                  }`}>{item.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Tab */}
      {activeTab === "maintenance" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Wrench className="h-5 w-5 text-gray-600" />
              System Maintenance
            </CardTitle>
            <CardDescription>Perform maintenance tasks and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: "clearCache", label: "Clear Cache", icon: Gauge, action: async () => {
                  setMaintenanceLoading(prev => ({ ...prev, clearCache: true }));
                  try {
                    const res = await fetch("/api/admin/maintenance/clear-cache", { method: "POST", credentials: "include" });
                    const data = await res.json();
                    if (data.success) toast.success("Cache cleared successfully"); else toast.error(data.error || "Failed to clear cache");
                  } catch { toast.error("Failed to clear cache"); }
                  setMaintenanceLoading(prev => ({ ...prev, clearCache: false }));
                }},
                { key: "optimizeDb", label: "Optimize Database", icon: Server, action: async () => {
                  setMaintenanceLoading(prev => ({ ...prev, optimizeDb: true }));
                  try {
                    const res = await fetch("/api/admin/maintenance/optimize-database", { method: "POST", credentials: "include" });
                    const data = await res.json();
                    if (data.success) toast.success("Database optimized successfully"); else toast.error(data.error || "Failed to optimize database");
                  } catch { toast.error("Failed to optimize database"); }
                  setMaintenanceLoading(prev => ({ ...prev, optimizeDb: false }));
                }},
                { key: "backup", label: "Create Backup", icon: Download, action: async () => {
                  setMaintenanceLoading(prev => ({ ...prev, backup: true }));
                  try {
                    const res = await fetch("/api/admin/maintenance/backup", { method: "POST", credentials: "include" });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `renttrack_backup_${new Date().toISOString().split("T")[0]}.sql`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast.success("Backup downloaded successfully");
                    } else {
                      toast.error("Failed to create backup");
                    }
                  } catch { toast.error("Failed to create backup"); }
                  setMaintenanceLoading(prev => ({ ...prev, backup: false }));
                }},
                { key: "maintenanceMode", label: maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode", icon: Wrench, action: async () => {
                  setMaintenanceLoading(prev => ({ ...prev, maintenanceMode: true }));
                  try {
                    const res = await fetch("/api/admin/maintenance/mode", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ enabled: !maintenanceMode }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setMaintenanceMode(data.enabled);
                      toast.success(`Maintenance mode ${data.enabled ? "enabled" : "disabled"}`);
                    } else {
                      toast.error(data.error || "Failed to toggle maintenance mode");
                    }
                  } catch { toast.error("Failed to toggle maintenance mode"); }
                  setMaintenanceLoading(prev => ({ ...prev, maintenanceMode: false }));
                }},
              ].map((item, i) => (
                <motion.button
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={item.action}
                  disabled={maintenanceLoading[item.key]}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <motion.div
                    className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {maintenanceLoading[item.key] ? (
                      <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                    ) : (
                      <item.icon className="h-6 w-6 text-gray-600" />
                    )}
                  </motion.div>
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tab */}
      {activeTab === "configuration" && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Sliders className="h-5 w-5 text-gray-600" />
              System Configuration
            </CardTitle>
            <CardDescription>Manage system settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: "system_name", label: "System Name", description: "Application display name", type: "text" as const },
                { key: "max_users", label: "Max Users", description: "Maximum concurrent users", type: "text" as const },
                { key: "session_timeout", label: "Session Timeout", description: "Auto-logout duration", type: "text" as const },
                { key: "email_notifications", label: "Email Notifications", description: "System email alerts", type: "toggle" as const },
              ].map((config, i) => {
                const isEditing = editingConfig === config.key;
                const rawValue = systemConfig[config.key];
                const isEmailEnabled = config.key === "email_notifications" ? (rawValue ?? "Enabled") !== "Disabled" : false;
                const value = config.key === "email_notifications" ? (isEmailEnabled ? "Enabled" : "Disabled") : (rawValue ?? "");

                return (
                  <div key={config.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEditing && config.type === "text" ? (
                        <>
                          <Input
                            value={configDraft}
                            onChange={(e) => setConfigDraft(e.target.value)}
                            className="h-8 w-40 text-sm border-gray-200"
                            autoFocus
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await saveConfig(config.key, configDraft);
                                setEditingConfig(null);
                              } else if (e.key === "Escape") {
                                setEditingConfig(null);
                              }
                            }}
                          />
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" onClick={async () => { await saveConfig(config.key, configDraft); setEditingConfig(null); }}>Save</Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" variant="ghost" onClick={() => setEditingConfig(null)}>Cancel</Button>
                          </motion.div>
                        </>
                      ) : config.type === "toggle" ? (
                        <button
                          onClick={async () => {
                            const newValue = !isEmailEnabled ? "Enabled" : "Disabled";
                            try {
                              const res = await fetch("/api/admin/config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ [config.key]: newValue }),
                              });
                              const data = await res.json();
                              if (data.success && data.config) {
                                setSystemConfig(data.config);
                                toast.success(`Email notifications ${newValue === "Enabled" ? "enabled" : "disabled"}`);
                              } else {
                                toast.error(data.error || "Failed to update config");
                              }
                            } catch {
                              toast.error("Failed to update config");
                            }
                          }}
                          className="relative inline-flex h-6 w-11 items-center rounded-full border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                          style={{ backgroundColor: isEmailEnabled ? "#22c55e" : "#e5e7eb" }}
                        >
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" style={{ transform: isEmailEnabled ? "translateX(20px)" : "translateX(2px)" }} />
                        </button>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-gray-900">{value}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" variant="outline" className="border-gray-200" onClick={() => { setEditingConfig(config.key); setConfigDraft(value); }}>Edit</Button>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-10 rounded-xl border-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-10 rounded-xl border-gray-200" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingPassword && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setResettingPassword(null); setNewPassword(""); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <button onClick={() => { setResettingPassword(null); setNewPassword(""); }} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Set a new password for <strong>{resettingPassword.name}</strong> ({resettingPassword.email})</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="h-10 rounded-xl border-gray-200" />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setResettingPassword(null); setNewPassword(""); }}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 8}>Reset Password</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <CreateTenantModal
          isOpen={showCreateTenant}
          onClose={() => setShowCreateTenant(false)}
          onSubmit={async (formData) => {
            await handleCreateTenant(formData);
          }}
          submitting={isCreatingTenant}
        />
      )}
    </motion.div>
  );
}
