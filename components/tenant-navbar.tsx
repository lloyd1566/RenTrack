"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Home, Building2, Users, FileText, Mail, Info, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/dashboard/tenant", icon: Home },
  { label: "Properties", href: "/dashboard/tenant/properties-page", icon: Building2 },
  { label: "Find A Rent Manager", href: "/dashboard/tenant/rent-manager", icon: Users },
  { label: "Blog", href: "/dashboard/tenant/blog", icon: FileText },
  { label: "Contact Us", href: "/dashboard/tenant/contact", icon: Mail },
  { label: "About Us", href: "/dashboard/tenant/about", icon: Info },
  { label: "News", href: "/dashboard/tenant/news", icon: Newspaper },
];

export default function TenantNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

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

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("renttrack_dark", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800" : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/tenant" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">RT</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Rent<span className="text-blue-600">Track</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                    pathname === item.href
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))
            )}
            <button
              onClick={toggleDarkMode}
              className="ml-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 relative">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
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
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
