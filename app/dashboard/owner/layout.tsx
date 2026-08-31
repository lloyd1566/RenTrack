"use client";

import { useState, useEffect, useCallback } from "react";
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
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount, getUnreadMessageCount, getPendingPaymentsCount, Notification } from "@/lib/data";
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
  { label: "Create Tenant", tab: "create-tenant", href: "/dashboard/owner#create-tenant", icon: UserPlus },
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
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const refreshNotificationsCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount(user.id);
      setUnreadNotificationsCount(count);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      getUnreadMessageCount().then(setUnreadMessageCount).catch(() => setUnreadMessageCount(0));
      getTenants(user).then((tenants) => {
        const pending = tenants.filter((t: any) => t.assignmentStatus === "pending" && t.unitId).length;
        setPendingAssignmentsCount(pending);
      }).catch(() => setPendingAssignmentsCount(0));
      getPendingPaymentsCount().then(setPendingPaymentsCount).catch(() => setPendingPaymentsCount(0));
      refreshNotificationsCount();
    }
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        getNotifications(user.id).then(setNotifications).catch(() => {});
        getUnreadMessageCount().then(setUnreadMessageCount).catch(() => {});
        getTenants(user).then((tenants) => {
          const pending = tenants.filter((t: any) => t.assignmentStatus === "pending" && t.unitId).length;
          setPendingAssignmentsCount(pending);
        }).catch(() => {});
        getPendingPaymentsCount().then(setPendingPaymentsCount).catch(() => {});
        refreshNotificationsCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    const refreshPending = () => {
      if (user) getTenants(user).then((tenants) => setPendingAssignmentsCount(tenants.filter((tenant: any) => tenant.assignmentStatus === "pending" && tenant.unitId).length)).catch(() => {});
    };
    window.addEventListener("owner-data-changed", refreshPending);
    return () => window.removeEventListener("owner-data-changed", refreshPending);
  }, [user]);

  useEffect(() => {
    const refreshProfile = () => {
      if (user) getTenants(user).then((tenants) => setPendingAssignmentsCount(tenants.filter((tenant: any) => tenant.assignmentStatus === "pending" && tenant.unitId).length)).catch(() => {});
    };
    window.addEventListener("renttrack-profile-updated", refreshProfile);
    return () => window.removeEventListener("renttrack-profile-updated", refreshProfile);
  }, [user]);

  useEffect(() => {
    const refreshPayments = () => {
      if (user) getPendingPaymentsCount().then(setPendingPaymentsCount).catch(() => setPendingPaymentsCount(0));
    };
    window.addEventListener("payment-confirmed", refreshPayments);
    return () => window.removeEventListener("payment-confirmed", refreshPayments);
  }, [user]);

  const handleNotificationClick = async (id: string) => {
    setShowNotifications(false);
    try {
      await markNotificationRead(id);
      getNotifications(user?.id).then(setNotifications).catch(() => {});
      refreshNotificationsCount();
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
        const updated = await getNotifications(user.id);
        setNotifications(updated);
        const count = await getUnreadCount(user.id);
        console.log("[OwnerLayout] Refreshed notification count:", count);
        setUnreadNotificationsCount(count);
      } catch (err) {
        console.error("[OwnerLayout] Failed to refresh notifications:", err);
      }
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
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-md"
                    >
                      {pendingAssignmentsCount}
                    </motion.span>
                  )}
                  {item.tab === "payments" && pendingPaymentsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md"
                    >
                      {pendingPaymentsCount}
                    </motion.span>
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
                  <AnimatePresence mode="popLayout">
                    {unreadNotificationsCount > 0 && (
                      <motion.span
                        key="notification-badge"
                        initial={{ scale: 0, y: -4 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: -4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
                      >
                        {unreadNotificationsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
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
       </div>
     </div>
   );
 }
