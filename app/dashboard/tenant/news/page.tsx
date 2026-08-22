"use client";

import { motion } from "framer-motion";
import { Calendar, Bell, Megaphone, Wrench, CreditCard, Sparkles, Shield } from "lucide-react";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const newsItems = [
  {
    id: 1,
    title: "Platform Maintenance Scheduled",
    date: "2026-08-15",
    category: "Announcement",
    icon: Wrench,
    excerpt: "We will be performing scheduled maintenance on August 20, 2026, from 2:00 AM to 4:00 AM PHT. Services may be temporarily unavailable during this period.",
  },
  {
    id: 2,
    title: "New Payment Methods Now Available",
    date: "2026-08-10",
    category: "Update",
    icon: CreditCard,
    excerpt: "We have added GCash and PayMaya as additional payment options for your convenience. Update your payment settings today to experience faster transactions.",
  },
  {
    id: 3,
    title: "Welcome to RentTrack 2.0",
    date: "2026-08-01",
    category: "Launch",
    icon: Sparkles,
    excerpt: "We are excited to announce the launch of RentTrack 2.0 with improved UI, faster performance, and new features designed to enhance your rental management experience.",
  },
  {
    id: 4,
    title: "Mobile App Coming Soon",
    date: "2026-07-28",
    category: "Announcement",
    icon: Megaphone,
    excerpt: "Our mobile app is currently in development. Soon you'll be able to manage your rentals on the go with notifications, quick payments, and more.",
  },
  {
    id: 5,
    title: "System Security Upgrade",
    date: "2026-07-20",
    category: "Update",
    icon: Shield,
    excerpt: "We have upgraded our security infrastructure to provide better protection for your data. Two-factor authentication is now available for all users.",
  },
];

export default function NewsPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full space-y-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">News & Updates</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Stay informed with the latest news, updates, and announcements from RentTrack.</p>
        <div className="space-y-3">
          {newsItems.map((news) => {
            const Icon = news.icon;
            return (
              <div key={news.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{news.category}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-auto flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(news.date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{news.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{news.excerpt}</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
