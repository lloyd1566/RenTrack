"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadMessageCount, Notification } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/admin-sidebar";
import Link from "next/link";
import { ChevronDown, LogOut, Bell, User, Pencil } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      getUnreadMessageCount().then(setUnreadMessageCount).catch(() => setUnreadMessageCount(0));
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (id: string) => {
    setShowNotifications(false);
    try {
      await markNotificationRead(id);
      const updated = await getNotifications(user?.id);
      setNotifications(updated);
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
      } catch {
        // ignore
      }
    }
  };

  const navigateTo = (tab: string) => {
    router.push(`/dashboard/admin?tab=${tab}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const initials = user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar - fixed on all screens */}
      <AdminSidebar />

      {/* Main Area - offset for fixed sidebar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col lg:ml-[220px] w-full min-h-screen"
        >
          {/* Top Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6"
          >
          {/* Left side - empty or breadcrumb */}
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">Admin Console</h2>
          </div>

          {/* Right side - Notifications + User dropdown */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence initial={false}>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 w-80 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50"
                  >
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n.id)}
                              className="w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Avatar src={user.avatarUrl} fallback={initials} size="sm" />
                <div className="min-w-0 text-left hidden sm:block">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 w-64 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-lg z-50"
                  >
                    <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    <button onClick={() => router.push("/dashboard/settings?section=profile")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"><Pencil className="h-4 w-4" /> Change Name</button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    <button onClick={() => setShowLogoutModal(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="h-4 w-4" /> Logout</button>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>

      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-4">
                {logoutLoading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                ) : (
                  <LogOut className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{logoutLoading ? "Logging out..." : "Log Out"}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{logoutLoading ? "Please wait while we securely log you out." : "Are you sure you want to log out of the admin console?"}</p>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowLogoutModal(false)} disabled={logoutLoading}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={logoutLoading} onClick={async () => { setLogoutLoading(true); await logout(); router.push("/"); }}>Log Out</Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
