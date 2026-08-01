"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, Users, CreditCard, BarChart3, Bell, Shield, ChevronRight, ArrowUpRight, Menu, X, Sparkles, MapPin, Mail, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Units", href: "#dashboard-preview" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Dashboard", href: "/" },
  { label: "Contact", href: "#contact" },
];

const featureList = [
  { icon: Building2, title: "Property Management", desc: "Manage multiple properties and units across different locations. Track occupancy, maintenance, and lease details." },
  { icon: Users, title: "Tenant Management", desc: "Register tenants, assign units, manage contracts, and maintain complete tenant profiles with ease." },
  { icon: CreditCard, title: "Payment Tracking", desc: "Full, partial, and advance payment support. Upload receipts, auto-calculate balances, and maintain ledgers." },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Real-time dashboards with charts, aging reports, and performance metrics tailored to each user role." },
  { icon: Bell, title: "Smart Notifications", desc: "Automated email and SMS alerts for payment confirmations, due dates, overdue reminders, and approvals." },
  { icon: Shield, title: "Role-Based Access", desc: "Secure RBAC with Admin, Owner, Agent, and Tenant roles. Audit logs for full accountability and transparency." },
];

const howItWorksData = [
  { title: "Find Your Home", desc: "Browse houses and condo units with clear pricing, photos, and availability — pick the place that fits your lifestyle.", num: 1, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80" },
  { title: "Move In Fast", desc: "Register and apply in minutes with a simple, paperless process — get approved and move in without the hassle.", num: 2, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { title: "Pay in a Tap", desc: "Upload your rent receipts in seconds, track your balance in real-time, and never lose a payment record again.", num: 3, img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80" },
  { title: "Live Worry-Free", desc: "Get instant confirmations, due-date reminders, and a transparent history of every transaction — all in one app.", num: 4, img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80" },
];

// ─── Unsplash images for property cards ───
const unitImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80",
];

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  // Redirect to dashboard if the user is already logged in (including on refresh)
  useEffect(() => {
    const session = localStorage.getItem("renttrack_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.id) {
          router.replace("/dashboard");
        }
      } catch {
        // invalid session — ignore
      }
    }
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("landing_theme");
    if (saved !== null) setIsDark(saved === "dark");
    setMounted(true);
  }, []);

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

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("landing_theme", next ? "dark" : "light");
  };

  // Theme-aware styles
  const theme = {
    pageBg: isDark ? "bg-slate-950" : "bg-slate-100",
    textPrimary: isDark ? "text-white" : "text-slate-900",
    textSecondary: isDark ? "text-slate-300" : "text-slate-600",
    textTertiary: isDark ? "text-slate-400" : "text-slate-500",
    navBg: isDark ? "bg-slate-950/80" : "bg-white/80",
    navBorder: isDark ? "border-slate-800" : "border-slate-200",
    cardBg: isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200",
    cardShadow: isDark ? "shadow-xl shadow-black/30" : "shadow-xl shadow-slate-200",
    cardIconBg: isDark ? "bg-primary-500/30" : "bg-primary-100",
    cardIconColor: isDark ? "text-primary-300" : "text-primary-700",
    chipBg: isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white",
    sectionHeading: isDark ? "text-white" : "text-slate-900",
    footerBg: isDark ? "bg-slate-950 border-slate-800" : "bg-slate-900 border-slate-700",
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <main className={cn("min-h-screen relative transition-colors duration-300", theme.pageBg)}>
      {/* Fixed background with subtle pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={cn(
          "absolute inset-0 opacity-[0.03]",
          isDark ? "bg-white" : "bg-slate-900"
        )} style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {isDark && (
          <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-b from-primary-900/40 via-transparent to-secondary-900/40" />
        )}
      </div>

      <div className="relative z-10">
        {/* ─── Navigation ─── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 border-b backdrop-blur-xl transition-colors duration-300", theme.navBg, theme.navBorder)}
        >
          <div className="mx-auto max-w-7xl flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
              </div>
              <span className={cn("text-lg font-bold", theme.textPrimary)}>Rent<span className="text-primary-500">Track</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className={cn("text-sm font-medium transition-colors relative group", theme.textSecondary, isDark ? "hover:text-white" : "hover:text-slate-900")}>
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 rounded-full group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={toggleTheme} aria-label="Toggle theme"
                className={cn("p-2 rounded-lg transition-colors", isDark ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200")}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/login?mode=signin"><Button variant="ghost" size="sm" className={cn(isDark ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200")}>Sign In</Button></Link>
              <Link href="/login?mode=signup"><Button size="sm" className="group bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30">Get Started<ArrowUpRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Button></Link>
            </div>

            <button onClick={() => document.getElementById("mobile-menu")?.classList.toggle("hidden")} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300">
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div id="mobile-menu" className="hidden md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className={cn("block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", theme.textSecondary, isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-200")}>{item.label}</a>
            ))}
            <div className="pt-2 px-4 space-y-2">
              <Link href="/login"><Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-100">Sign In</Button></Link>
              <Link href="/login"><Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">Get Started</Button></Link>
            </div>
          </div>
        </motion.nav>

        {/* ─── Hero ─── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0">
            <Image src="/images/favicon/landingpage.png" alt="Rental properties background" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/70" />
          </div>
          <motion.div animate={{ x: [0, 30, 0], y: [0, -40, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary-500/20 blur-3xl" />
          <motion.div animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 right-[15%] w-80 h-80 rounded-full bg-secondary-500/20 blur-3xl" />
          <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 left-[40%] w-72 h-72 rounded-full bg-accent-500/15 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white mb-8">
              <Sparkles className="h-4 w-4 text-primary-300" />HedgeHomes Realty and Brokerage — by RentTrack
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              <span className="text-white">Streamline Your</span><br /><span className="bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-300 bg-clip-text text-transparent">Rental Management</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
              className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-white/95 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              Track payments, manage properties, and monitor receivables in real-time. From owner to tenant - every role, every transaction, every notification.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login"><Button size="lg" className="group h-12 px-8 text-base bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all">Get Started Free<ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
              <a href="#features"><Button size="lg" className="h-12 px-8 text-base border-2 border-white/80 bg-black/40 backdrop-blur-sm text-white font-semibold hover:bg-black/60 hover:border-white">Explore Features</Button></a>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: "100%", label: "Digital Tracking" },
                { value: "Real-time", label: "Notifications" },
                { value: "4 Roles", label: "User Access" },
                { value: "Zero", label: "Paper Records" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-4", theme.chipBg)}>Everything You Need</span>
              <h2 className={cn("text-3xl sm:text-4xl font-bold", theme.sectionHeading)}>Powerful Features for <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Smart Management</span></h2>
              <p className={cn("mt-4 text-lg max-w-2xl mx-auto", theme.textSecondary)}>From property tracking to payment verification, RentTrack covers every aspect of rental management with an intuitive, role-based interface.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureList.map((feature, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={cn("rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1", theme.cardBg, theme.cardShadow)}>
                  <div className={cn("mb-5 flex h-12 w-12 items-center justify-center rounded-xl", theme.cardIconBg)}>
                    <feature.icon className={cn("h-6 w-6", theme.cardIconColor)} />
                  </div>
                  <h3 className={cn("text-lg font-semibold mb-3", theme.textPrimary)}>{feature.title}</h3>
                  <p className={cn("text-sm leading-relaxed", theme.textSecondary)}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Units Preview (from DB) ─── */}
        <section id="dashboard-preview" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-4", theme.chipBg)}>Live Preview</span>
              <h2 className={cn("text-3xl sm:text-4xl font-bold", theme.sectionHeading)}>Units <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Preview</span></h2>
              <p className={cn("mt-4 text-lg max-w-2xl mx-auto", theme.textSecondary)}>Units added by the admin/owner — displayed live from the database.</p>
            </div>

            {units.length === 0 ? (
              <div className={cn("text-center py-20 rounded-2xl border", theme.cardBg, theme.cardShadow)}>
                <Building2 className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
                <h3 className={cn("text-xl font-semibold mb-2", theme.textPrimary)}>No Units Yet</h3>
                <p className={cn("text-sm max-w-md mx-auto", theme.textSecondary)}>Units will appear here once the admin/owner adds them from the dashboard.</p>
                <div className="mt-6">
                  <Link href="/login?mode=signin">
                    <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                      Sign in as Admin <ChevronRight className="ml-2 h-4 w-4" />
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
                    const statusColor = isOccupied ? "text-green-400 bg-green-500/10" : "text-amber-400 bg-amber-500/10";
                    const img = unitImages[i % unitImages.length];
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
                        className={cn("group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl", theme.cardBg, theme.cardShadow)}
                      >
                        <div className="relative h-44 overflow-hidden">
                          <img src={img} alt={unitNumber} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                          <div className="absolute top-3 right-3">
                            <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", statusColor)}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={cn("text-lg font-semibold", theme.textPrimary)}>{unitNumber}</h3>
                            <span className={cn("text-sm font-semibold", theme.textPrimary)}>{rent}<span className="text-xs text-text-tertiary">/mo</span></span>
                          </div>
                          <p className={cn("text-sm mb-3", theme.textSecondary)}>{propName}</p>
                          <div className={cn("flex items-center justify-between pt-3 border-t text-xs", isDark ? "border-slate-700" : "border-slate-100")}>
                            <span className={theme.textTertiary}>{tenantName}</span>
                            <span className="text-primary-500 font-medium">View Details →</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="text-center mt-10">
                  <Link href="/login?mode=signin">
                    <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                      Sign in to Manage <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-4", theme.chipBg)}>Tenant-Friendly Process</span>
              <h2 className={cn("text-3xl sm:text-4xl font-bold", theme.sectionHeading)}>Renting Made <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Easy</span></h2>
              <p className={cn("mt-4 text-lg max-w-2xl mx-auto", theme.textSecondary)}>From finding your perfect place to paying rent in seconds — everything you need in four simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksData.map((step, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn("relative flex flex-col items-center text-center p-6 rounded-2xl border", theme.cardBg, theme.cardShadow)}>
                  <div className="relative mb-6 w-full overflow-hidden rounded-2xl">
                    <img src={step.img} alt={step.title} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white text-sm font-bold shadow-lg">{step.num}</div>
                  </div>
                  <h3 className={cn("text-lg font-semibold mb-2", theme.textPrimary)}>{step.title}</h3>
                  <p className={cn("text-sm leading-relaxed max-w-xs", theme.textSecondary)}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <span className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-4", theme.chipBg)}>Get Started
            </span>
            <h2 className={cn("text-3xl sm:text-4xl font-bold", theme.sectionHeading)}>
              Ready to Take Control of Your <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Rental Management?</span>
            </h2>
            <p className={cn("mt-4 text-lg max-w-2xl mx-auto", theme.textSecondary)}>
              Join property owners who have streamlined their rental operations with RentTrack. Sign up in minutes and start managing everything from one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?mode=signup">
                <Button size="lg" className="group h-12 px-8 text-base bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                  Get Started Free<ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login?mode=signin">
                <Button size="lg" className="h-12 px-8 text-base border-2 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Contact ─── */}
        <section id="contact" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className={cn("inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-4", theme.chipBg)}>Contact Us</span>
              <h2 className={cn("text-3xl sm:text-4xl font-bold", theme.sectionHeading)}>Get in <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Touch</span></h2>
              <p className={cn("mt-4 text-lg max-w-2xl mx-auto", theme.textSecondary)}>Have questions about RentTrack? Our team is ready to help.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cn("rounded-2xl border p-8 text-center", theme.cardBg, theme.cardShadow)}>
                <div className={cn("mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl", theme.cardIconBg)}>
                  <MapPin className={cn("h-6 w-6", theme.cardIconColor)} />
                </div>
                <h3 className={cn("text-lg font-semibold mb-3", theme.textPrimary)}>Location</h3>
                <p className={cn("text-sm leading-relaxed", theme.textSecondary)}>Butuan City, Philippines</p>
              </div>
              <div className={cn("rounded-2xl border p-8 text-center", theme.cardBg, theme.cardShadow)}>
                <div className={cn("mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl", theme.cardIconBg)}>
                  <Mail className={cn("h-6 w-6", theme.cardIconColor)} />
                </div>
                <h3 className={cn("text-lg font-semibold mb-3", theme.textPrimary)}>Email</h3>
                <p className={cn("text-sm leading-relaxed", theme.textSecondary)}>hello@renttrack.ph</p>
              </div>
              <div className={cn("rounded-2xl border p-8 text-center", theme.cardBg, theme.cardShadow)}>
                <div className={cn("mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl", theme.cardIconBg)}>
                  <Bell className={cn("h-6 w-6", theme.cardIconColor)} />
                </div>
                <h3 className={cn("text-lg font-semibold mb-3", theme.textPrimary)}>Support</h3>
                <p className={cn("text-sm leading-relaxed", theme.textSecondary)}>We typically respond within 24 hours.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer id="footer" className={cn("border-t py-12", theme.footerBg)}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                    <Image src="/images/favicon/logo.png" alt="RentTrack Logo" fill className="object-contain" />
                  </div>
                  <span className={cn("text-lg font-bold", theme.textPrimary)}>Rent<span className="text-primary-500">Track</span></span>
                </Link>
                <p className={cn("text-sm max-w-md leading-relaxed", theme.textSecondary)}>
                  HedgeHomes Realty and Brokerage — powered by RentTrack. A Rental Payment, Receivables, and Property Monitoring System for House and Condominium Room Rentals.
                </p>
              </div>
              <div>
                <h4 className={cn("font-semibold text-sm mb-4", theme.textPrimary)}>Quick Links</h4>
                <ul className="space-y-3">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className={cn("text-sm transition-colors", theme.textSecondary, isDark ? "hover:text-white" : "hover:text-slate-900")}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={cn("font-semibold text-sm mb-4", theme.textPrimary)}>Contact</h4>
                <ul className="space-y-3">
                  <li className={cn("flex items-center gap-2 text-sm", theme.textSecondary)}><MapPin className="h-4 w-4 text-primary-500" /> Butuan City, Philippines</li>
                  <li className={cn("flex items-center gap-2 text-sm", theme.textSecondary)}><Mail className="h-4 w-4 text-primary-500" /> hello@renttrack.ph</li>
                </ul>
              </div>
            </div>
            <div className={cn("mt-10 pt-6 border-t text-center text-sm", theme.textTertiary, isDark ? "border-slate-800" : "border-slate-200")}>
              © {new Date().getFullYear()} RentTrack. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
