"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Settings, Activity, FileText, Stethoscope,
  Heart, Wrench, CheckCircle2, XCircle, Search, Eye, Trash2,
  UserPlus, RefreshCw, Download, Server, Gauge, Sliders,
  Bell, Home, Building2, CreditCard, Star, MessageSquare, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getUsers, getProperties, getUnits, getTenants, getNotifications,
  getPayments, getComplaints, getAllRatings, getAuditLogs,
  UserRecord, Property, Unit, TenantRecord, Notification, Payment, Complaint, Rating, AuditLog,
  deleteUser, updateUserRole,
  getConversations,
} from "@/lib/data";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import MessagingModal from "@/components/messaging-modal";

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

  const systemStats = useMemo(() => [
    { label: "Total Users", value: users.length, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Properties", value: properties.length, icon: Building2, color: "from-emerald-500 to-emerald-600" },
    { label: "Units", value: units.length, icon: Home, color: "from-purple-500 to-purple-600" },
    { label: "Tenants", value: tenants.length, icon: UserPlus, color: "from-amber-500 to-amber-600" },
    { label: "Payments", value: payments.length, icon: CreditCard, color: "from-green-500 to-green-600" },
    { label: "Notifications", value: notifications.length, icon: Bell, color: "from-pink-500 to-pink-600" },
  ], [users.length, properties.length, units.length, tenants.length, payments.length, notifications.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gray-900 p-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-2 border border-white/10"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Administrator Portal
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-bold text-white tracking-tight"
                >
                  System Administration
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-white/60 text-xs sm:text-sm mt-1"
                >
                  Monitor system health, manage users, and maintain platform integrity
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all duration-200 hover:scale-105" onClick={loadData} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {systemStats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{stat.label}</span>
                      <motion.div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-lg`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <stat.icon className="h-4 w-4" />
                      </motion.div>
                    </div>
                    <motion.div
                      className="text-xl font-bold text-gray-900"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                    >
                      {stat.value}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

            {/* Recent Activity */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-900">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Activity className="h-5 w-5 text-gray-600" />
                      </motion.div>
                      Recent System Activity
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadData()}
                      disabled={isRefreshing || isRunningDiagnosis}
                    >
                      <RefreshCw className={`h-4 w-4 ${(isRefreshing || isRunningDiagnosis) ? "animate-spin" : ""}`} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 && auditLogs.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-6 text-gray-500"
                    >
                      No recent activity
                    </motion.p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 4).map((n, i) => (
                        <motion.div
                          key={`notif-${n.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          whileHover={{ x: 4, backgroundColor: "rgb(249, 250, 251)" }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg",
                              n.type === "payment" && "bg-green-50 text-green-600",
                              n.type === "tenant" && "bg-blue-50 text-blue-600",
                              n.type === "property" && "bg-amber-50 text-amber-600",
                              n.type === "system" && "bg-purple-50 text-purple-600",
                              n.type === "id_verification" && "bg-orange-50 text-orange-600",
                            )}>
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-gray-200 capitalize">{n.type}</Badge>
                        </motion.div>
                      ))}
                      {auditLogs.slice(0, 4).map((log, i) => (
                        <motion.div
                          key={`audit-${log.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (i + notifications.length) * 0.05, duration: 0.2 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border-l-4 border-indigo-400"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.action}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {log.actor} • {formatDate(log.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-gray-200">audit</Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
        </>
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
                        whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
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
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                          u.role === "admin" && "bg-purple-50 text-purple-600",
                          u.role === "owner" && "bg-blue-50 text-blue-600",
                          u.role === "agent" && "bg-amber-50 text-amber-600",
                          u.role === "tenant" && "bg-green-50 text-green-600",
                        )}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-text-secondary text-xs">{u.createdAt ? formatDate(u.createdAt) : "N/A"}</TableCell>
                       <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                            </motion.div>
                          </div>
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
                      <TableHead>Unit</TableHead>
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
                        <TableCell className="text-text-secondary">{u.propertyId}</TableCell>
                        <TableCell>{u.floor ?? "-"}</TableCell>
                        <TableCell>${Number(u.rentAmount || 0).toFixed(2)}</TableCell>
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
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <UserPlus className="h-5 w-5 text-gray-600" />
              Tenants
            </CardTitle>
            <CardDescription>Manage tenant accounts and assignments</CardDescription>
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
                      <TableHead>Unit</TableHead>
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
                      <TableHead>Unit</TableHead>
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
                        <TableCell>${Number(p.amountPaid || 0).toFixed(2)}</TableCell>
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
                        <TableCell className="font-medium">{r.user_name || r.user_id}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            r.target_type === "property" && "bg-blue-50 text-blue-600",
                            r.target_type === "unit" && "bg-purple-50 text-purple-600",
                          )}>
                            {r.target_type} ({r.target_id})
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-amber-600 font-medium">{r.rating}/5</span>
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs max-w-xs truncate">{r.comment || "-"}</TableCell>
                        <TableCell className="text-text-secondary text-xs">{r.created_at ? formatDate(r.created_at) : "N/A"}</TableCell>
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
              <MessageSquare className="h-5 w-5 text-gray-600" />
              Complaints
            </CardTitle>
            <CardDescription>View and manage tenant complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No complaints found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((c, i) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="border-b border-border/50 hover:bg-surface-secondary"
                      >
                        <TableCell className="font-medium">{c.subject}</TableCell>
                        <TableCell className="text-text-secondary">{c.tenant_name || c.tenant_id}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            c.priority === "urgent" && "bg-red-50 text-red-600",
                            c.priority === "high" && "bg-orange-50 text-orange-600",
                            c.priority === "medium" && "bg-amber-50 text-amber-600",
                            c.priority === "low" && "bg-gray-50 text-gray-600",
                          )}>
                            {c.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                            c.status === "open" && "bg-red-50 text-red-600",
                            c.status === "in_progress" && "bg-amber-50 text-amber-600",
                            c.status === "resolved" && "bg-green-50 text-green-600",
                            c.status === "closed" && "bg-gray-50 text-gray-600",
                          )}>
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs">{c.created_at ? formatDate(c.created_at) : "N/A"}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
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
              <MessageSquare className="h-5 w-5 text-gray-600" />
              Messages
            </CardTitle>
            <CardDescription>Conversations with owners and agents</CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
            id: selectedConversation.userId,
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => loadData()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
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
                          {log.actor} • {formatDate(log.createdAt)}
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
    </motion.div>
  );
}
