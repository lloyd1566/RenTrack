"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, Notification } from "@/lib/data";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Building2;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "owner", "agent", "tenant"] },
  { label: "Properties", href: "/dashboard/properties", icon: Building2, roles: ["admin", "owner", "agent"] },
  { label: "Units", href: "/dashboard/units", icon: Home, roles: ["admin", "owner", "agent"] },
  { label: "Tenants", href: "/dashboard/tenants", icon: Users, roles: ["admin", "owner", "agent"] },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: ["admin", "owner", "agent", "tenant"] },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["admin", "owner"] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin", "owner", "agent", "tenant"] },
];

const roleBadgeColor: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
  owner: "bg-primary-500/10 text-primary-600 border-primary-200 dark:border-primary-800",
  agent: "bg-secondary-500/10 text-secondary-600 border-secondary-200 dark:border-secondary-800",
  tenant: "bg-accent-500/10 text-accent-600 border-accent-200 dark:border-accent-800",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?mode=signin");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications);
    }
  }, [user]);

  useEffect(() => {
    const isDark = localStorage.getItem("renttrack_dark") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("renttrack_dark", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300 ease-[cubic-bezier(0.21,0.47,0.32,0.98)]",
          "lg:block",
          mobileSidebarOpen ? "block translate-x-0" : "hidden lg:block",
          sidebarOpen ? "w-[260px]" : "w-[72px]"
        )}
        style={{ transform: mobileSidebarOpen ? 'translateX(0)' : undefined }}
      >
<div className={cn("flex items-center h-16 px-4 border-b border-border", sidebarOpen ? "justify-between" : "justify-center")}>
          {sidebarOpen ? (
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/favicon/logo.png" alt="RentTrack" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-bold text-foreground">Rent<span className="text-primary-500">Track</span></span>
            </Link>
          ) : (
            <img src="/images/favicon/logo.png" alt="RT" className="h-8 w-8 rounded-lg object-contain" />
          )}
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-surface-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-text-secondary hover:text-foreground hover:bg-surface-tertiary"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("p-3 border-t border-border", sidebarOpen ? "" : "flex flex-col items-center")}>
          <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-surface-secondary", sidebarOpen ? "" : "flex-col")}>
            <Avatar
              fallback={user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              size="sm"
            />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <Badge variant="outline" className={cn("mt-0.5 text-[10px] font-medium capitalize px-1.5 py-0", roleBadgeColor[user.role])}>
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 rounded-lg hover:bg-surface-secondary transition-colors">
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {navItems.find((item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href)))?.label || "Overview"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-foreground">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-dropdown overflow-hidden"
                  >
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-secondary">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              getNotifications(user.id).then(setNotifications);
                            }}
                            className={cn(
                              "w-full text-left p-4 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors",
                              !n.read && "bg-primary-50/50 dark:bg-primary-900/10"
                            )}
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                                n.type === "payment" && "bg-green-50 text-green-600",
                                n.type === "tenant" && "bg-blue-50 text-blue-600",
                                n.type === "property" && "bg-amber-50 text-amber-600",
                                n.type === "system" && "bg-purple-50 text-purple-600",
                              )}>
                                {n.type === "payment" && <CreditCard className="h-4 w-4" />}
                                {n.type === "tenant" && <Users className="h-4 w-4" />}
                                {n.type === "property" && <Building2 className="h-4 w-4" />}
                                {n.type === "system" && <Settings className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-text-tertiary mt-1">
                                  {new Date(n.createdAt).toLocaleDateString("en-PH", {
                                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              {!n.read && <div className="h-2 w-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            markAllNotificationsRead(user.id);
                            getNotifications(user.id).then(setNotifications);
                          }}
                        >
                          Mark all as read
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => { logout(); router.push("/"); }}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-text-secondary hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
