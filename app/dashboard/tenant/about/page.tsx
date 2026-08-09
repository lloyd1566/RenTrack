"use client";

import { motion } from "framer-motion";
import { Users, Building2, Target, Award, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  { icon: Users, title: "10,000+", desc: "Happy Tenants" },
  { icon: Building2, title: "5,000+", desc: "Properties Listed" },
  { icon: Target, title: "99%", desc: "Satisfaction Rate" },
  { icon: Award, title: "50+", desc: "Awards Won" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantAboutPage() {
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
              Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-blue-100">Learn more about RentTrack and our mission.</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <p className="text-lg text-gray-600 leading-relaxed">
            RentTrack is a comprehensive property management platform designed to simplify the rental experience for both tenants and property owners. Our mission is to make renting transparent, secure, and convenient for everyone involved.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.title}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="p-6 text-center border-gray-200 hover:shadow-2xl transition-all duration-300 h-full">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                  className="mx-auto mb-3"
                >
                  <stat.icon className="h-10 w-10 text-blue-600" />
                </motion.div>
                <h3 className="text-3xl font-bold text-gray-900">{stat.title}</h3>
                <p className="text-sm text-gray-600">{stat.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
