"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Building2, CreditCard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendingPaymentsCount, getUnreadCount, getUnreadMessageCount } from "@/lib/data";

const navItems = [
  { label: "Dashboard", href: "/dashboard/agent", icon: LayoutDashboard },
  { label: "Tenants", href: "/dashboard/agent/tenants", icon: Users },
  { label: "Properties", href: "/dashboard/agent/properties", icon: Building2 },
  { label: "Payments", href: "/dashboard/agent/payments", icon: CreditCard },
];

export default function AgentNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getPendingPaymentsCount().then(setPendingPaymentsCount).catch(() => setPendingPaymentsCount(0));
  }, []);

  useEffect(() => {
    getUnreadCount("agent").then(setUnreadNotifications).catch(() => setUnreadNotifications(0));
    getUnreadMessageCount().then(setUnreadMessages).catch(() => setUnreadMessages(0));
    const interval = setInterval(() => {
      getPendingPaymentsCount().then(setPendingPaymentsCount).catch(() => {});
      getUnreadCount("agent").then(setUnreadNotifications).catch(() => {});
      getUnreadMessageCount().then(setUnreadMessages).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalBadges = pendingPaymentsCount + unreadNotifications + unreadMessages;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800" : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/agent" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">RT</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Rent<span className="text-blue-600">Track</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                 <Link
                   key={item.href}
                   href={item.href}
                   className={cn(
                     "relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                     isActive
                       ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                       : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                   )}
                 >
                   <Icon className="h-4 w-4" />
                   <span>{item.label}</span>
                   {item.label === "Payments" && pendingPaymentsCount > 0 && (
                     <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                       {pendingPaymentsCount}
                     </span>
                   )}
                 </Link>
                );
              })}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Notification Bell - visible on md+ */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {totalBadges > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg"
                >
                  {totalBadges > 99 ? "99+" : totalBadges}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
          >
             <div className="px-4 py-3 space-y-1">
               {navItems.map((item) => (
                 <Link
                   key={item.href}
                   href={item.href}
                   onClick={() => setMobileOpen(false)}
                   className={cn(
                     "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                     pathname === item.href
                       ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                       : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                   )}
                 >
                   <item.icon className="h-4 w-4" />
                   {item.label}
                   {item.label === "Payments" && pendingPaymentsCount > 0 && (
                     <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                       {pendingPaymentsCount}
                     </span>
                   )}
                 </Link>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
