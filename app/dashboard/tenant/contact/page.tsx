"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const contactInfo = [
  { icon: Mail, title: "Email", value: "support@renttrack.com" },
  { icon: Phone, title: "Phone", value: "+63 912 345 6789" },
  { icon: MapPin, title: "Address", value: "Cebu, Manila, Butuan, Davao, Philippines" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantContactPage() {
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
              Get In Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-blue-100">Get in touch with our team for support and inquiries.</p>
          </motion.div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-span-1 space-y-6"
          >
            {contactInfo.map((contact, idx) => (
              <motion.div
                key={contact.title}
                variants={item}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="p-5 border-gray-200 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                      className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center"
                    >
                      <contact.icon className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.title}</h3>
                      <p className="text-sm text-gray-600">{contact.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 border-gray-200 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Send us a message</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Your Name" />
                  <Input placeholder="Your Email" type="email" />
                </div>
                <Input placeholder="Subject" />
                <textarea
                  placeholder="Your Message"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  rows={5}
                />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full md:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
