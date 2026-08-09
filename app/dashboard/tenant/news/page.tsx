"use client";

import { motion } from "framer-motion";
import { Newspaper, Calendar, ExternalLink, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const newsItems = [
  { id: 1, title: "RentTrack Expands to New Cities", date: "Aug 8, 2026", category: "Company News", excerpt: "We are excited to announce our expansion to new cities across the Philippines." },
  { id: 2, title: "New Feature: Digital Lease Agreements", date: "Aug 5, 2026", category: "Product Update", excerpt: "Sign and manage lease agreements digitally with our new feature." },
  { id: 3, title: "Partnership with Local Banks", date: "Jul 30, 2026", category: "Partnership", excerpt: "RentTrack partners with leading banks to offer better payment options." },
  { id: 4, title: "Tenant Satisfaction Survey Results", date: "Jul 25, 2026", category: "Research", excerpt: "Read the results of our latest tenant satisfaction survey." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantNewsPage() {
  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
              <Sparkles className="h-3 w-3" />
              Stay Updated
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">News</h1>
            <p className="text-xl text-blue-100">Stay updated with the latest news and announcements from RentTrack.</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-6"
        >
          {newsItems.map((news, idx) => (
            <motion.div
              key={news.id}
              variants={item}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="p-6 border-gray-200 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{news.category}</span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {news.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{news.title}</h3>
                    <p className="text-gray-600 text-sm">{news.excerpt}</p>
                  </div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
