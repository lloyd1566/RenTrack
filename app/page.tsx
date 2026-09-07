"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bell, Shield, MapPin, Home, Search, Menu, ChevronRight, Star, Phone, Mail, KeyRound, CreditCard, BarChart3, Building2, Users, X } from "lucide-react";
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
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [propertyAgent, setPropertyAgent] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState({ name: "", email: "", phone: "" });
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredProperties = (searchTerm.trim()
    ? properties.filter((property: any) => {
        const haystack = [
          property.name,
          property.location,
          property.address,
          property.city,
          property.province,
          property.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
      })
    : properties
  );

  const filteredUnits = (searchTerm.trim()
    ? units.filter((unit: any) => {
        const propertyName = unit.propertyName || unit.property_name || "";
        const location = unit.location || unit.propertyLocation || "";
        const haystack = [
          unit.unitNumber,
          unit.unit_number,
          propertyName,
          location,
          unit.status,
          unit.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
      })
    : units
  );

  const displayUnits = filteredUnits.slice(0, 6);
  const displayProperties = filteredProperties.slice(0, 6);

  return (
    <main className="relative min-h-screen bg-white text-gray-900 overflow-x-hidden pt-16">
      {/* â”€â”€â”€ Navigation â”€â”€â”€ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-black/30 backdrop-blur-sm"}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                   <img src="/images/landing/logo.png" alt="RentTrack" className="w-full h-full object-contain rounded-full" />
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
                <Link href="/login?mode=signin" className={`inline-flex h-9 px-5 text-sm font-semibold items-center justify-center rounded-lg border transition-all duration-200 hover:shadow-md ${scrolled ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50" : "border-white/30 text-white bg-white/10 hover:bg-white/20"}`}>
                  Sign In
                </Link>
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
              <Link href="/login?mode=signin" className={`block w-full text-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${scrolled ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-gray-900 hover:bg-gray-100"}`}>
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

       {/* â”€â”€â”€ Hero â”€â”€â”€ */}
       <section className="relative flex min-h-[380px] items-center justify-center overflow-hidden sm:min-h-[440px]">
         <motion.div
           className="absolute inset-0"
           animate={{ scale: [1, 1.05, 1] }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         >
           <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: "url('/images/favicon/Butuan City.webp')" }} />
           <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-900/30" />
         </motion.div>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />

         <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               animate={{
                 y: [0, -28, 0],
                 x: [0, 12, 0],
                 opacity: [0.08, 0.45, 0.08],
               }}
               transition={{
                 duration: 5 + i * 0.35,
                 repeat: Infinity,
                 ease: "easeInOut",
                 delay: i * 0.18,
               }}
               className="absolute rounded-full bg-white"
               style={{
                 left: `${10 + i * 4.5}%`,
                 top: `${18 + (i % 5) * 18}%`,
                 width: `${2 + (i % 3)}px`,
                 height: `${2 + (i % 3)}px`,
               }}
             />
           ))}
         </div>

         <motion.div
           animate={{ y: ["-100%", "100%"] }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent"
         />

         <div className="absolute inset-0 overflow-hidden">
           <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-xl" />
           <motion.div animate={{ x: [0, -15, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -left-10 h-56 w-56 rounded-full bg-white/5 blur-xl" />
           <motion.div animate={{ x: [0, 10, 0], y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-white/5 blur-xl" />
         </div>

         <motion.div
           initial={{ opacity: 0, y: 22 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.75, delay: 0.15 }}
           className="relative z-10 mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 lg:px-8"
         >
           <div className="mx-auto max-w-2xl">
             <motion.div
               initial={{ opacity: 0, y: 18, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ duration: 0.55, delay: 0.25 }}
               className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
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
                 Find your next home
               </motion.span>
             </motion.div>

             <motion.h1
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.65, delay: 0.35 }}
               className="mb-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl md:text-5xl"
             >
               <span className="inline-block">Rental Property Marketplace</span>
             </motion.h1>

             <motion.p
               initial={{ opacity: 0, y: 24 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.65, delay: 0.45 }}
               className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base"
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
                 className="relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-5 text-sm font-semibold text-blue-700 shadow-xl transition-colors hover:bg-blue-50"
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
               className="relative mx-auto mt-8 max-w-3xl"
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

       {/* Properties for Rent Near You */}
      <motion.section id="properties" className="bg-white py-12 sm:py-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
              <MapPin className="h-4 w-4" />Available Now
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-gray-900 sm:text-4xl">Properties for Rent Near You</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">Browse verified houses and condominium units. New units are added regularly.</p>
          </div>

          <div className="mb-6 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100">
                  <Search className="h-4 w-4" />
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location, city, property name, or unit..."
                className="w-full rounded-2xl border border-slate-200 bg-white/95 px-16 py-3.5 text-sm text-slate-900 shadow-[0_10px_30px_rgba(37,99,235,0.08)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_12px_35px_rgba(37,99,235,0.12)] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {displayProperties.length === 0 && displayUnits.length === 0 ? (
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Properties</h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {displayProperties.map((property: any, i: number) => {
                      const img = property.imageUrl || property.image_url || unitImages[i % unitImages.length];
                      const location = property.location || "Cebu, Manila, Butuan, Davao";
                      const propertyType = property.type === "condominium" ? "Condominium" : "House";
                      return (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.09 }}
                          whileHover={{ y: -6 }}
                          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:from-blue-500/5 group-hover:via-blue-500/5 group-hover:to-blue-500/5 group-hover:opacity-100" />
                          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                            <motion.div className="relative h-full w-full" whileHover={{ scale: 1.04 }} transition={{ duration: 0.45, ease: "easeOut" }}>
                              <img
                                src={img}
                                alt={property.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = unitImages[i % unitImages.length];
                                }}
                              />
                            </motion.div>
                            <div className="absolute right-3 top-3">
                              <motion.span
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.25, delay: i * 0.09 + 0.12 }}
                                className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-medium capitalize text-blue-700"
                              >
                                {propertyType}
                              </motion.span>
                            </div>
                          </div>
                          <div className="relative p-4">
                            <h3 className="mb-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">{property.name}</h3>
                            <p className="mb-3 flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />{location}
                            </p>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{property.units || 0} Units</span>
                              <motion.button whileHover={{ x: 4 }} onClick={() => setSelectedProperty(property)} className="font-medium text-blue-600">
                                View Details →
                              </motion.button>
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
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {displayUnits.map((unit: any, i: number) => {
                      const status = unit.status || "vacant";
                      const isOccupied = status === "occupied";
                      const img = unit.imageUrl || unit.image_url || unitImages[i % unitImages.length];
                      const unitNumber = unit.unitNumber || unit.unit_number || "Unit";
                      const rentAmount = unit.rentAmount ?? unit.rent_amount ?? 0;
                      const rent = rentAmount ? `₱${Number(rentAmount).toLocaleString()}` : "₱0";
                      const propName = unit.propertyName || unit.property_name || unit.propertyId || unit.property_id || "—";
                      return (
                        <motion.div
                          key={unit.id}
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.09 }}
                          whileHover={{ y: -6 }}
                          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                        >
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:from-blue-500/5 group-hover:via-blue-500/5 group-hover:to-blue-500/5 group-hover:opacity-100" />
                          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                            <motion.div className="relative h-full w-full" whileHover={{ scale: 1.04 }} transition={{ duration: 0.45, ease: "easeOut" }}>
                              <img
                                src={img}
                                alt={`${unitNumber} photo`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = unitImages[i % unitImages.length];
                                }}
                              />
                            </motion.div>
                            <div className="absolute right-3 top-3">
                              <motion.span
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.25, delay: i * 0.09 + 0.12 }}
                                className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium", isOccupied ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </motion.span>
                            </div>
                          </div>
                          <div className="relative p-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">{unitNumber}</h3>
                              <span className="text-base font-semibold text-blue-600">{rent}<span className="text-[10px] text-gray-400">/mo</span></span>
                            </div>
                            <p className="mb-3 flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />{propName}
                            </p>
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{isOccupied ? "Occupied" : "Vacant"}</span>
                              <motion.button whileHover={{ x: 4 }} onClick={() => setSelectedProperty(unit)} className="font-medium text-blue-600">
                                View Details →
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
      </motion.section>

      {/* â”€â”€â”€ Be One of Our First Tenants â”€â”€â”€ */}
      <motion.section className="bg-blue-600 py-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-4xl">Be One of Our First Tenants</h2>
          <p className="mx-auto mb-7 max-w-2xl text-base text-blue-100 sm:text-lg">New verified units are being added. Browse available homes or contact us for more information.</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#properties" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-blue-700 shadow-xl transition-colors hover:bg-blue-50">
              Browse Properties<ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </motion.section>

      {/* â”€â”€â”€ How It Works â”€â”€â”€ */}
      <motion.section id="how-it-works" className="bg-gray-50 py-14 sm:py-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
              <Star className="h-4 w-4" />How It Works
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-gray-900 sm:text-4xl">Renting Made Simple</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">From browsing to moving in, we make the rental process seamless</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -8 }}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative h-full w-full">
                    <img src={step.image} alt={step.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </motion.div>
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }} className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {i + 1}
                    </motion.div>
                    <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
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
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
              <Star className="h-4 w-4" />Destinations
            </span>
            <h2 className="text-3xl font-bold text-gray-900">Most Popular Destations</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Explore rental properties in the Philippines most sought-after locations</p>
          </div>

          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-64 sm:h-80">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <motion.path
                d="M 60 90 Q 120 20 200 50"
                fill="none"
                stroke="rgba(37,99,235,0.35)"
                strokeWidth="2"
                strokeDasharray="8 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.2, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.path
                d="M 200 50 Q 260 90 340 80"
                fill="none"
                stroke="rgba(37,99,235,0.35)"
                strokeWidth="2"
                strokeDasharray="8 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.path
                d="M 60 90 Q 100 140 160 120"
                fill="none"
                stroke="rgba(37,99,235,0.35)"
                strokeWidth="2"
                strokeDasharray="8 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.8, repeat: Infinity, repeatType: "reverse" }}
              />
            </svg>
            {[
              { name: "Cebu", region: "Central Visayas", x: "15%", y: "60%", delay: 0.9 },
              { name: "Butuan", region: "Agusan del Norte", x: "40%", y: "28%", delay: 1.1 },
              { name: "Davao", region: "Davao Region", x: "68%", y: "72%", delay: 1.3 },
              { name: "Manila", region: "National Capital Region", x: "85%", y: "36%", delay: 1.5 },
            ].map((city) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: city.delay }}
                className="absolute"
                style={{ left: city.x, top: city.y, transform: "translate(-50%, -50%)" }}
              >
                <motion.div
                  animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                  className="absolute rounded-full bg-blue-500/50"
                  style={{ width: 44, height: 44, marginLeft: -22, marginTop: -22 }}
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex flex-col items-center"
                >
                  <div className="h-4 w-4 rounded-full bg-blue-600 shadow-lg shadow-blue-500/60 ring-2 ring-white/40" />
                  <span className="mt-1.5 text-xs sm:text-sm font-bold text-gray-900 drop-shadow-md whitespace-nowrap">
                    {city.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-600 font-medium whitespace-nowrap">{city.region}</span>
                </motion.div>
              </motion.div>
            ))}
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
            Browse verified rental properties across Cebu, Manila, Butuan, and Davao. Contact agents directly for inquiries.
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
              href="#properties"
              className="inline-flex h-12 px-8 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl items-center justify-center gap-2 shadow-xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Properties<ChevronRight className="ml-2 h-4 w-4" />
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
            <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedProperty.name || selectedProperty.unitNumber || "Property Details"}</h3>
                  <p className="text-sm text-gray-500">{selectedProperty.location || selectedProperty.propertyName || "Property"}</p>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {selectedProperty.imageUrl && (
                  <img src={selectedProperty.imageUrl} alt={selectedProperty.name || selectedProperty.unitNumber} className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedProperty.type || "House"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedProperty.status || "Active"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Units</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProperty.units || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                    <p className="text-sm font-medium text-gray-900">₱{Number(selectedProperty.rentAmount || 0).toLocaleString()}/mo</p>
                  </div>
                </div>
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
                  className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Contact Agent
                </button>
              </div>
              <div className="p-6 border-t border-gray-200">
                <button onClick={() => setSelectedProperty(null)} className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
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
      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        {chatOpen && (
          <div className="mb-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Chat with an Agent</p>
                <p className="text-xs text-blue-100">We typically reply within minutes</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/90 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatMessages.length === 0 && (
                <div className="space-y-3 mt-4">
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
