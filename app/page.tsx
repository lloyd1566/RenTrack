"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Bell, Shield, MapPin, Home, Search, Menu, ChevronRight, Star, Phone, Mail, KeyRound, CreditCard, BarChart3, Building2, Users, X, UserPlus, BedDouble, Bath, Car, Grid2X2, Ruler, Wifi, Snowflake, Sofa, Utensils, WashingMachine, TreePine, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import UnitImageCarousel from "@/components/unit-image-carousel";

const DestinationsMap = dynamic(() => import("@/components/destinations-map"), { ssr: false });

const navItems = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "#properties" },
  { label: "Destinations", href: "#destinations" },
  { label: "Contact", href: "#contact" },
  { label: "About", href: "#about" },
];

const unitImages = [
  "/images/landing/feature-property.jpg",
  "/images/landing/feature-tenant.jpg",
  "/images/landing/feature-payment.jpg",
  "/images/landing/feature-dashboard.jpg",
  "/images/landing/feature-notifications.jpg",
  "/images/landing/feature-security.jpg",
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
const CHAT_DRAFT_KEY = "renttrack_chat_draft";

const destinations = [
  { name: "Cebu", region: "Central Visayas", image: "/images/favicon/Cebu.webp" },
  { name: "Manila", region: "National Capital Region", image: "/images/favicon/Manila.jpg" },
  { name: "Butuan", region: "Agusan del Norte", image: "/images/favicon/Agusan del Norte.jpg" },
  { name: "Davao", region: "Davao Region", image: "/images/favicon/Davao.jpg" },
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
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [propertyAgent, setPropertyAgent] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatUser, setChatUser] = useState({ name: "", email: "", phone: "" });
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);
  const [chatSelectedAgent, setChatSelectedAgent] = useState<any | null>(null);
  const chatInquiryIdsRef = useRef<string[]>([]);
  const chatReplyIdsRef = useRef<Set<string>>(new Set());
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatDraftLoadedRef = useRef(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showApplicationSuccess, setShowApplicationSuccess] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [agentApplication, setAgentApplication] = useState({ name: "", email: "", phone: "", address: "", gender: "", birthdate: "" });
  const [agentResume, setAgentResume] = useState<File | null>(null);
  const [agentApplicationSending, setAgentApplicationSending] = useState(false);

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

  useEffect(() => {
    (async () => {
      if (!selectedProperty?.agentId) {
        setPropertyAgent(null);
        return;
      }
      try {
        const res = await fetch(`/api/data/users/${selectedProperty.agentId}`);
        const data = await res.json();
        if (data.success) setPropertyAgent(data.user);
      } catch (err) {
        console.error("Failed to load property agent", err);
      }
    })();
  }, [selectedProperty?.agentId]);

  useEffect(() => {
    (async () => {
      if (showContactModal) {
        try {
          const res = await fetch("/api/auth/users/agents");
          const data = await res.json();
          if (data.success) setAgents(data.users);
        } catch (err) {
          console.error("Failed to load agents", err);
        }
      }
    })();
  }, [showContactModal]);

  useEffect(() => {
    (async () => {
      if (chatOpen) {
        try {
          const res = await fetch("/api/auth/users/agents");
          const data = await res.json();
          if (data.success) setAgents(data.users);
        } catch (err) {
          console.error("Failed to load agents for chat", err);
        }
      }
    })();
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      // Focus the message box after the panel is mounted so the launcher is
      // immediately usable with a keyboard or screen reader.
      requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  }, [chatOpen]);

  // Visitor replies are saved on the inquiry record. Poll only the inquiries
  // created in this browser so an agent response appears in the open chat.
  useEffect(() => {
    if (!chatOpen) return;
    const loadReplies = async () => {
      if (chatInquiryIdsRef.current.length === 0) return;
      try {
        const ids = chatInquiryIdsRef.current.join(",");
        const res = await fetch(`/api/chat/messages?ids=${encodeURIComponent(ids)}`, { cache: "no-store" });
        const data = await res.json();
        if (!data.success) return;
        const replies = (data.messages || []).filter((message: any) => message.replyText && !chatReplyIdsRef.current.has(message.id));
        if (replies.length === 0) return;
        replies.forEach((message: any) => chatReplyIdsRef.current.add(message.id));
        setChatMessages((previous) => [
          ...previous,
          ...replies.map((message: any) => ({ sender: "agent", text: message.replyText, createdAt: message.repliedAt || new Date().toISOString() })),
        ]);
      } catch {
        // A failed background poll should not interrupt composing a message.
      }
    };
    loadReplies();
    const interval = window.setInterval(loadReplies, 10000);
    return () => window.clearInterval(interval);
  }, [chatOpen]);

  useEffect(() => {
    try {
      const draft = window.sessionStorage.getItem(CHAT_DRAFT_KEY);
      if (draft) setChatInput(draft);
    } catch {
      // Storage can be unavailable in private browsing.
    } finally {
      chatDraftLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!chatDraftLoadedRef.current) return;
    try {
      if (chatInput) {
        window.sessionStorage.setItem(CHAT_DRAFT_KEY, chatInput);
      } else {
        window.sessionStorage.removeItem(CHAT_DRAFT_KEY);
      }
    } catch {
      // Storage can be unavailable in private browsing; the in-memory draft
      // still works normally in that case.
    }
  }, [chatInput]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const locations = Array.from(new Set(properties
    .map((property: any) => property.location || property.city || property.province)
    .filter(Boolean)));
  const propertyTypes = Array.from(new Set(properties.map((property: any) => property.type).filter(Boolean)));
  const minPrice = minPriceFilter ? Number(minPriceFilter) : 0;
  const maxPrice = maxPriceFilter ? Number(maxPriceFilter) : Number.POSITIVE_INFINITY;
  const matchesPropertyFilters = (property: any, unit?: any) => {
    const propertyName = property?.name || "";
    const propertyLocation = property?.location || property?.city || property?.province || unit?.location || unit?.propertyLocation || "";
    const propertyType = property?.type || unit?.type || "";
    const rentAmount = Number(unit?.rentAmount ?? unit?.rent_amount ?? property?.rentAmount ?? property?.monthlyRent ?? 0);
    const haystack = [propertyName, propertyLocation, property?.address, property?.city, property?.province, propertyType, unit?.unitNumber, unit?.unit_number, unit?.status]
      .filter(Boolean).join(" ").toLowerCase();
    return (!normalizedSearch || haystack.includes(normalizedSearch))
      && (!locationFilter || propertyLocation === locationFilter)
      && (!propertyTypeFilter || propertyType === propertyTypeFilter)
      && rentAmount >= minPrice
      && rentAmount <= maxPrice;
  };

  const filteredProperties = properties.filter((property: any) => matchesPropertyFilters(property));
  const displayProperties = filteredProperties.slice(0, 6);

  const submitAgentApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (agentApplicationSending) return;
    if (!agentResume) {
      toast.error("Please upload your resume (PDF or Word document)");
      return;
    }
    setAgentApplicationSending(true);
    try {
      const form = new FormData();
      Object.entries(agentApplication).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });
      form.append("resume", agentResume);
      const response = await fetch("/api/agent-applications", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Application failed");
      setShowAgentApplication(false);
      setAgentApplication({ name: "", email: "", phone: "", address: "", gender: "", birthdate: "" });
      setAgentResume(null);
      setShowApplicationSuccess(true);
      toast.success("Application submitted successfully! Our team will review your application.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application failed");
    } finally {
      setAgentApplicationSending(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900" suppressHydrationWarning>
      {/* â”€â”€â”€ Navigation â”€â”€â”€ */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md transition-colors duration-300 hover:bg-white/90">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <Link href="/" className="nav-letter-animate flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]">
              <div className="relative h-8 w-8">
                   <img src="/images/landing/logo.png" alt="RentTrack" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="text-lg font-bold text-slate-700 drop-shadow-sm">Rent<span className="text-slate-500">Track</span></span>
            </Link>

            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 md:flex lg:gap-7">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="nav-link-letter text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-950">
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button type="button" onClick={() => setShowAgentApplication(true)} className="inline-flex h-9 items-center justify-center rounded-lg border border-white/35 bg-white/90 px-3 text-sm font-semibold text-blue-700 transition-all duration-200 hover:bg-white hover:shadow-md">
                <UserPlus className="mr-1.5 h-4 w-4" />Apply as Agent
              </button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/login?mode=signin" className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-950/20 transition-colors hover:bg-blue-500">
                  Sign In
                </Link>
              </motion.div>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="block border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
                {item.label}
              </a>
            ))}
            <div className="px-4 py-3 space-y-2">
              <Link href="/login?mode=signin" className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

       {/* â”€â”€â”€ Hero â”€â”€â”€ */}
      <section className="relative flex min-h-[460px] items-center justify-center overflow-hidden sm:min-h-[500px]">
         <motion.div
           className="absolute inset-0"
           animate={{ scale: [1, 1.05, 1] }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         >
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/favicon/Landing page and login page.png')" }} />
         </motion.div>
         <div className="absolute inset-0 bg-black/15" />

         <motion.div
           initial={{ opacity: 0, y: 22 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.75, delay: 0.15 }}
           className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8"
         >
           <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
             <motion.div
               initial={{ opacity: 0, y: 18, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ duration: 0.55, delay: 0.25 }}
               className="mb-5 inline-flex items-center gap-2 rounded-lg border border-blue-200/30 bg-blue-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-50 backdrop-blur-md"
             >
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
              >
                 <Home className="h-3.5 w-3.5" />
               </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
              >
                HedgeHomes Realty & Brokerage
              </motion.span>
            </motion.div>

             <motion.h1
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.65, delay: 0.35 }}
               className="mb-4 max-w-xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
             >
               <span className="inline-block">Rental Property Marketplace</span>
             </motion.h1>

             <motion.p
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.65, delay: 0.45 }}
               className="mb-7 max-w-xl text-base leading-7 text-blue-50 sm:text-lg"
             >
               Find verified apartments, condos & houses for rent in Cebu, Manila, Butuan, and Davao.
             </motion.p>

             <motion.div
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.55 }}
               whileHover={{ scale: 1.03 }}
               whileTap={{ scale: 0.98 }}
               className="inline-flex"
             >
               <motion.a
                 href="#properties"
                 className="relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-lg bg-white px-6 text-sm font-semibold text-blue-700 shadow-xl transition-colors hover:bg-blue-50"
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <motion.span
                   className="absolute inset-0 bg-gradient-to-r from-blue-200/40 to-transparent"
                   animate={{ x: ["-100%", "100%"] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 />
                 <span className="relative z-10 inline-flex items-center gap-2">
                   Browse Properties
                   <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                     <ChevronRight className="h-4 w-4" />
                   </motion.div>
                 </span>
               </motion.a>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.7, delay: 0.7 }}
               className="hidden"
             >
               <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                 <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                 <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                   <motion.path d="M 60 90 Q 120 20 200 50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="8 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }} />
                   <motion.path d="M 200 50 Q 260 90 340 80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="8 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1.3, repeat: Infinity, repeatType: "reverse" }} />
                   <motion.path d="M 60 90 Q 100 140 160 120" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="8 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1.6, repeat: Infinity, repeatType: "reverse" }} />
                 </svg>
                 {[
                   { name: "Cebu", x: "15%", y: "60%", delay: 0.9 },
                   { name: "Butuan", x: "40%", y: "28%", delay: 1.1 },
                   { name: "Davao", x: "68%", y: "72%", delay: 1.3 },
                   { name: "Manila", x: "85%", y: "36%", delay: 1.5 },
                 ].map((city) => (
                   <motion.div
                     key={city.name}
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.5, delay: city.delay }}
                     className="absolute"
                     style={{ left: city.x, top: city.y, transform: "translate(-50%, -50%)" }}
                   >
                     <motion.div animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} className="absolute rounded-full bg-blue-400/60" style={{ width: 44, height: 44, marginLeft: -22, marginTop: -22 }} />
                     <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="relative flex flex-col items-center">
                       <div className="h-4 w-4 rounded-full bg-blue-400 shadow-lg shadow-blue-500/60 ring-2 ring-white/30" />
                       <span className="mt-1.5 whitespace-nowrap text-xs font-bold text-white drop-shadow-md sm:text-sm">{city.name}</span>
                     </motion.div>
                   </motion.div>
                 ))}
               </div>
               <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-3 text-xs font-medium text-white/70 sm:text-sm">
                 Active cities: Cebu • Manila • Butuan • Davao
               </motion.p>
             </motion.div>
           </div>
         </motion.div>
       </section>

       {/* Properties for Rent */}
      <motion.section id="properties" className="bg-white py-12 sm:py-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Explore RentTrack</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Featured Properties</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">New properties and available rental units from our owners.</p>
            </div>
            <a href="#contact" className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800">Need help finding a place? <span aria-hidden="true">→</span></a>
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(37,99,235,0.10)] sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1.8fr_1fr_1fr_auto_auto] xl:items-end">
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Location</span>
                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option value="">Any</option>
                  {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Property Type</span>
                <select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option value="">Any</option>
                  {propertyTypes.map((type) => <option key={type} value={type}>{type === "condominium" ? "Condominium" : type === "house" ? "House" : type}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Min. Price</span>
                <select value={minPriceFilter} onChange={(e) => setMinPriceFilter(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option value="">Any</option><option value="5000">₱5,000</option><option value="10000">₱10,000</option><option value="20000">₱20,000</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Max. Price</span>
                <select value={maxPriceFilter} onChange={(e) => setMaxPriceFilter(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option value="">Any</option><option value="10000">₱10,000</option><option value="20000">₱20,000</option><option value="50000">₱50,000</option>
                </select>
              </label>
              <button type="button" onClick={() => { setSearchTerm(""); setLocationFilter(""); setPropertyTypeFilter(""); setMinPriceFilter(""); setMaxPriceFilter(""); }}
                className="h-12 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700">CLEAR</button>
              <button type="button" onClick={() => document.getElementById("properties-results")?.scrollIntoView({ behavior: "smooth" })}
                className="h-12 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">SEARCH</button>
            </div>
            <div className="mt-4 flex max-w-md items-center gap-2 xl:hidden">
              <Search className="h-4 w-4 text-gray-500" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by property, city, or unit..."
                className="h-10 w-full border-b border-gray-300 text-sm outline-none focus:border-gray-900" />
            </div>
          </div>

          <div id="properties-results">
          {displayProperties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Home className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Be One of Our First Tenants</h3>
               <p className="text-sm text-gray-600 max-w-md mx-auto">New verified units are being added. Check back soon for available homes.</p>
               <div className="mt-5">
                 <a href="#contact" className="inline-flex h-9 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg items-center justify-center gap-2 shadow-sm transition-colors">
                 Contact Us<ChevronRight className="ml-2 h-4 w-4" />
               </a>
               </div>
            </div>
          ) : (
            <div className="space-y-10">
              {displayProperties.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {displayProperties.map((property: any, i: number) => {
                      const location = property.location || "Cebu, Manila, Butuan, Davao";
                      const propertyType = property.type === "condominium" ? "Condominium" : "House";
                      const propertyUnits = units.filter((unit: any) => (unit.propertyId || unit.property_id) === property.id);
                      const propertyImages = [
                        ...(Array.isArray(property.imageUrls) ? property.imageUrls : property.imageUrl ? [property.imageUrl] : []),
                        ...propertyUnits.flatMap((unit: any) => Array.isArray(unit.imageUrls) ? unit.imageUrls : unit.imageUrl ? [unit.imageUrl] : []),
                      ].filter((image, index, all) => Boolean(image) && all.indexOf(image) === index);
                      const img = propertyImages[0] || property.image_url || unitImages[i % unitImages.length];
                      const rents = propertyUnits.map((unit: any) => Number(unit.rentAmount ?? unit.rent_amount ?? 0)).filter(Boolean);
                      const price = rents.length ? Math.min(...rents) : Number(property.monthlyRevenue || 0);
                      const isAvailable = propertyUnits.length === 0 || propertyUnits.some((unit: any) => (unit.status || "vacant") === "vacant");
                      const bedrooms = (property.features || []).find((feature: string) => /bedroom/i.test(feature)) || "Bedrooms";
                      const bathrooms = (property.features || []).find((feature: string) => /bathroom/i.test(feature)) || "Bathrooms";
                      return (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.09 }}
                          whileHover={{ y: -6 }}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(37,99,235,0.14)]"
                        >
                          <div className="relative h-60 overflow-hidden bg-slate-100">
                            <motion.div className="relative h-full w-full" whileHover={{ scale: 1.04 }} transition={{ duration: 0.45, ease: "easeOut" }}>
                              <UnitImageCarousel images={propertyImages} fallbackImage={img} alt={property.name} className="h-full w-full" imageClassName="object-cover" />
                            </motion.div>
                            <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] items-start gap-1 rounded-[10px] bg-slate-900/85 px-3 py-2 text-xs font-bold uppercase leading-snug tracking-wide text-white shadow-sm backdrop-blur-sm">
                              <motion.span
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.25, delay: i * 0.09 + 0.12 }}
                                className="truncate text-white"
                              >
                                <><MapPin className="mr-1 mt-0.5 inline h-4 w-4 shrink-0 text-white" />{location}</>
                              </motion.span>
                            </div>
                          </div>
                          <div className="relative p-5">
                            <p className="text-2xl font-bold tracking-tight text-slate-950">₱{price.toLocaleString()}<span className="ml-1 text-sm font-medium text-slate-500">/mo</span></p>
                            <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-950 transition-colors group-hover:text-blue-700">{property.name} <span className="font-normal text-slate-500">— {propertyType} for Rent</span></h3>
                            <p className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide", isAvailable ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>{isAvailable ? "Available" : "Currently occupied"}</p>
                            <p className="mb-4 mt-3 flex items-start gap-1 text-sm leading-5 text-slate-700">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />{location}
                            </p>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
                              <span className="flex items-center gap-2 text-sm text-slate-700"><BedDouble className="h-4 w-4 text-blue-600" />{bedrooms} <Bath className="ml-2 h-4 w-4 text-blue-600" />{bathrooms}</span>
                              <motion.button whileHover={{ x: 4 }} onClick={() => setSelectedProperty(property)} className="font-semibold text-blue-600 transition-colors hover:text-blue-800">
                                View Details <span aria-hidden="true">→</span>
                              </motion.button>
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
        </div>
      </motion.section>

      {/* â”€â”€â”€ Most Popular Destinations â”€â”€â”€ */}
      <motion.section id="destinations" className="py-16 bg-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Star className="h-4 w-4" />Destinations
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Most Popular Destinations</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Explore rental properties in the Philippines&apos; most sought-after locations</p>
          </div>

          <div className="relative mx-auto h-[22rem] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-slate-100 shadow-lg shadow-blue-950/10 sm:h-[28rem] lg:h-[32rem]">
            <DestinationsMap />
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ Features â”€â”€â”€ */}
      <motion.section id="about" className="bg-gray-50 py-14 sm:py-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
              <Shield className="h-4 w-4" />Features
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-gray-900 sm:text-4xl">Everything You Need to Manage Rentals</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">Powerful tools for property owners, agents, and tenants</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09 }}
                whileHover={{ y: -8 }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative h-full w-full">
                    <img src={feature.image} alt={feature.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </motion.div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: i * 0.5 }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <feature.icon className="h-4 w-4" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
                <img src="/images/landing/logo.png" alt="RentTrack" className="w-full h-full object-contain rounded-full" />
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

      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProperty(null)} />
            <div className="relative w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[92vh]">
              <div className="relative h-64 bg-gray-100 sm:h-80">
                {(() => {
                  const relatedUnits = units.filter((unit: any) => (unit.propertyId || unit.property_id) === selectedProperty.id);
                  const images = [
                    ...(Array.isArray(selectedProperty.imageUrls) ? selectedProperty.imageUrls : selectedProperty.imageUrl ? [selectedProperty.imageUrl] : []),
                    ...relatedUnits.flatMap((unit: any) => Array.isArray(unit.imageUrls) && unit.imageUrls.length > 0 ? unit.imageUrls : unit.imageUrl ? [unit.imageUrl] : []),
                  ].filter((image, index, all) => Boolean(image) && all.indexOf(image) === index);
                  return <UnitImageCarousel images={images} alt={selectedProperty.name || selectedProperty.unitNumber || "Property image"} className="h-full w-full" />;
                })()}
                <button onClick={() => setSelectedProperty(null)} aria-label="Close property details" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm hover:bg-white hover:text-gray-950"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{selectedProperty.type || "Property"}</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight text-gray-950">{selectedProperty.name || selectedProperty.unitNumber || "Property Details"}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="h-4 w-4 shrink-0" />{selectedProperty.location || selectedProperty.propertyName || "Location not specified"}</p>
                </div>
                {(() => {
                  const selectedFeatures: string[] = Array.isArray(selectedProperty.features) ? selectedProperty.features : [];
                  const featureCards = selectedFeatures.map((feature: string) => {
                    const normalized = feature.toLowerCase();
                    const icon = normalized.includes("bedroom") ? BedDouble
                      : normalized.includes("bathroom") ? Bath
                      : normalized.includes("parking") || normalized.includes("car") ? Car
                      : normalized.includes("wi-fi") || normalized.includes("wifi") ? Wifi
                      : normalized.includes("air conditioning") ? Snowflake
                      : normalized.includes("furnished") ? Sofa
                      : normalized.includes("kitchen") ? Utensils
                      : normalized.includes("laundry") ? WashingMachine
                      : normalized.includes("outdoor") ? TreePine
                      : normalized.includes("gated") ? LockKeyhole
                      : normalized.includes("floor area") || normalized.includes("sqm") || normalized.includes("m²") ? Grid2X2
                      : normalized.includes("lot area") ? Ruler
                      : Home;
                    const label = normalized.includes("bedroom") ? "Bedrooms"
                      : normalized.includes("bathroom") ? "Bathrooms"
                      : normalized.includes("parking") || normalized.includes("car") ? "Car Parks"
                      : normalized.includes("wi-fi") || normalized.includes("wifi") ? "Wi-Fi"
                      : normalized.includes("air conditioning") ? "Air Conditioning"
                      : normalized.includes("furnished") ? "Furnished"
                      : normalized.includes("kitchen") ? "Kitchen"
                      : normalized.includes("laundry") ? "Laundry Area"
                      : normalized.includes("outdoor") ? "Outdoor Area"
                      : normalized.includes("gated") ? "Gated Property"
                      : feature.replace(/\d+/g, "").trim() || feature;
                    const numericValue = feature.match(/\d+(?:\.\d+)?/)?.[0];
                    const value = numericValue || (normalized.includes("parking") || normalized.includes("car") ? "1" : /^(yes|true)$/i.test(feature.trim()) ? "Yes" : feature.replace(/\d+/g, "").trim() === label ? "Yes" : feature.replace(new RegExp(label, "i"), "").trim() || "Yes");
                    return { feature, icon, label, value };
                  });
                  return featureCards.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {featureCards.map((featureCard: { feature: string; icon: React.ElementType; label: string; value: string }, index: number) => (
                        <div key={`${featureCard.feature}-${index}`} className="rounded-xl bg-gray-50 p-3 text-center sm:text-left">
                          <featureCard.icon className="mx-auto h-5 w-5 text-gray-950 sm:mx-0" />
                          <p className="mt-2 text-lg font-medium text-gray-950">{featureCard.value}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{featureCard.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className="grid grid-cols-2 gap-4 border-y border-gray-200 py-4">
                  <div><p className="text-xs font-medium text-gray-500">Availability</p><p className="mt-1 text-sm font-semibold text-emerald-700">{selectedProperty.availabilityStatus || "Available"}</p></div>
                  <div><p className="text-xs font-medium text-gray-500">Monthly Rent</p><p className="mt-1 text-lg font-bold text-gray-950">₱{(() => { const directRent = Number(selectedProperty.rentAmount || 0); if (directRent > 0) return directRent.toLocaleString(); const rents = units.filter((unit: any) => (unit.propertyId || unit.property_id) === selectedProperty.id).map((unit: any) => Number(unit.rentAmount ?? unit.rent_amount ?? 0)).filter((rent: number) => rent > 0); return (rents.length ? Math.min(...rents) : Number(selectedProperty.monthlyRevenue || 0)).toLocaleString(); })()}<span className="text-xs font-medium text-gray-500">/mo</span></p></div>
                </div>
                {selectedProperty.condition && <div><p className="text-xs font-medium text-gray-500">Condition</p><p className="mt-1 text-sm font-medium text-gray-950">{selectedProperty.condition}</p></div>}
                {selectedProperty.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedProperty.description}</p>
                  </div>
                )}
                {propertyAgent && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs text-blue-600 mb-2 font-medium">Assigned Agent</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                        {propertyAgent.name?.charAt(0)?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{propertyAgent.name}</p>
                        <p className="text-xs text-gray-600">{propertyAgent.email}</p>
                        {propertyAgent.phone && <p className="text-xs text-gray-600">{propertyAgent.phone}</p>}
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowContactModal(true)}
                  className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Contact Agent
                </button>
              </div>
              <div className="border-t border-gray-200 p-6 sm:px-8">
                <button onClick={() => setSelectedProperty(null)} className="h-11 w-full rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Agent Modal */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowContactModal(false); setSelectedAgent(null); }} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Agent</h3>
                <button onClick={() => { setShowContactModal(false); setSelectedAgent(null); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!selectedAgent ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Choose an agent to contact. You can view their details before sending a message.</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No agents available right now.</p>
                    ) : (
                      agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                            {agent.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                            <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold">
                        {selectedAgent.name?.charAt(0)?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{selectedAgent.name}</p>
                        <p className="text-xs text-gray-600">{selectedAgent.email}</p>
                        {selectedAgent.phone && <p className="text-xs text-gray-600">{selectedAgent.phone}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-1 font-medium text-gray-700 capitalize">{selectedAgent.role}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Agent ID:</span>
                        <span className="ml-1 font-medium text-gray-700">{selectedAgent.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-1 font-medium ${selectedAgent.idVerificationStatus === "approved" ? "text-green-600" : "text-yellow-600"}`}>
                          {selectedAgent.idVerificationStatus || "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cellphone Number</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                      placeholder="I'm interested in this property..."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowContactModal(false); setSelectedAgent(null); }} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                {selectedAgent && (
                  <button
                    onClick={async () => {
                      if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.message) {
                        alert("Please fill in your name, email, cellphone, and message");
                        return;
                      }
                      setContactSending(true);
                      try {
                        await fetch("/api/chat/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: `Contact Form Message:\n${contactForm.message}`,
                            propertyId: selectedProperty?.id || null,
                            senderName: contactForm.name,
                            senderEmail: contactForm.email,
                            senderPhone: contactForm.phone,
                          }),
                        });
                        setShowSuccessModal(true);
                        setContactForm({ name: "", email: "", phone: "", message: "" });
                        setSelectedAgent(null);
                      } catch {
                        alert("Failed to send message. Please try again.");
                      } finally {
                        setContactSending(false);
                      }
                    }}
                    disabled={contactSending}
                    className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {contactSending ? "Sending..." : "Send Message"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccessModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-sm text-gray-600 mb-6">Your message has been sent! An agent will contact you soon.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showApplicationSuccess && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="application-success-title">
            <motion.button
              type="button"
              aria-label="Close application submitted dialog"
              className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplicationSuccess(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-7 text-center shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h2 id="application-success-title" className="text-xl font-bold text-slate-900">Application submitted!</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Your application is now pending review. An owner will contact you using the email address you provided.</p>
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setShowApplicationSuccess(false)} className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Done</button>
                <button type="button" onClick={() => { setShowApplicationSuccess(false); document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" }); }} className="h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Browse rentals</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAgentApplication && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAgentApplication(false)} />
            <motion.form onSubmit={submitAgentApplication} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <button type="button" onClick={() => setShowAgentApplication(false)} className="absolute right-4 top-4 text-gray-500"><X className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold text-gray-900">Apply as an Agent</h2>
              <p className="mt-1 text-sm text-gray-500">Submit your information and resume for owner review.</p>
              <section className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Application Requirements</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">Please complete all required information and upload the necessary documents for your application to be reviewed.</p>
              </section>
              <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">Application Details</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 text-xs leading-5 text-gray-600 sm:grid-cols-2">
                  <p><span className="font-semibold text-gray-800">Application Date:</span> Recorded when your application is submitted.</p>
                  <p><span className="font-semibold text-gray-800">Application Status:</span> Tracks whether your application is pending, approved, or rejected.</p>
                  <p><span className="font-semibold text-gray-800">Applicant Information:</span> Includes the personal and contact details you provide.</p>
                  <p><span className="font-semibold text-gray-800">Resume:</span> Your uploaded PDF or Word document for owner review.</p>
                  <p className="sm:col-span-2"><span className="font-semibold text-gray-800">Review Notes:</span> Additional information recorded by the owner during the review process.</p>
                </div>
              </section>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input required placeholder="Full name *" value={agentApplication.name} onChange={(e) => setAgentApplication({ ...agentApplication, name: e.target.value })} className="h-11 rounded-lg border px-3 text-sm" />
                <input required type="email" placeholder="Email *" value={agentApplication.email} onChange={(e) => setAgentApplication({ ...agentApplication, email: e.target.value })} className="h-11 rounded-lg border px-3 text-sm" />
                <input placeholder="Phone" value={agentApplication.phone} onChange={(e) => setAgentApplication({ ...agentApplication, phone: e.target.value })} className="h-11 rounded-lg border px-3 text-sm" />
                <select required value={agentApplication.address} onChange={(e) => setAgentApplication({ ...agentApplication, address: e.target.value })} className="h-11 rounded-lg border bg-white px-3 text-sm">
                  <option value="">Select city *</option><option value="Cebu">Cebu</option><option value="Manila">Manila</option><option value="Davao">Davao</option><option value="Butuan">Butuan</option>
                </select>
                <select value={agentApplication.gender} onChange={(e) => setAgentApplication({ ...agentApplication, gender: e.target.value })} className="h-11 rounded-lg border bg-white px-3 text-sm"><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option></select>
                <input type="date" value={agentApplication.birthdate} onChange={(e) => setAgentApplication({ ...agentApplication, birthdate: e.target.value })} className="h-11 rounded-lg border px-3 text-sm" />
                <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-gray-600">Resume (PDF or Word, max 5 MB) *</span><input required type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={(e) => setAgentResume(e.target.files?.[0] || null)} className="w-full rounded-lg border px-3 py-2 text-sm" /></label>
              </div>
              <button type="submit" disabled={agentApplicationSending} className="mt-5 h-11 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{agentApplicationSending ? "Submitting..." : "Submit Application"}</button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        {chatOpen && (
          <div className="mb-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">RentTrack</p>
                <p className="text-xs text-blue-100">We&apos;re Here to Help! 😊</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/90 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-blue-50">
              {chatMessages.length === 0 && (
                <div className="space-y-3 mt-4">
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-blue-600 px-4 py-3 text-sm text-white shadow-sm">Hi there! Thanks for reaching out to RentTrack. How can we help you today?</div>
                  <p className="text-xs text-gray-500 text-center">Enter your details and choose an agent before sending your message.</p>
                  <select
                    value={chatSelectedAgent?.id || ""}
                    onChange={(e) => {
                      const agent = agents.find((a) => a.id === e.target.value) || null;
                      setChatSelectedAgent(agent);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                  {chatSelectedAgent && (
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <p className="text-xs font-medium text-gray-900">{chatSelectedAgent.name}</p>
                      <p className="text-[11px] text-gray-500">{chatSelectedAgent.email}</p>
                      {chatSelectedAgent.phone && <p className="text-[11px] text-gray-500">{chatSelectedAgent.phone}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">Agent ID: {chatSelectedAgent.id}</p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={chatUser.name}
                    onChange={(e) => setChatUser({ ...chatUser, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    type="email"
                    value={chatUser.email}
                    onChange={(e) => setChatUser({ ...chatUser, email: e.target.value })}
                    placeholder="Your email"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    type="tel"
                    value={chatUser.phone}
                    onChange={(e) => setChatUser({ ...chatUser, phone: e.target.value })}
                    placeholder="Your cellphone number"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${msg.sender === "user" ? "bg-blue-600 text-white" : msg.sender === "system" ? "bg-slate-100 border border-slate-200 text-slate-700" : "bg-white border border-gray-200 text-gray-800"}`}>
                    <p>{msg.text}</p>
                    <p className={`mt-1 text-[10px] ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
             <form onSubmit={async (e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              if (!chatUser.name.trim() || !chatUser.email.trim() || !chatUser.phone.trim()) {
                alert("Please enter your name, email, and cellphone number first");
                return;
              }
              if (!chatSelectedAgent) {
                alert("Please select an agent to chat with");
                return;
              }
              const text = chatInput.trim();
              const confirmationText = "Message received. An agent will reply by email.";
              setChatInput("");
              setChatMessages((prev) => [...prev, { sender: "user", text, createdAt: new Date().toISOString() }, { sender: "system", text: confirmationText, createdAt: new Date().toISOString() }]);
              setChatSending(true);
              try {
                const res = await fetch("/api/chat/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text, propertyId: selectedProperty?.id || null, senderName: chatUser.name, senderEmail: chatUser.email, senderPhone: chatUser.phone, agentId: chatSelectedAgent.id, agentName: chatSelectedAgent.name }),
                });
                const data = await res.json();
                if (data.success && data.inquiryId && !chatInquiryIdsRef.current.includes(data.inquiryId)) {
                  chatInquiryIdsRef.current.push(data.inquiryId);
                }
              } catch {
                // Keep the static confirmation message visible without pretending the agent is typing or responding live.
              } finally {
                setChatSending(false);
              }
            }} className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  aria-label="Chat message"
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <button type="submit" disabled={chatSending || !chatInput.trim()} className="h-11 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
        <button
          onClick={() => setChatOpen((prev) => !prev)}
          type="button"
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          className="h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </main>
  );
}
