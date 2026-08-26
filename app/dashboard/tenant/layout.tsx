"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ChevronDown, User, LogOut, X, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getNotifications, Notification } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TenantNavbar from "@/components/tenant-navbar";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  if (isLoading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#080d17]">
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

  if (!user || !isAuthenticated) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#080d17]">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <TenantNavbar />

      {/* Main Content */}
      <main className="pt-16 px-4 sm:px-6 lg:px-8 bg-white">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
