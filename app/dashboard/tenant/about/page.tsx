"use client";

import { motion } from "framer-motion";
import { Building2, Users, CreditCard, Shield, Mail, Phone, MapPin, Target, Eye, Heart, Award, Clock, Globe } from "lucide-react";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AboutPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full space-y-4">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">About RentTrack</h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
          RentTrack is a comprehensive rental management platform designed to streamline property management,
          tenant relations, and payment tracking. Our mission is to make rental management simple, transparent,
          and efficient for both property owners and tenants.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Building2 className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Property Management</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Easily manage multiple properties and units in one place.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Users className="h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Tenant Relations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Streamlined communication and onboarding for tenants.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CreditCard className="h-8 w-8 text-amber-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Payment Tracking</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track payments, generate receipts, and send reminders.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Secure & Reliable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your data is protected with industry-standard security.</p>
          </div>
        </div>
      </div>

      {/* Mission Vision Values */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Our Mission, Vision & Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Mission</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">To simplify rental management through innovative technology and exceptional service.</p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
            <Eye className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Vision</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">To become the leading rental management platform in the Philippines and Southeast Asia.</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-center">
            <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Values</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Integrity, transparency, innovation, and commitment to our users&apos; success.</p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Why Choose RentTrack?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Award className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Trusted Platform</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Used by hundreds of property owners and tenants across the country.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">24/7 Support</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Our support team is always ready to help you with any concerns.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Globe className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Cloud-Based</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Access your dashboard anywhere, anytime, on any device.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Data Security</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise-grade encryption to keep your information safe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Contact Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Email</p>
              <p className="text-xs font-medium text-slate-900 dark:text-white">support@renttrack.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Phone className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Phone</p>
              <p className="text-xs font-medium text-slate-900 dark:text-white">+63 912 345 6789</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <MapPin className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Location</p>
              <p className="text-xs font-medium text-slate-900 dark:text-white">Butuan City, Philippines</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
