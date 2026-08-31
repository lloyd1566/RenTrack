"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount, getUnreadMessageCount, Notification } from "@/lib/data";
import AdminSidebar from "@/components/admin-sidebar";
import { Avatar } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
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
      refreshNotificationsCount();
    }
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        getNotifications(user.id).then(setNotifications).catch(() => {});
        getUnreadMessageCount().then(setUnreadMessageCount).catch(() => {});
        refreshNotificationsCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleNotificationClick = async (id: string) => {
    setShowNotifications(false);
    try {
      await markNotificationRead(id);
      const updated = await getNotifications(user?.id);
      setNotifications(updated);
      refreshNotificationsCount();
    } catch {
      // ignore
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && user) {
      try {
        await markAllNotificationsRead(user.id);
        const updated = await getNotifications(user.id);
        setNotifications(updated);
        refreshNotificationsCount();
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

          {/* Right side - Notifications */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
                  >
                    {unreadNotificationsCount}
                  </motion.span>
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

            <Avatar src={user.avatarUrl} fallback={user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()} size="sm" />
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
    </div>
  );
}
