"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount, getConversations, Notification, Conversation } from "@/lib/data";
import AdminSidebar from "@/components/admin-sidebar";
import AccountRequestReviewModal from "@/components/account-request-review-modal";
import { Avatar } from "@/components/ui/avatar";
import { Bell, ChevronDown } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [accountRequests, setAccountRequests] = useState<Conversation[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedAccountRequest, setSelectedAccountRequest] = useState<Conversation | null>(null);

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
      refreshNotificationsCount();
      getConversations().then((convs) => {
        setConversations(convs);
        const requests = convs.filter((c) => c.lastMessage?.subject === "Account Creation Request");
        setAccountRequests(requests);
      }).catch(() => {
        setConversations([]);
        setAccountRequests([]);
      });
    }
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    const handleRefresh = () => {
      if (!user) return;
      getNotifications(user.id).then(setNotifications).catch(() => {});
      refreshNotificationsCount();
      getConversations().then((convs) => {
        const requests = convs.filter((c) => c.lastMessage?.subject === "Account Creation Request");
        setAccountRequests(requests);
      }).catch(() => {});
    };

    window.addEventListener("renttrack-notifications-updated", handleRefresh);
    return () => window.removeEventListener("renttrack-notifications-updated", handleRefresh);
  }, [user, refreshNotificationsCount]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    setShowNotifications(false);
    if (notification.title === "Account Creation Request") {
      const loadedRequest = accountRequests.find((conv) => conv.lastMessage?.body === notification.message)
        || accountRequests[0];
      if (loadedRequest) {
        setSelectedAccountRequest(loadedRequest);
      } else {
        void getConversations().then((convs) => {
          const request = convs.find((conv) => conv.lastMessage?.subject === "Account Creation Request" && conv.lastMessage.body === notification.message)
            || convs.find((conv) => conv.lastMessage?.subject === "Account Creation Request");
          if (request) setSelectedAccountRequest(request);
        }).catch(() => undefined);
      }
    }
    void markNotificationRead(notification.id).catch(() => undefined);
    try {
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
        const updated = await getNotifications(user.id);
        setNotifications(updated);
        refreshNotificationsCount();
      } catch {
        // ignore
      }
    }
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
                              onClick={() => handleNotificationClick(n)}
                              className="w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
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
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar src={user.avatarUrl || "/images/admin-avatar.svg"} alt={`${user.name} profile picture`} fallback={user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{user.name?.split(' ')[0] || "Admin"}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50"
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {conversations.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Messages</p>
                          {conversations.slice(0, 5).map((conv) => (
                            <button
                              key={conv.userId}
                              onClick={() => {
                                setShowUserMenu(false);
                                if (conv.lastMessage?.subject === "Account Creation Request") {
                                  setSelectedAccountRequest(conv);
                                } else {
                                  router.push(`/dashboard/admin?tab=messages&userId=${conv.userId}`);
                                }
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors"
                            >
                              <p className="text-xs font-medium text-foreground truncate">{conv.otherUser?.name || "Unknown"}</p>
                              <p className="text-[10px] text-text-secondary truncate">{conv.lastMessage?.body?.split('\n').slice(0, 2).join(' ')}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
        <AccountRequestReviewModal
          request={selectedAccountRequest}
          onClose={() => setSelectedAccountRequest(null)}
          onCreated={() => {
            getConversations().then((convs) => {
              setConversations(convs);
              setAccountRequests(convs.filter((conv) => conv.lastMessage?.subject === "Account Creation Request"));
            }).catch(() => {});
          }}
        />
      </motion.div>
    </div>
  );
}
