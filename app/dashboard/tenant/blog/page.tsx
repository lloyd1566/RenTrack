"use client";

import { motion } from "framer-motion";
import { FileText, Calendar, User, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const posts = [
  { id: 1, title: "How to Find the Perfect Rental", date: "Aug 5, 2026", author: "Admin", excerpt: "Tips and tricks for finding the perfect rental property that suits your needs and budget." },
  { id: 2, title: "Understanding Tenant Rights", date: "Aug 3, 2026", author: "Admin", excerpt: "Know your rights as a tenant and how to protect yourself in rental agreements." },
  { id: 3, title: "Maintenance Tips for Renters", date: "Jul 28, 2026", author: "Admin", excerpt: "Simple maintenance tips every renter should know to keep their home in great condition." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantBlogPage() {
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
              Latest Updates
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-blue-100">Latest news, tips, and updates from RentTrack.</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="overflow-hidden border-gray-200 hover:shadow-2xl transition-all duration-300 h-full group">
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                  >
                    <FileText className="h-16 w-16 text-blue-500" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.date}</span>
                    <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.author}</span>
                  </div>
                  <p className="text-sm text-gray-600">{post.excerpt}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
