"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Building2, Users, CreditCard, BarChart3, Bell, Shield, ChevronRight, ArrowUpRight, Menu, X, CheckCircle2, Sparkles, Home, MapPin, Phone, Mail, Globe, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const easeOut = [0.21, 0.47, 0.32, 0.98] as const;
const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: easeOut } }) };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } } };

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Dashboard", href: "/login" },
  { label: "Contact", href: "#contact" },
];

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]);
  const headerShadow = useTransform(scrollY, [0, 50], ["0 0 0 rgba(0,0,0,0)", "0 1px 3px rgba(0,0,0,0.06)"]);
  return (
    <motion.nav style={{ background: headerBg, boxShadow: headerShadow }} className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl">
            <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">Rent<span className="text-primary-500">Track</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors relative group">
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 rounded-full group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
          <Link href="/login"><Button size="sm" className="group">Get Started<ArrowUpRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Button></Link>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden overflow-hidden border-t border-border">
            <div className="py-4 space-y-2">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">{item.label}</a>
              ))}
              <div className="pt-2 px-4 space-y-2">
                <Link href="/login"><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link href="/login"><Button className="w-full">Get Started</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
      <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 right-[15%] w-80 h-80 rounded-full bg-secondary-500/10 blur-3xl" />
      <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 left-[40%] w-72 h-72 rounded-full bg-accent-500/8 blur-3xl" />
    </div>
  );
}

function HeroSection() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.6]);
  return (
    <motion.section style={{ scale: heroScale, opacity: heroOpacity }} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <FloatingOrbs />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 mb-8 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
          <Sparkles className="h-4 w-4" />HedgeHomes Realty and Brokerage — by RentTrack
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
          <span className="text-foreground">Streamline Your</span><br /><span className="gradient-text">Rental Management</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }} className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-text-secondary leading-relaxed">
          Track payments, manage properties, and monitor receivables in real-time. From owner to tenant - every role, every transaction, every notification.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login"><Button size="lg" className="group h-12 px-8 text-base shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all">Get Started Free<ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
          <a href="#features"><Button variant="outline" size="lg" className="h-12 px-8 text-base border-2">Explore Features</Button></a>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {[
            { value: "100%", label: "Digital Tracking" },
            { value: "Real-time", label: "Notifications" },
            { value: "4 Roles", label: "User Access" },
            { value: "Zero", label: "Paper Records" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="mt-1 text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 rounded-full border-2 border-text-tertiary flex items-start justify-center p-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

const featureList = [
  { title: "Property Management", desc: "Manage multiple properties and units across different locations. Track occupancy, maintenance, and lease details.", bg: "bg-primary-50 dark:bg-primary-900/20" },
  { title: "Tenant Management", desc: "Register tenants, assign units, manage contracts, and maintain complete tenant profiles with ease.", bg: "bg-secondary-50 dark:bg-secondary-900/20" },
  { title: "Payment Tracking", desc: "Full, partial, and advance payment support. Upload receipts, auto-calculate balances, and maintain ledgers.", bg: "bg-accent-50 dark:bg-accent-900/20" },
  { title: "Dashboard Analytics", desc: "Real-time dashboards with charts, aging reports, and performance metrics tailored to each user role.", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { title: "Smart Notifications", desc: "Automated email and SMS alerts for payment confirmations, due dates, overdue reminders, and approvals.", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { title: "Role-Based Access", desc: "Secure RBAC with Admin, Owner, Agent, and Tenant roles. Audit logs for full accountability and transparency.", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} className="text-center mb-16">
          <motion.span variants={fadeInUp} className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 mb-4">Everything You Need</motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold">Powerful Features for <span className="gradient-text">Smart Management</span></motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">From property tracking to payment verification, RentTrack covers every aspect of rental management with an intuitive, role-based interface.</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((feature, i) => (
            <motion.div key={i} variants={fadeInUp} custom={i} className="group relative rounded-2xl border border-border bg-surface p-8 card-hover">
              <div className={cn("relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl", feature.bg)}>
                {i === 0 && <Building2 className="h-6 w-6 text-foreground" />}
                {i === 1 && <Users className="h-6 w-6 text-foreground" />}
                {i === 2 && <CreditCard className="h-6 w-6 text-foreground" />}
                {i === 3 && <BarChart3 className="h-6 w-6 text-foreground" />}
                {i === 4 && <Bell className="h-6 w-6 text-foreground" />}
                {i === 5 && <Shield className="h-6 w-6 text-foreground" />}
              </div>
              <h3 className="relative text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="relative text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} className="text-center mb-16">
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold">How It <span className="gradient-text">Works</span></motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: "Building2", title: "Register Properties", desc: "Add houses and condominium units with details, pricing, and availability.", num: 1 },
            { icon: "Users", title: "Assign Tenants", desc: "Agents register tenants, assign units, and manage contracts pending owner approval.", num: 2 },
            { icon: "CreditCard", title: "Track Payments", desc: "Tenants upload receipts. Owners verify. Balances update automatically in real-time.", num: 3 },
            { icon: "BarChart3", title: "Monitor & Report", desc: "Dashboards show receivables, occupancy, and performance. Generate reports instantly.", num: 4 },
          ].map((step, i) => {
            const IconComp = step.icon === "Building2" ? Building2 : step.icon === "Users" ? Users : step.icon === "CreditCard" ? CreditCard : BarChart3;
            return (
              <motion.div key={i} variants={fadeInUp} custom={i} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/25"><IconComp className="h-7 w-7" /></div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-bold shadow-lg">{step.num}</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 bg-surface-secondary overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer}>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Transform Your Rental <span className="gradient-text">Management Today</span></motion.h2>
          <motion.p variants={fadeInUp} className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto">Join property owners who have streamlined their rental operations.</motion.p>
          <motion.div variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"><Button size="lg">Start Free Trial<ChevronRight className="ml-2 h-4 w-4" /></Button></Link>
            <a href="#features"><Button variant="outline" size="lg" className="border-2">Learn More</Button></a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
              </div>
              <span className="text-lg font-bold">Rent<span className="text-primary-500">Track</span></span>
            </div>
            <p className="text-sm text-text-secondary max-w-md leading-relaxed">HedgeHomes Realty and Brokerage — powered by RentTrack. A Rental Payment, Receivables, and Property Monitoring System for House and Condominium Room Rentals.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {["Features", "How It Works", "Pricing"].map((item) => (
                <li key={item}><a href={"#" + item.toLowerCase().replace(/\s+/g, "-")} className="text-sm text-text-secondary hover:text-foreground transition-colors">{item}</a></li>
              ))}
              <li><a href="/login" className="text-sm text-text-secondary hover:text-foreground transition-colors">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-text-secondary"><MapPin className="h-4 w-4 text-primary-500" />Butuan City, Philippines</li>
              <li className="flex items-center gap-2 text-sm text-text-secondary"><Mail className="h-4 w-4 text-primary-500" />hello@renttrack.ph</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  );
}
