"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, LogOut, X, ChevronLeft, ChevronRight, Menu, LayoutDashboard, Users, Building2, CreditCard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, Notification } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard/agent", icon: LayoutDashboard },
  { label: "Tenants", href: "/dashboard/agent/tenants", icon: Users },
  { label: "Properties", href: "/dashboard/agent/properties", icon: Building2 },
  { label: "Payments", href: "/dashboard/agent/payments", icon: CreditCard },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
      <AnimatePresence initial={false}>
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
              <img src="/images/landing/logo.png" alt="RentTrack" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-bold text-foreground">Rent<span className="text-primary-500">Track</span></span>
            </Link>
          ) : (
            <img src="/images/landing/logo.png" alt="RT" className="h-8 w-8 rounded-lg object-contain" />
          )}
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-surface-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard/agent" && pathname.startsWith(item.href));
            const IconComponent = item.icon;
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
                <IconComponent className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
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
                <Badge variant="outline" className="mt-0.5 text-[10px] font-medium capitalize px-1.5 py-0 bg-secondary-500/10 text-secondary-600 border-secondary-200">
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setSidebarLoading(true);
                setTimeout(() => {
                  setSidebarOpen(!sidebarOpen);
                  setSidebarLoading(false);
                }, 200);
              }}
              className="hidden lg:block p-2 rounded-lg hover:bg-surface-secondary transition-colors relative"
            >
              {sidebarLoading ? (
                <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {(() => {
                const activeItem = navItems.find((item) => item.href === pathname || (item.href !== "/dashboard/agent" && pathname.startsWith(item.href)));
                return activeItem ? activeItem.label : "Dashboard";
              })()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-secondary transition-all"
            >
              <Avatar fallback={user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
              <span className="hidden sm:block text-sm font-medium text-foreground">{user.name.split(' ')[0]}</span>
              <ChevronDown className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface shadow-dropdown overflow-hidden"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
                  <LogOut className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Log Out</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex w-full gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setShowLogoutModal(false); logout(); router.push("/"); }}>Log Out</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
