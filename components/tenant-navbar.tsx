"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, Bell, MessageSquare, User, LogOut, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MessagingPanel from "@/components/messaging-panel";

export default function TenantNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem("renttrack_dark") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("renttrack_dark", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowLogoutConfirm(false);
    setLogoutLoading(true);
    await logout();
    router.push("/");
  };

  const navItems = [
    { label: "Home", href: "/dashboard/tenant" },
    { label: "Properties", href: "/dashboard/tenant/properties-page" },
    { label: "Units", href: "/dashboard/tenant/units" },
    { label: "Managers", href: "/dashboard/tenant/rent-manager" },
    { label: "Contact", href: "/dashboard/tenant/contact" },
    { label: "About", href: "/dashboard/tenant/about" },
    { label: "News", href: "/dashboard/tenant/news" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800" : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-800/50"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/tenant" className="flex items-center gap-2.5 shrink-0 group">
            <motion.div
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md relative overflow-hidden"
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <span className="text-white font-bold text-sm relative z-10">RT</span>
            </motion.div>
            <motion.span
              className="text-lg font-bold text-gray-900 dark:text-white hidden sm:inline"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              Rent<span className="text-blue-600">Track</span>
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {loading ? (
              <motion.div
                className="flex items-center gap-2 px-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm text-gray-500">Loading...</span>
              </motion.div>
            ) : (
              <>
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap relative",
                          isActive
                            ? "text-blue-600"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleDarkMode}
                  className="ml-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-blue-400/20 rounded-xl opacity-0 dark:opacity-100"
                    animate={{ opacity: darkMode ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    key={darkMode ? "sun" : "moon"}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
                  </motion.div>
                </motion.button>
                {user && (
                  <>
                    <motion.div
                      className="relative ml-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowNotifications(!showNotifications);
                          if (!showNotifications && user) {
                            getNotifications(user.id).then(setNotifications).catch(() => {});
                          }
                        }}
                        className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <AnimatePresence>
                          {unreadCount > 0 && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/50"
                            >
                              {unreadCount}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {unreadCount > 0 && (
                            <motion.span
                              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute inset-0 rounded-full bg-red-500/30"
                            />
                          )}
                        </AnimatePresence>
                      </motion.button>
                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 max-h-96 overflow-y-auto"
                          >
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                            </div>
                            {notifications.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</div>
                            ) : (
                              notifications.slice(0, 10).map((n, index) => (
                                <motion.button
                                  key={n.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03 }}
                                  onClick={async () => {
                                    await markNotificationRead(n.id);
                                    const updated = await getNotifications(user.id);
                                    setNotifications(updated);
                                  }}
                                  className={cn("w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", !n.read && "bg-blue-50/50 dark:bg-blue-900/10")}
                                >
                                  <div className="flex items-start gap-3">
                                    <motion.div
                                      className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", "bg-gray-100 text-gray-500")}
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                      <Bell className="h-4 w-4" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                                    </div>
                                  </div>
                                </motion.button>
                              ))
                            )}
                            {notifications.length > 0 && unreadCount > 0 && (
                              <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={async () => {
                                    await markAllNotificationsRead(user.id);
                                    const updated = await getNotifications(user.id);
                                    setNotifications(updated);
                                  }}
                                  className="w-full text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-lg transition-colors"
                                >
                                  Mark all as read
                                </motion.button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Messages Icon */}
                    <motion.div
                      className="relative ml-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowMessages(!showMessages)}
                        className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </motion.button>
                      <AnimatePresence>
                        {showMessages && (
                          <MessagingPanel
                            isOpen={showMessages}
                            onClose={() => setShowMessages(false)}
                          />
                        )}
                      </AnimatePresence>
                     </motion.div>

                     {/* Refresh Button */}
                     <motion.div
                       className="relative ml-1"
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 0.48, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                     >
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => window.location.reload()}
                         className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                       >
                         <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                       </motion.button>
                     </motion.div>

                     <motion.div
                       className="relative ml-1"
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 0.5, duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                     >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
                      >
                        <motion.div
                          whileHover={{ rotate: 10 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Avatar src={user.avatarUrl} fallback={user.name?.charAt(0)?.toUpperCase() || "T"} className="h-8 w-8 ring-2 ring-blue-500/20" />
                        </motion.div>
                        <motion.span
                          className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200"
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {user.name}
                        </motion.span>
                        <motion.div
                          animate={{ rotate: showUserMenu ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {showUserMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 overflow-hidden"
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700"
                            >
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </motion.div>
                            <Link
                              href="/dashboard/tenant/settings"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                                <User className="h-4 w-4 text-gray-400" />
                              </motion.div>
                              Profile & Settings
                            </Link>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowLogoutConfirm(true)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Log Out
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <motion.div
                key={darkMode ? "sun" : "moon"}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
              </motion.div>
            </motion.button>
            {user && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 relative"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 relative"
                >
                  <Avatar src={user.avatarUrl} fallback={user.name?.charAt(0)?.toUpperCase() || "T"} className="h-8 w-8" />
                </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileOpen ? "close" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Notifications */}
      <AnimatePresence>
        {mobileOpen && showNotifications && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notifications</p>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-3">No notifications yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={cn("p-2.5 rounded-lg", !n.read && "bg-blue-50 dark:bg-blue-900/10")}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && !showNotifications && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-3 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <>
                  {navItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { setMobileOpen(false); setShowUserMenu(false); }}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        {item.label}
                      </motion.div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
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
                <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)} disabled={logoutLoading}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={logoutLoading} onClick={handleLogout}>
                  {logoutLoading ? "Logging out..." : "Log Out"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </nav>
  );
}
