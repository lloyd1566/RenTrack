"use client";

import { motion } from "framer-motion";
import { Users, Star, Shield, CheckCircle, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const managers = [
  { id: 1, name: "Maria Santos", properties: 12, rating: 4.8, verified: true },
  { id: 2, name: "Juan Dela Cruz", properties: 8, rating: 4.5, verified: true },
  { id: 3, name: "Ana Reyes", properties: 15, rating: 4.9, verified: true },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantRentManagerPage() {
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
              Trusted Managers
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find A Rent Manager</h1>
            <p className="text-xl text-blue-100">Connect with trusted and verified rent managers.</p>
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
          {managers.map((manager, idx) => (
            <motion.div
              key={manager.id}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="p-6 border-gray-200 hover:shadow-2xl transition-all duration-300 h-full group">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl"
                  >
                    {manager.name.split(' ').map(n => n[0]).join('')}
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{manager.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      {manager.rating}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {manager.properties} properties managed
                  </div>
                  {manager.verified && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Verified Rent Manager
                    </div>
                  )}
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full">Contact Manager</Button>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
