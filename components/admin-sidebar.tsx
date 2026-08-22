"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, Notification } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  UserPlus,
  CreditCard,
  Activity,
  FileText,
  Stethoscope,
  HeartPulse,
  Wrench,
  SlidersHorizontal,
  ShieldCheck,
  Bell,
  ChevronDown,
  LogOut,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    tab: string;
    icon: typeof LayoutDashboard;
  }[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Overview", href: "/dashboard/admin", tab: "overview", icon: LayoutDashboard },
      { label: "Accounts", href: "/dashboard/admin?tab=users", tab: "users", icon: Users },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Properties", href: "/dashboard/admin?tab=properties", tab: "properties", icon: Building2 },
      { label: "Units", href: "/dashboard/admin?tab=units", tab: "units", icon: Home },
      { label: "Tenants", href: "/dashboard/admin?tab=tenants", tab: "tenants", icon: UserPlus },
      { label: "Payments", href: "/dashboard/admin?tab=payments", tab: "payments", icon: CreditCard },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/dashboard/admin?tab=messages", tab: "messages", icon: MessageSquare },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Activity", href: "/dashboard/admin?tab=activity", tab: "activity", icon: Activity },
      { label: "Audit Logs", href: "/dashboard/admin?tab=audit", tab: "audit", icon: FileText },
      { label: "Diagnosis", href: "/dashboard/admin?tab=diagnosis", tab: "diagnosis", icon: Stethoscope },
      { label: "System Health", href: "/dashboard/admin?tab=health", tab: "health", icon: HeartPulse },
      { label: "Maintenance", href: "/dashboard/admin?tab=maintenance", tab: "maintenance", icon: Wrench },
      { label: "Configuration", href: "/dashboard/admin?tab=configuration", tab: "configuration", icon: SlidersHorizontal },
    ],
  },
];

export default function AdminSidebar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigateTo = (tab: string) => {
    router.push(`/dashboard/admin?tab=${tab}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07111f]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-cyan-300/20 border-t-cyan-300 animate-spin mb-4" />
          <p className="text-cyan-100/80 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={reduceMotion ? false : { x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.36, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#07111f] text-slate-200 shadow-2xl shadow-black/40"
      >
        {/* Logo */}
        <Link href="/dashboard/admin" className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/[0.08] px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/20 to-indigo-500/30 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white">RentTrack</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">System Console</span>
          </div>
        </Link>

        {/* Navigation */}
         <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {navSections.map((section) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.tab;
                  const Icon = item.icon;
                  return (
                     <motion.button
                       key={item.tab}
                       onClick={() => navigateTo(item.tab)}
                        className={cn(
                          "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all duration-200 w-full",
                          isActive
                            ? "bg-cyan-300/[0.12] text-cyan-100"
                            : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                        )}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 15, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Icon className={cn("relative h-[18px] w-[18px] shrink-0 transition-colors", isActive ? "text-cyan-300" : "text-slate-500")} />
                        </motion.div>
                        <span className="relative truncate text-[13px] font-medium">{item.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="admin-sidebar-dot"
                          className="relative ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"
                          transition={{ type: "spring", stiffness: 360, damping: 28 }}
                        >
                          <motion.span
                            className="absolute inset-0 rounded-full bg-cyan-300"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </nav>

        {/* Refresh Button */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>
      </motion.aside>
      </>
  );
}
