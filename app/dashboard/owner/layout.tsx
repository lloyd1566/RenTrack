"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Home, ClipboardCheck, FileText,
  CreditCard, BarChart3, FileSpreadsheet, LogOut, ChevronRight, Menu, X,
  Loader2, MessageSquare, ChevronDown, ChevronLeft, Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import MessagingPanel from "@/components/messaging-panel";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { label: "Overview", tab: "overview", href: "/dashboard/owner#overview", icon: LayoutDashboard },
  { label: "Properties", tab: "properties", href: "/dashboard/owner#properties", icon: Home },
  { label: "Rental Units", tab: "units", href: "/dashboard/owner#units", icon: ClipboardCheck },
  { label: "Tenant Assignments", tab: "assignments", href: "/dashboard/owner#assignments", icon: FileText },
  { label: "Agents", tab: "agents", href: "/dashboard/owner#agents", icon: Users },
  { label: "Rental Contracts", tab: "contracts", href: "/dashboard/owner#contracts", icon: FileText },
  { label: "Occupancy", tab: "occupancy", href: "/dashboard/owner#occupancy", icon: Home },
  { label: "Payments", tab: "payments", href: "/dashboard/owner#payments", icon: CreditCard },
  { label: "Receivables", tab: "receivables", href: "/dashboard/owner#receivables", icon: CreditCard },
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

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
    <div className="min-h-screen bg-surface flex-1">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-10">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-surface-secondary">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-sm">Owner Panel</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowMessages(!showMessages)} className="p-2 rounded-lg hover:bg-surface-secondary relative">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-lg hover:bg-surface-secondary text-red-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={cn("hidden lg:flex flex-col border-r border-border bg-surface transition-all self-start", sidebarOpen ? "w-56" : "w-16")}>
          <div className="p-4 border-b border-border">
            <Link href="/dashboard/owner" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              {sidebarOpen && <span className="font-bold text-foreground text-sm">Owner Panel</span>}
            </Link>
          </div>
          <nav className="overflow-y-auto p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab || item.href}
                  onClick={() => {
                    if (window.location.pathname !== "/dashboard/owner") {
                      router.push(`/dashboard/owner#${item.tab}`);
                    } else {
                      window.location.hash = item.tab;
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-base font-medium transition-all",
                    isActive
                      ? "bg-primary-100 text-primary-800"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-600" : "text-text-tertiary")} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {isActive && sidebarOpen && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary-600" />}
                </button>
              );
            })}
          </nav>
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
                className="w-64 h-full bg-surface border-r border-border flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
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
                <nav className="overflow-y-auto p-3 space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab || item.href}
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
                      </button>
                    );
                  })}
                </nav>
                <div className="p-3 border-t border-border space-y-0.5">
                  <button
                    onClick={() => setShowMessages(!showMessages)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {sidebarOpen && <span className="truncate">Messages</span>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop header */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <h1 className="text-xl font-semibold text-foreground">Owner Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-foreground"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
                <AnimatePresence initial={false}>
                  {showMessages && (
                    <MessagingPanel
                      isOpen={showMessages}
                      onClose={() => setShowMessages(false)}
                    />
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
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface shadow-dropdown overflow-hidden"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
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
                  <button onClick={() => setShowLogoutModal(false)} disabled={logoutLoading} className="flex-1 px-4 py-2 rounded-xl border border-border hover:bg-surface-secondary transition-colors disabled:opacity-50">Cancel</button>
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
