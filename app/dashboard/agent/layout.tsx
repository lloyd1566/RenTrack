"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard, Home, ClipboardCheck, Clock,
  CreditCard, FileText, Send, LogOut, ChevronRight, Menu, X,
  Loader2, ChevronDown, ChevronLeft, Bell, KeyRound, Mail, User,
} from "lucide-react";
import { getNotifications, getUnreadMessageCount, getUnreadInquiryCount, Notification } from "@/lib/data";
import { getProperties, Property } from "@/lib/data";
import MessagingPanel from "@/components/messaging-panel";
import MessagingModal from "@/components/messaging-modal";

const navItems = [
  { label: "Overview", tab: "overview", href: "/dashboard/agent#overview", icon: LayoutDashboard },
  { label: "Properties", tab: "properties", href: "/dashboard/agent#properties", icon: Home },
  { label: "Assign Unit", tab: "assign", href: "/dashboard/agent#assign", icon: ClipboardCheck },
  { label: "Payments", tab: "payments", href: "/dashboard/agent#payments", icon: CreditCard },
  { label: "History", tab: "history", href: "/dashboard/agent#history", icon: FileText },
  { label: "Messages", tab: "messages", href: "/dashboard/agent#messages", icon: Send },
  { label: "Inquiries", tab: "inquiries", href: "/dashboard/agent#inquiries", icon: Mail },
];

function getTabFromHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash && navItems.some((item) => item.tab === hash)) return hash;
  return "overview";
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      try {
        const props = await getProperties(user);
        setAgentProperties(props);
      } catch (err) {
        console.error("Failed to load properties for messaging", err);
      }
    })();
  }, [user]);

  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && (navItems.some((item) => item.tab === hash) || hash === "profile")) {
        setActiveTab(hash as any);
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
    if (user) {
      getNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      getUnreadMessageCount().then(setUnreadMessageCount).catch(() => setUnreadMessageCount(0));
      getUnreadInquiryCount().then(setUnreadInquiryCount).catch(() => setUnreadInquiryCount(0));
    }
  }, [user]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    router.push("/");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Redirecting to login...</p>
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
        <span className="font-semibold text-base">Agent Panel</span>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-lg hover:bg-surface-secondary relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-lg hover:bg-surface-secondary text-red-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={cn("hidden lg:flex flex-col border-r border-border bg-surface transition-all self-start", sidebarOpen ? "w-56" : "w-16")}>
          <div className="p-4 border-b border-border">
            <Link href="/dashboard/agent" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img src="/images/landing/logo.png" alt="RentTrack" className="h-full w-full object-contain" />
              </div>
              {sidebarOpen && <span className="font-bold text-foreground text-sm">Agent Panel</span>}
            </Link>
          </div>
          <nav className="overflow-y-auto p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`sidebar-${item.tab}`}
                  onClick={() => {
                    setActiveTab(item.tab);
                    window.location.hash = item.tab;
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
                  {item.tab === "messages" && unreadMessageCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadMessageCount}
                    </span>
                  )}
                  {item.tab === "inquiries" && unreadInquiryCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadInquiryCount}
                    </span>
                  )}
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
                  <Link href="/dashboard/agent" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg overflow-hidden">
                      <img src="/images/landing/logo.png" alt="RentTrack" className="h-full w-full object-contain" />
                    </div>
                    <span className="font-bold text-foreground text-sm">Agent Panel</span>
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
                        key={item.tab}
                        id={`sidebar-${item.tab}`}
                        onClick={() => {
                          setActiveTab(item.tab);
                          window.location.hash = item.tab;
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
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => router.push("/dashboard/agent#messages")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium text-text-secondary hover:bg-surface-secondary hover:text-foreground transition-colors"
                  >
                    <Send className="h-4 w-4" />
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
              <h1 className="text-2xl font-semibold text-foreground">Agent Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <AnimatePresence initial={false}>
                  {showMessages && (
                    <MessagingPanel
                      isOpen={showMessages}
                      onClose={() => setShowMessages(false)}
                      onSelectConversation={(conv) => {
                        setSelectedConversation(conv);
                        setIsMessagingOpen(true);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
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
                <AnimatePresence initial={false}>
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
                          <p className="px-4 py-8 text-center text-sm text-text-secondary">No notifications yet</p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <button
                              key={n.id}
                              onClick={() => setShowNotifications(false)}
                              className="w-full text-left p-4 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors"
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
                  <Avatar src={user.avatarUrl} fallback={user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
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
                          onClick={() => { setShowUserMenu(false); window.location.hash = "profile"; }}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-surface-secondary hover:text-foreground w-full transition-colors"
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </button>
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

        {selectedConversation && (
          <MessagingModal
            isOpen={isMessagingOpen}
            onClose={() => {
              setIsMessagingOpen(false);
              setSelectedConversation(null);
            }}
            otherUser={{
              id: selectedConversation.otherUser?.id || "",
              name: selectedConversation.otherUser?.name || "Unknown",
              email: selectedConversation.otherUser?.email || "",
              role: selectedConversation.otherUser?.role || "tenant",
              avatarUrl: selectedConversation.otherUser?.avatarUrl,
              allowMessages: true,
            }}
            properties={agentProperties.map(p => ({ id: p.id, name: p.name, location: p.location, type: p.type, units: p.units, rentAmount: p.monthlyRevenue }))}
          />
        )}
      </div>
    </div>
  );
}
