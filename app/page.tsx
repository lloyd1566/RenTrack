"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bell, Shield, MapPin, Home, Search, Menu, ChevronRight, Star, Phone, Mail, KeyRound, CreditCard, BarChart3, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "#properties" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Destinations", href: "#destinations" },
  { label: "Contact", href: "#contact" },
  { label: "About", href: "#about" },
];

const unitImages = [
  "/images/landing/prop-1.jpg",
  "/images/landing/prop-2.jpg",
  "/images/landing/prop-3.jpg",
  "/images/landing/prop-4.jpg",
  "/images/landing/prop-5.jpg",
  "/images/landing/prop-6.jpg",
];

const heroImages = [
  "/images/favicon/landingpage.png",
  "/images/landingpage2.png",
];

const fallbackHeroImage = "/images/favicon/landingpage.png";

const landingBanners = [
  "/images/favicon/landingpage.png",
  "/images/landingpage2.png",
];

const fallbackBannerImage = "/images/favicon/landingpage.png";

const destinations = [
  { name: "Cebu", region: "Central Visayas", image: "/images/favicon/Cebu.webp" },
  { name: "Manila", region: "National Capital Region", image: "/images/favicon/Manila.jpg" },
  { name: "Butuan", region: "Agusan del Norte", image: "/images/favicon/Butuan City.webp" },
  { name: "Davao", region: "Davao Region", image: "/images/favicon/Davao.jpg" },
];

const steps = [
  { icon: Search, title: "Browse Listings", desc: "Explore houses and condominium units with photos, pricing, and location details.", image: "/images/landing/step-browse.jpg" },
  { icon: KeyRound, title: "Move In", desc: "Agents register tenants, assign units, and manage contracts pending owner approval.", image: "/images/landing/step-movein.jpg" },
  { icon: CreditCard, title: "Pay Online", desc: "Tenants upload receipts. Owners verify. Balances update automatically in real-time.", image: "/images/landing/step-pay.jpg" },
  { icon: BarChart3, title: "Track Everything", desc: "Dashboards show receivables, occupancy, and performance. Generate reports instantly.", image: "/images/landing/step-track.jpg" },
];

const features = [
  { icon: Building2, title: "Property Management", desc: "Manage multiple properties and units across different locations. Track occupancy, maintenance, and lease details.", image: "/images/landing/feature-property.jpg" },
  { icon: Users, title: "Tenant Management", desc: "Register tenants, assign units, manage contracts, and maintain complete tenant profiles with ease.", image: "/images/landing/feature-tenant.jpg" },
  { icon: CreditCard, title: "Payment Tracking", desc: "Full, partial, and advance payment support. Upload receipts, auto-calculate balances, and maintain ledgers.", image: "/images/landing/feature-payment.jpg" },
  { icon: BarChart3, title: "Dashboard Analytics", desc: "Real-time dashboards with charts, aging reports, and performance metrics tailored to each user role.", image: "/images/landing/feature-dashboard.jpg" },
  { icon: Bell, title: "Smart Notifications", desc: "Automated email and SMS alerts for payment confirmations, due dates, overdue reminders, and approvals.", image: "/images/landing/feature-notifications.jpg" },
  { icon: Shield, title: "Role-Based Access", desc: "Secure RBAC with Admin, Owner, Agent, and Tenant roles. Audit logs for full accountability and transparency.", image: "/images/landing/feature-security.jpg" },
];

export default function LandingPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [propRes, unitRes] = await Promise.all([
          fetch("/api/data/properties"),
          fetch("/api/data/units"),
        ]);
        const propData = await propRes.json();
        const unitData = await unitRes.json();
        console.log("Landing page properties:", propData);
        console.log("Landing page units:", unitData);
        if (propData.success && propData.properties.length > 0) {
          setProperties(propData.properties);
        }
        if (unitData.success && unitData.units.length > 0) {
          setUnits(unitData.units);
        }
      } catch (err) {
        console.error("Landing page fetch error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
      setIsImageLoaded(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % landingBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const displayUnits = units.slice(0, 6);
  const displayProperties = properties.slice(0, 6);

  return (
    <main className="relative min-h-screen bg-white text-gray-900 overflow-x-hidden pt-16">
      {/* â”€â”€â”€ Navigation â”€â”€â”€ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-black/30 backdrop-blur-sm"}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                  <Image src="/images/landing/logo.png" alt="RentTrack" fill className="object-contain" />
              </div>
              <span className={`text-lg font-bold ${scrolled ? "text-gray-900" : "text-white"}`}>Rent<span className="text-blue-600">Track</span></span>
            </Link>

            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className={`text-sm font-medium transition-all duration-200 hover:scale-110 ${scrolled ? "text-gray-600 hover:text-blue-600" : "text-white/90 hover:text-white"}`}>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="/login?mode=signin" className={`h-9 px-4 text-sm font-medium inline-flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 ${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/90 hover:text-white"}`}>
                Sign In
              </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a href="/login?mode=signup" className="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                  Register
                </a>
              </motion.div>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden p-2 rounded-lg transition-all duration-200 hover:scale-110 ${scrolled ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/10 text-white"}`}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${scrolled ? "border-gray-200 bg-white" : "border-white/10 bg-black/20 backdrop-blur-md"}`}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className={`block px-4 py-3 text-sm font-medium border-b border-gray-100 transition-colors ${scrolled ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                {item.label}
              </a>
            ))}
            <div className="px-4 py-3 space-y-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a href="/login?mode=signin" className={`w-full h-10 px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center justify-center transition-colors ${scrolled ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" : "border border-white/20 bg-white/10 text-white hover:bg-white/20"}`}>
                Sign In
              </a>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a href="/login?mode=signup" className="w-full h-10 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center transition-colors shadow-sm">
                  Register
                </a>
              </motion.div>
            </div>
          </div>
        )}
      </nav>

       {/* â”€â”€â”€ Hero â”€â”€â”€ */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={heroImages[heroIndex] || fallbackHeroImage}
            alt="Hero background"
            fill
            className="object-cover transition-opacity duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
              className="absolute w-2 h-2 bg-white/40 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-1.5 text-sm font-medium text-white mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Home className="h-4 w-4" />
              </motion.div>
              Find your next home
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6"
            >
              <span className="inline-block">The Philippines No.1 Trusted</span>
              <br />
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="inline-block bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto]"
              >
                Rental Property Marketplace
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-lg text-white/90 mb-8"
            >
              Find verified apartments, condos & houses for rent in Cebu, Manila, Butuan, and Davao.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.a
                href="/login?mode=signup"
                className="inline-flex h-12 px-8 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl items-center justify-center gap-2 shadow-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free<ChevronRight className="ml-2 h-4 w-4" />
              </motion.a>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroImages.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setHeroIndex(i); setIsImageLoaded(false); }}
              className={cn("h-2 rounded-full transition-all duration-300", i === heroIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80")}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </section>

      {/* â”€â”€â”€ Properties for Rent Near You â”€â”€â”€ */}
      <motion.section id="properties" className="py-10 bg-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <MapPin className="h-4 w-4" />Available Now
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Properties for Rent Near You</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Browse verified houses and condominium units. New units are added regularly.</p>
          </div>

          {displayProperties.length === 0 && displayUnits.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Home className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Be One of Our First Tenants</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">New verified units are being added. Sign up to get notified when new homes become available.</p>
              <div className="mt-5">
                <a href="/login?mode=signup" className="inline-flex h-9 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg items-center justify-center gap-2 shadow-sm transition-colors">
                Get Notified<ChevronRight className="ml-2 h-4 w-4" />
              </a>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {displayProperties.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Properties</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayProperties.map((property: any, i: number) => {
                      const img = property.imageUrl || property.image_url || unitImages[i % unitImages.length];
                      const location = property.location || "Cebu, Manila, Butuan, Davao";
                      const propertyType = property.type === "condominium" ? "Condominium" : "House";
                      return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                    <motion.div
                      className="relative h-full w-full"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <Image src={img} alt={property.name} fill className="object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </motion.div>
                    <div className="absolute top-3 right-3">
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.1 + 0.2 }}
                        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-100 capitalize"
                      >
                        {propertyType}
                      </motion.span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{property.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />{location}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{property.units || 0} Units</span>
                      <motion.span
                        whileHover={{ x: 4 }}
                        className="text-blue-600 font-medium cursor-pointer"
                      >
                        View Details →
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {displayUnits.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Units</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayUnits.map((unit: any, i: number) => {
                      const status = unit.status || "vacant";
                      const isOccupied = status === "occupied";
                      const img = unit.imageUrl || unit.image_url || unitImages[i % unitImages.length];
                      const unitNumber = unit.unitNumber || unit.unit_number || "Unit";
                      const rentAmount = unit.rentAmount ?? unit.rent_amount ?? 0;
                      const rent = rentAmount ? `â‚±${Number(rentAmount).toLocaleString()}` : "â‚±0";
                      const propName = unit.propertyName || unit.property_name || unit.propertyId || unit.property_id || "â€”";
                      return (
                        <motion.div
                          key={unit.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          whileHover={{ y: -8 }}
                          className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                        >
                          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                            <motion.div
                              className="relative h-full w-full"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                              <Image src={img} alt={`${unitNumber} photo`} fill className="object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </motion.div>
                            <div className="absolute top-3 right-3">
                              <motion.span
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: i * 0.1 + 0.2 }}
                                className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium", isOccupied ? "text-green-700 bg-green-100" : "text-amber-700 bg-amber-100")}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </motion.span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{unitNumber}</h3>
                              <span className="text-lg font-semibold text-blue-600">{rent}<span className="text-xs text-gray-400">/mo</span></span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />{propName}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{isOccupied ? "Occupied" : "Vacant"}</span>
                              <motion.span
                                whileHover={{ x: 4 }}
                                className="text-blue-600 font-medium cursor-pointer"
                              >
                                View Details →
                              </motion.span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* â”€â”€â”€ Be One of Our First Tenants â”€â”€â”€ */}
      <motion.section className="py-10 bg-blue-600" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">Be One of Our First Tenants</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">New verified units are being added. Sign up to get notified when new homes become available.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/login?mode=signup" className="inline-flex h-11 px-6 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl items-center justify-center gap-2 shadow-xl transition-colors">
              Get Notified<ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ How It Works â”€â”€â”€ */}
      <motion.section id="how-it-works" className="py-16 bg-gray-50" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Star className="h-4 w-4" />How It Works
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Renting Made Simple</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">From browsing to moving in, we make the rental process seamless</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative h-full w-full"
                  >
                    <Image src={step.image} alt={step.title} fill className="object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </motion.div>
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold"
                    >
                      {i + 1}
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ Most Popular Destinations â”€â”€â”€ */}
      <motion.section id="destinations" className="py-16 bg-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Star className="h-4 w-4" />Destinations
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Most Popular Destinations</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Explore rental properties in the Philippines most sought-after locations</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {destinations.map((dest, i) => (
                <motion.div
                  key={dest.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-full w-full bg-gradient-to-br from-blue-100 to-indigo-100">
                    <motion.img
                      src={dest.image}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                      <h3 className="text-sm font-bold text-white drop-shadow-lg">{dest.name}</h3>
                      <p className="text-xs text-white/90 mt-0.5 font-medium">{dest.region}</p>
                    </div>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ Features â”€â”€â”€ */}
      <motion.section id="about" className="py-16 bg-gray-50" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Shield className="h-4 w-4" />Features
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Manage Rentals</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Powerful tools for property owners, agents, and tenants</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative h-full w-full"
                  >
                    <Image src={feature.image} alt={feature.title} fill className="object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </motion.div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                    >
                      <feature.icon className="h-5 w-5" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ CTA â”€â”€â”€ */}
      <motion.section className="relative py-16 bg-blue-600 overflow-hidden" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -15, 0],
                x: [0, 8, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
              className="absolute w-2 h-2 bg-white/50 rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 4) * 20}%`,
              }}
            />
          ))}
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4"
          >
            Ready to Find Your Home?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-blue-100 mb-8 max-w-xl mx-auto"
          >
            Create a free account today to browse units, submit rental applications, and pay your rent online — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex"
          >
            <motion.a
              href="/login?mode=signup"
              className="inline-flex h-12 px-8 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl items-center justify-center gap-2 shadow-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free<ChevronRight className="ml-2 h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ Contact â”€â”€â”€ */}
      <motion.section id="contact" className="py-16 bg-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Mail className="h-4 w-4" />Contact Us
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Have questions about RentTrack? Our team is ready to help.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Location</h3>
               <p className="text-sm text-gray-600">Cebu, Manila, Butuan, Davao, Philippines</p>
            </div>
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Email</h3>
              <p className="text-sm text-gray-600">admin@renttrack.com</p>
            </div>
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Support</h3>
              <p className="text-sm text-gray-600">We typically respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ Footer â”€â”€â”€ */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="relative h-9 w-9">
                <Image src="/images/landing/logo.png" alt="RentTrack" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-gray-900">Rent<span className="text-blue-600">Track</span></span>
              </Link>
              <p className="text-sm text-gray-600 max-w-md">
                HedgeHomes Realty and Brokerage â€” powered by RentTrack. A Rental Payment, Receivables, and Property Monitoring System for House and Condominium Room Rentals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-900">Quick Links</h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-900">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4 text-blue-600" /> Cebu, Manila, Butuan, Davao, Philippines</li>
                <li className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-4 w-4 text-blue-600" /> admin@renttrack.com</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} RentTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
