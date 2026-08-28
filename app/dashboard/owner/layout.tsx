"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Home, ClipboardCheck, FileText,
  CreditCard, BarChart3, FileSpreadsheet, LogOut, ChevronRight, Menu, X,
  Loader2, MessageSquare, ChevronDown, ChevronLeft, Users, User, Bell, UserPlus,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadMessageCount, Notification } from "@/lib/data";
import { getTenants } from "@/lib/data";
import Link from "next/link";
import MessagingPanel from "@/components/messaging-panel";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { label: "Overview", tab: "overview", href: "/dashboard/owner#overview", icon: LayoutDashboard },
  { label: "Property", tab: "properties", href: "/dashboard/owner#properties", icon: Home },
  { label: "Rental Units", tab: "units", href: "/dashboard/owner#units", icon: ClipboardCheck },
  { label: "Occupancy", tab: "occupancy", href: "/dashboard/owner#occupancy", icon: Home },
  { label: "Agents", tab: "agents", href: "/dashboard/owner#agents", icon: Users },
  { label: "Create Tenant", tab: "create-tenant", href: "#", icon: UserPlus, isAction: true },
  { label: "Payments", tab: "payments", href: "/dashboard/owner#payments", icon: CreditCard },
  { label: "Pending Approvals", tab: "assignments", href: "/dashboard/owner#assignments", icon: FileText },
  { label: "Receipts & Reports", tab: "reports", href: "/dashboard/owner#reports", icon: BarChart3 },
];

function getTabFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash && navItems.some((item) => item.tab === hash)) return hash;
  return "overview";
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", email: "", phone: "", address: "", propertyName: "", unitNumber: "", rentAmount: "", contractStart: "", contractEnd: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      getUnreadMessageCount().then(setUnreadMessageCount).catch(() => setUnreadMessageCount(0));
      getTenants(user).then((tenants) => {
        const pending = tenants.filter((t: any) => t.assignmentStatus === "pending" && t.unitId).length;
        setPendingAssignmentsCount(pending);
      }).catch(() => setPendingAssignmentsCount(0));
    }
  }, [user]);

  useEffect(() => {
    const refreshPending = () => {
      if (user) getTenants(user).then((tenants) => setPendingAssignmentsCount(tenants.filter((tenant: any) => tenant.assignmentStatus === "pending" && tenant.unitId).length)).catch(() => {});
    };
    window.addEventListener("owner-data-changed", refreshPending);
    return () => window.removeEventListener("owner-data-changed", refreshPending);
  }, [user]);

  const handleNotificationClick = async (id: string) => {
    setShowNotifications(false);
    try {
      await markNotificationRead(id);
      getNotifications(user?.id).then(setNotifications).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    if (!showNotifications && user) {
      try {
        await markAllNotificationsRead(user.id);
        getNotifications(user.id).then(setNotifications).catch(() => {});
      } catch {
        // ignore
      }
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.email || !newTenant.password || !newTenant.propertyName || !newTenant.unitNumber) {
      toast.error("Name, email, password, property, and unit are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTenant.name, email: newTenant.email, phone: newTenant.phone, address: newTenant.address, password: newTenant.password, role: "tenant" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetch("/api/data/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: newTenant.name, email: newTenant.email, phone: newTenant.phone, address: newTenant.address, propertyName: newTenant.propertyName, unitNumber: newTenant.unitNumber, rentAmount: Number(newTenant.rentAmount) || 0, contractStart: newTenant.contractStart || undefined, contractEnd: newTenant.contractEnd || undefined, assignmentStatus: "confirmed" }) });
        toast.success("Tenant account created successfully!");
        setNewTenant({ name: "", email: "", phone: "", address: "", propertyName: "", unitNumber: "", rentAmount: "", contractStart: "", contractEnd: "", password: "" });
        setShowCreateTenant(false);
      } else {
        toast.error(data.error || "Failed to create tenant account");
      }
    } catch {
      toast.error("Failed to create tenant account");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && navItems.some((item) => item.tab === hash)) {
        setActiveTab(hash);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    const activeButton = document.getElementById(`sidebar-${activeTab}`);
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeTab]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && navItems.some((item) => item.tab === hash)) {
      setActiveTab(hash);
    } else if (pathname === "/dashboard/owner/agents") {
      setActiveTab("agents");
    }
  }, [pathname]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-900 font-medium text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex-1">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-surface-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-sm">Owner Panel</span>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => handleOpenNotifications()} className="p-2 rounded-lg hover:bg-surface-secondary relative">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <AnimatePresence initial={false}>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-surface shadow-dropdown overflow-hidden z-[70]"
                >
                  <div className="p-3 border-b border-slate-700">
                    <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-text-secondary">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id)}
                          className="w-full text-left p-3 border-b border-slate-700 last:border-0 hover:bg-surface-secondary transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-lg hover:bg-surface-secondary text-red-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={cn("hidden lg:flex flex-col border-r border-border bg-white text-gray-900 transition-all h-full", sidebarOpen ? "w-56" : "w-16")}>
          <div className="p-4 border-b border-border">
            <Link href="/dashboard/owner" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden">
                <img src="/images/landing/logo.png" alt="RentTrack" className="h-full w-full object-contain" />
              </div>
              {sidebarOpen && <span className="font-bold text-foreground text-sm">Owner Panel</span>}
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab || item.href}
                  id={`sidebar-${item.tab}`}
                  onClick={() => {
                    if (item.isAction) { setShowCreateTenant(true); return; }
                    if (window.location.pathname !== "/dashboard/owner") {
                      router.push(`/dashboard/owner#${item.tab}`);
                    } else {
                      window.location.hash = item.tab;
                    }
                  }}
                  className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {item.tab === "assignments" && pendingAssignmentsCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {pendingAssignmentsCount}
                    </span>
                  )}
                  {isActive && sidebarOpen && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary-600" />}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">Logout</span>}
            </button>
          </div>
          </div>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ duration: 0.2 }}
                className="w-64 h-full bg-surface border-r border-slate-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <Link href="/dashboard/owner" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                      <LayoutDashboard className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-foreground text-sm">Owner Panel</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-surface-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab || item.href}
                        id={`sidebar-${item.tab}`}
                        onClick={() => {
                          if (item.isAction) { setShowCreateTenant(true); setSidebarOpen(false); return; }
                          if (window.location.pathname !== "/dashboard/owner") {
                            router.push(`/dashboard/owner#${item.tab}`);
                          } else {
                            window.location.hash = item.tab;
                          }
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium transition-all",
                          isActive
                            ? "bg-primary-100 text-primary-800"
                            : "text-text-secondary hover:bg-surface-secondary hover:text-foreground"
                        )}
                      >
                         <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-600" : "text-text-tertiary")} />
                         <span className="truncate">{item.label}</span>
                         {item.tab === "assignments" && pendingAssignmentsCount > 0 && (
                           <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                             {pendingAssignmentsCount}
                           </span>
                         )}
                       </button>
                    );
                  })}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop header */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-slate-700 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <img src="/images/landing/logo.png" alt="RentTrack" className="h-8 w-8 rounded-full object-contain" />
                <span className="font-bold text-foreground hidden sm:block">Rent<span className="text-primary-500">Track</span></span>
              </Link>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <AnimatePresence initial={false}>
                  {showMessages && (
                    <MessagingPanel
                      isOpen={showMessages}
                      onClose={() => setShowMessages(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="relative z-[60]">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenNotifications(); }}
                  className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-foreground"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-surface shadow-dropdown overflow-hidden z-[70]"
                    >
                      <div className="p-4 border-b border-slate-700">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-text-secondary">No notifications yet</p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n.id)}
                              className="w-full text-left p-4 border-b border-slate-700 last:border-0 hover:bg-surface-secondary transition-colors"
                            >
                              <p className="text-sm font-medium text-foreground">{n.title}</p>
                              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-secondary transition-all"
                >
                  <Avatar src={user.avatarUrl} fallback={getInitials(user.name)} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-foreground">{user.name?.split(' ')[0] || "Owner"}</span>
                  <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-surface shadow-dropdown overflow-hidden"
                    >
                       <div className="p-3 border-b border-slate-700">
                         <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                         <p className="text-xs text-text-secondary truncate">{user.email}</p>
                       </div>
                       <div className="p-2 space-y-0.5">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setActiveTab("profile");
                              window.location.hash = "profile";
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-foreground transition-colors"
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </button>
                         </div>
                     </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile main content */}
        <main className="lg:hidden flex-1 overflow-y-auto">
          <div className="w-full p-4">
            {children}
          </div>
        </main>

        {showLogoutModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutModal(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                  {logoutLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <LogOut className="h-7 w-7" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{logoutLoading ? "Logging out..." : "Log Out"}</h3>
                <p className="text-sm text-gray-500 mb-6">{logoutLoading ? "Please wait while we securely log you out." : "Are you sure you want to log out of your account?"}</p>
                <div className="flex w-full gap-3">
                  <button onClick={() => setShowLogoutModal(false)} disabled={logoutLoading} className="flex-1 px-4 py-2 rounded-xl border border-slate-700 hover:bg-surface-secondary transition-colors disabled:opacity-50">Cancel</button>
                  <button onClick={handleLogout} disabled={logoutLoading} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">{logoutLoading ? "Logging out..." : "Log Out"}</button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
        {showCreateTenant && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateTenant(false)} />
            <div className="relative flex max-h-[88vh] w-full max-w-sm flex-col rounded-md border border-slate-700 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 p-4">
                <div><h3 className="text-base font-semibold text-foreground">Create Tenant</h3><p className="text-xs text-text-secondary">Add tenant, rental, and account information</p></div>
                <button onClick={() => setShowCreateTenant(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateTenant} className="space-y-3 overflow-y-auto p-4">
                <h4 className="text-sm font-semibold text-blue-600">Tenant Information</h4>
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
                <div><label className="block text-sm font-medium text-foreground mb-1.5">Address</label><Input value={newTenant.address} onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })} placeholder="Tenant address" /></div>
                <div className="space-y-2 border-t border-slate-700 pt-3"><h4 className="text-sm font-semibold text-blue-600">Rental Information</h4><Input value={newTenant.propertyName} onChange={(e) => setNewTenant({ ...newTenant, propertyName: e.target.value })} placeholder="Property name" required /><Input value={newTenant.unitNumber} onChange={(e) => setNewTenant({ ...newTenant, unitNumber: e.target.value })} placeholder="Rental unit / room" required /><Input type="number" value={newTenant.rentAmount} onChange={(e) => setNewTenant({ ...newTenant, rentAmount: e.target.value })} placeholder="Monthly rent" /><div className="grid grid-cols-2 gap-2"><Input type="date" value={newTenant.contractStart} onChange={(e) => setNewTenant({ ...newTenant, contractStart: e.target.value })} /><Input type="date" value={newTenant.contractEnd} onChange={(e) => setNewTenant({ ...newTenant, contractEnd: e.target.value })} /></div></div>
                <div className="border-t border-slate-700 pt-3"><h4 className="text-sm font-semibold text-blue-600">Account Information</h4>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
                  <Input type="password" value={newTenant.password} onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })} placeholder="Min. 8 characters" required />
                </div></div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
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
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
