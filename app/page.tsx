"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, Users, CreditCard, BarChart3, Bell, Shield, ChevronRight, ArrowUpRight, Menu, Sparkles, MapPin, Mail, Search, Wifi, Car, PawPrint, Clock, Home, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Units", href: "#units" },
  { label: "Benefits", href: "#why-us" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

const featureList = [
  { icon: Building2, title: "Property Management", desc: "Manage multiple properties and units across different locations. Track occupancy, maintenance, and lease details.", image: "/images/landing/feature-property.jpg" },
  { icon: Users, title: "Tenant Management", desc: "Register tenants, assign units, manage contracts, and maintain complete tenant profiles with ease.", image: "/images/landing/feature-tenant.jpg" },
  { icon: CreditCard, title: "Payment Tracking", desc: "Full, partial, and advance payment support. Upload receipts, auto-calculate balances, and maintain ledgers.", image: "/images/landing/feature-payment.jpg" },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Real-time dashboards with charts, aging reports, and performance metrics tailored to each user role.", image: "/images/landing/feature-dashboard.jpg" },
  { icon: Bell, title: "Smart Notifications", desc: "Automated email and SMS alerts for payment confirmations, due dates, overdue reminders, and approvals.", image: "/images/landing/feature-notifications.jpg" },
  { icon: Shield, title: "Role-Based Access", desc: "Secure RBAC with Admin, Owner, Agent, and Tenant roles. Audit logs for full accountability and transparency.", image: "/images/landing/feature-security.jpg" },
];

const howItWorksData = [
  { icon: Search, title: "Browse Listings", desc: "Explore houses and condominium units with photos, pricing, and location details.", num: 1, image: "/images/landing/step-browse.jpg" },
  { icon: KeyRound, title: "Move In", desc: "Agents register tenants, assign units, and manage contracts pending owner approval.", num: 2, image: "/images/landing/step-movein.jpg" },
  { icon: CreditCard, title: "Pay Online", desc: "Tenants upload receipts. Owners verify. Balances update automatically in real-time.", num: 3, image: "/images/landing/step-pay.jpg" },
  { icon: BarChart3, title: "Track Everything", desc: "Dashboards show receivables, occupancy, and performance. Generate reports instantly.", num: 4, image: "/images/landing/step-track.jpg" },
];

// ─── Local images (downloaded into public/images/landing) ───
const unitImages = [
  "/images/landing/prop-1.jpg",
  "/images/landing/prop-2.jpg",
  "/images/landing/prop-3.jpg",
  "/images/landing/prop-4.jpg",
  "/images/landing/prop-5.jpg",
  "/images/landing/prop-6.jpg",
];

// Tenant benefits strip
const tenantBenefits = [
  { icon: MapPin, title: "Prime Locations", desc: "Near schools, malls, and business districts" },
  { icon: Shield, title: "Secure & Verified", desc: "Gated communities with strict screening" },
  { icon: Wifi, title: "Fast Internet", desc: "Fiber-ready units for work-from-home" },
  { icon: PawPrint, title: "Pet Friendly", desc: "Many units welcome your furry friends" },
  { icon: Car, title: "Parking Available", desc: "Designated slots and garages" },
  { icon: Clock, title: "24/7 Support", desc: "Responsive agents & maintenance help" },
];

// Normal app theme styles (matches login/dashboard pages)
const card = "rounded-2xl border border-border bg-white/80 backdrop-blur-sm shadow-card";
const chip = "inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium mb-4 text-primary-600";
const heading = "text-3xl sm:text-4xl font-bold text-text-primary";
const sub = "mt-4 text-lg max-w-2xl mx-auto text-text-secondary";

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [units, setUnits] = useState<any[]>([]);

  // Redirect to dashboard if the user is already logged in (including on refresh)
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  // Resolve navbar href so Dashboard goes to Sign In when logged out
  const hrefFor = (item: { label: string; href: string }) =>
    item.label === "Dashboard" && !user ? "/login?mode=signin" : item.href;

  // Fetch real units from the database
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data/units");
        const data = await res.json();
        if (data.success && data.units.length > 0) {
          setUnits(data.units);
        }
      } catch (e) {
        // silently fail — units section will show "No units yet"
      }
    })();
  }, []);

  return (
    <main className="relative min-h-screen bg-surface-secondary text-text-primary overflow-x-hidden">
      {/* ─── Landing page background displayed across the whole page ─── */}
      <div className="fixed inset-0 -z-10">
        <Image src="/images/favicon/landingpage.png" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-secondary/90 via-surface-secondary/80 to-surface-secondary/90" />
      </div>

      {/* ─── Navigation ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 border-b border-border bg-surface/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl">
              <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold text-text-primary">Rent<span className="text-primary-500">Track</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={hrefFor(item)} className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary relative group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 rounded-full group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login?mode=signin"><Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary hover:bg-surface-tertiary">Sign In</Button></Link>
            <Link href="/login?mode=signup"><Button size="sm" className="group bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30">Get Started<ArrowUpRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Button></Link>
          </div>

          <button onClick={() => document.getElementById("mobile-menu")?.classList.toggle("hidden")} className="md:hidden p-2 rounded-lg hover:bg-surface-tertiary transition-colors text-text-secondary">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div id="mobile-menu" className="hidden md:hidden pb-4 space-y-2">
          {navItems.map((item) => (
            <a key={item.label} href={hrefFor(item)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-surface-tertiary">{item.label}</a>
          ))}
          <div className="pt-2 px-4 space-y-2">
            <Link href="/login"><Button variant="outline" className="w-full border-border text-text-primary hover:bg-surface-tertiary">Sign In</Button></Link>
            <Link href="/login"><Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">Get Started</Button></Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero (uses the uploaded landingpage.png background) ─── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.08, 1], x: [0, -12, 0], y: [0, -8, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/images/favicon/landingpage.png" alt="Rental properties background" fill className="object-cover" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/70" />
        <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 right-[15%] w-80 h-80 rounded-full bg-secondary-500/20 blur-3xl" />
        <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 left-[40%] w-72 h-72 rounded-full bg-accent-500/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white mb-8">
            <Home className="h-4 w-4 text-primary-300" />HedgeHomes Realty and Brokerage — Find your next home
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            <span className="text-white">Find Your Perfect</span><br /><span className="bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-300 bg-clip-text text-transparent">Rental Home</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Browse verified houses and condominium units. Pay rent online, track your balance, and get instant notifications — all from one simple platform.
          </motion.p>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 mx-auto max-w-2xl bg-white/95 backdrop-blur-md rounded-full shadow-lg p-1.5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-1 text-left">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
              <Search className="h-4 w-4 text-primary-600 shrink-0" />
              <input placeholder="Butuan City" className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
              <Home className="h-4 w-4 text-primary-600 shrink-0" />
              <input placeholder="House / Condo / Studio" className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
            </div>
            <a href="#units">
              <Button size="sm" className="w-full sm:w-auto h-full rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/30">Search</Button>
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login"><Button size="lg" className="group h-12 px-8 text-base bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/40 hover:shadow-primary-600/60 transition-all">Create Free Account<ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
            <a href="#units"><Button size="lg" className="h-12 px-8 text-base border-2 border-white bg-black/30 backdrop-blur-sm text-white font-semibold hover:bg-black/50">Browse Units</Button></a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Happy Tenants" },
              { value: "50+", label: "Verified Units" },
              { value: "100%", label: "Online Payments" },
              { value: "24/7", label: "Tenant Support" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{stat.value}</div>
                <div className="mt-1 text-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Why Tenants Choose Us ─── */}
      <section id="why-us" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/images/Move-in%20Ready.png" alt="Move-in Ready property" width={800} height={600} className="w-full h-auto object-cover" loading="lazy" />
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-4 sm:-right-6 bg-surface rounded-2xl shadow-card-hover border border-border p-4 flex items-center gap-3 max-w-[280px]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-50">
                  <KeyRound className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-primary">Move-in Ready</div>
                  <div className="text-xs text-text-tertiary">Verified & fully inspected</div>
                </div>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className={chip}><Sparkles className="h-4 w-4" />Why Tenants Love Us</span>
              <h2 className={heading}>A Better Way to <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Find & Pay for Your Home</span></h2>
              <p className={sub + " !max-w-lg !mx-0"}>No more confusing listings or messy manual rent payments. We connect tenants with verified landlords and make everything digital.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {tenantBenefits.map((b, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={cn("p-4 flex items-start gap-3", card)}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                      <b.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{b.title}</h3>
                      <p className="text-xs mt-0.5 text-text-secondary">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={chip}><Sparkles className="h-4 w-4" />Everything You Need</span>
            <h2 className={heading}>Powerful Features for <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Smart Management</span></h2>
            <p className={sub}>From property tracking to payment verification, RentTrack covers every aspect of rental management with an intuitive, role-based interface.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((feature, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn("group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover", card)}>
                <div className="relative h-44 overflow-hidden">
                  <Image src={feature.image} alt={feature.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow">
                    <feature.icon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Units Preview (from DB only — real units) ─── */}
      <section id="units" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={chip}><Building2 className="h-4 w-4" />Available Now</span>
            <h2 className={heading}>Units <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">For Rent</span></h2>
            <p className={sub}>Browse verified houses and condominium units. New units are added regularly.</p>
          </div>

          {units.length === 0 ? (
            <div className={cn("text-center py-16", card)}>
              <div className="relative w-40 h-40 mx-auto mb-6 rounded-2xl overflow-hidden">
                <Image src="/images/landing/keys.jpg" alt="Ready for new tenants" fill className="object-cover" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text-primary">Be One of Our First Tenants</h3>
              <p className="text-sm max-w-md mx-auto text-text-secondary">New verified units are being added. Sign up to get notified when new homes become available.</p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/login?mode=signup">
                  <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30">
                    Get Notified<ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {units.map((unit: any, i: number) => {
                  const status = unit.status || "vacant";
                  const isOccupied = status === "occupied";
                  const statusColor = isOccupied ? "text-green-700 bg-green-100" : "text-amber-700 bg-amber-100";
                  const img = unit.image_url || unitImages[i % unitImages.length];
                  // Handle both camelCase (client-side) and snake_case (raw DB) field names
                  const unitNumber = unit.unitNumber || unit.unit_number || "Unit";
                  const rentAmount = unit.rentAmount ?? unit.rent_amount ?? 0;
                  const rent = rentAmount ? `₱${Number(rentAmount).toLocaleString()}` : "₱0";
                  const propName = unit.propertyName || unit.property_name || unit.propertyId || unit.property_id || "—";
                  const tenantName = unit.tenantName || unit.tenant_name || unit.tenantId || unit.tenant_id || "— Vacant —";
                  return (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (i % 7) * 0.05 }}
                      className={cn("group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover", card)}
                    >
                      <div className="relative h-44 overflow-hidden">
                        <Image src={img} alt={`${unitNumber} photo`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                        <div className="absolute top-3 right-3">
                          <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", statusColor)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">{unitNumber}</h3>
                          <span className="text-sm font-semibold text-text-primary">{rent}<span className="text-xs text-text-tertiary">/mo</span></span>
                        </div>
                        <p className="text-sm mb-3 text-text-secondary">{propName}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                          <span className="text-text-tertiary">{tenantName}</span>
                          <span className="text-primary-600 font-medium">View Details →</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="text-center mt-10">
                <Link href="/login?mode=signin">
                  <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30">
                    Sign in to Manage <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={chip}><Users className="h-4 w-4" />Simple Process</span>
            <h2 className={heading}>Moving In Is <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Easy</span></h2>
            <p className={sub}>Get into your new home in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksData.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn("relative group overflow-hidden flex flex-col items-center text-center", card)}>
                <div className="relative w-full h-36 overflow-hidden">
                  <Image src={step.image} alt={step.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-bold shadow-lg">{step.num}</div>
                </div>
                <div className="p-6 flex flex-col items-center">
                  <div className="-mt-10 relative mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
                      <step.icon className="h-7 w-7" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-text-primary">{step.title}</h3>
                  <p className="text-sm leading-relaxed max-w-xs text-text-secondary">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tenant CTA ─── */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 px-6 py-16 sm:px-16 text-center"
          >
            <div className="absolute inset-0 opacity-10">
              <Image src="/images/landing/hero-4.jpg" alt="" fill className="object-cover" />
            </div>
            <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute top-8 left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-8 right-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-6 text-secondary-300" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">Ready to Move In?</h2>
              <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-white/85">
                Create a free account today to browse units, submit rental applications, and pay your rent online — all in one place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?mode=signup">
                  <Button size="lg" className="h-12 px-8 text-base bg-white text-primary-700 hover:bg-slate-100 shadow-xl">
                    Get Started Free<ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" className="h-12 px-8 text-base border-2 border-white/70 bg-transparent text-white hover:bg-white/10">Contact an Agent</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section id="contact" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={chip}><Mail className="h-4 w-4" />Contact Us</span>
            <h2 className={heading}>Get in <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Touch</span></h2>
            <p className={sub}>Have questions about RentTrack? Our team is ready to help.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cn("p-8 text-center", card)}>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-text-primary">Location</h3>
              <p className="text-sm leading-relaxed text-text-secondary">Butuan City, Agusan del Norte, Philippines</p>
            </div>
            <div className={cn("p-8 text-center", card)}>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-text-primary">Email</h3>
              <p className="text-sm leading-relaxed text-text-secondary">admin@renttrack.com</p>
            </div>
            <div className={cn("p-8 text-center", card)}>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-text-primary">Support</h3>
              <p className="text-sm leading-relaxed text-text-secondary">We typically respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer id="footer" className="border-t border-border bg-white/80 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                  <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-text-primary">Rent<span className="text-primary-500">Track</span></span>
              </Link>
              <p className="text-sm max-w-md leading-relaxed text-text-secondary">
                HedgeHomes Realty and Brokerage — powered by RentTrack. A Rental Payment, Receivables, and Property Monitoring System for House and Condominium Room Rentals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-text-primary">Quick Links</h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a href={hrefFor(item)} className="text-sm text-text-secondary transition-colors hover:text-text-primary">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-text-primary">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-text-secondary"><MapPin className="h-4 w-4 text-primary-600" /> Butuan City, Agusan del Norte, Philippines</li>
                <li className="flex items-center gap-2 text-sm text-text-secondary"><Mail className="h-4 w-4 text-primary-600" /> admin@renttrack.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center text-sm text-text-tertiary">
            © {new Date().getFullYear()} RentTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

