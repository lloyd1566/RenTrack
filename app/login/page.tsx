"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Home,
  Users,
  Sparkles,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

const roles: { role: UserRole; label: string; icon: typeof Home; description: string }[] = [
  { role: "agent", label: "Agent", icon: Users, description: "Register tenants, assign units, track occupancy" },
  { role: "tenant", label: "Tenant", icon: Home, description: "View balance, upload receipts, track payments" },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as const } } };

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("agent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"role" | "credentials" | "signup">("role");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  const { login, signup } = useAuth();
  const router = useRouter();

  // Check ?mode= query param to start on sign-in or signup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "signin") {
      setStep("credentials");
    } else if (mode === "signup") {
      setStep("role");
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setIsSubmitting(true);
    try { const success = await login(email, password); if (success) router.push("/dashboard"); }
    catch { toast.error("An error occurred. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast.error("Please fill in all required fields"); return; }
    if (signupPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsSubmitting(true);
    try { const success = await signup(signupName, signupEmail, signupPassword, selectedRole, signupPhone); if (success) router.push("/dashboard"); }
    catch { toast.error("An error occurred. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex bg-surface overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-secondary-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div>
<Link href="/" className="flex items-center gap-3 text-white mb-16">
              <img src="/images/favicon/logo.png" alt="RentTrack" className="h-10 w-10 rounded-xl object-contain" />
              <span className="text-xl font-bold">Rent<span className="text-white/80">Track</span></span>
            </Link>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                Streamline Your Rental<br /><span className="text-primary-200">Management</span>
              </h1>
              <p className="text-primary-200 text-lg max-w-md leading-relaxed">
                Track payments, manage properties, and monitor receivables — all from one centralized platform.
              </p>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/90 text-sm leading-relaxed">
              Create your account and start managing your rental properties with ease. No dummy data — start fresh with your own properties, units, and tenants.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login/Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden mb-10">
            <img src="/images/favicon/logo.png" alt="RentTrack" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-bold">Rent<span className="text-primary-500">Track</span></span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "role" ? (
              <motion.div key="role-selection" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, x: -50 }}>
                <motion.div variants={itemVariants} className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/30 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 mb-4">
                    <Sparkles className="h-4 w-4" />Get Started
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
                  <p className="text-text-secondary">Select your role to get started with RentTrack.</p>
                </motion.div>
                <motion.div variants={containerVariants} className="space-y-3">
                  {roles.map((r) => (
                    <motion.button key={r.role} variants={itemVariants}
                      onClick={() => { setSelectedRole(r.role); setStep("signup"); }}
                      className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                        selectedRole === r.role ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600" : "border-border hover:border-primary-200 hover:bg-surface-secondary")}>
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                        selectedRole === r.role ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25" : "bg-surface-tertiary text-text-secondary group-hover:bg-primary-50 group-hover:text-primary-600")}>
                        <r.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1"><p className="font-semibold text-foreground">{r.label}</p><p className="text-sm text-text-secondary">{r.description}</p></div>
                      <ArrowRight className={cn("h-5 w-5 transition-all duration-200", selectedRole === r.role ? "text-primary-500 translate-x-1" : "text-text-tertiary group-hover:text-primary-400 group-hover:translate-x-1")} />
                    </motion.button>
                  ))}
                </motion.div>
                <motion.p variants={itemVariants} className="mt-6 text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button onClick={() => { setStep("credentials"); }} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Sign in</button>
                </motion.p>
              </motion.div>
            ) : step === "signup" ? (
              <motion.div key="signup" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }}>
                <button onClick={() => setStep("role")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors mb-6 group">
                  <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />Back to roles
                </button>
                <div className="mb-8">
<div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white">
                      {selectedRole === "agent" && <Users className="h-5 w-5" />}
                      {selectedRole === "tenant" && <Home className="h-5 w-5" />}
                    </div>
                    <div><p className="text-sm text-text-secondary">Creating account as</p><p className="font-semibold text-foreground capitalize">{roles.find((r) => r.role === selectedRole)?.label}</p></div>
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
                  <p className="text-text-secondary">Fill in your details to get started.</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  {[
                    { icon: User, label: "Full Name *", type: "text", placeholder: "Your full name", key: "name", val: signupName, set: setSignupName },
                    { icon: Mail, label: "Email Address *", type: "email", placeholder: "you@email.com", key: "email", val: signupEmail, set: setSignupEmail },
                    { icon: Phone, label: "Phone Number", type: "tel", placeholder: "+63 XXX XXX XXXX", key: "phone", val: signupPhone, set: setSignupPhone },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                        <Input type={f.type} placeholder={f.placeholder} value={f.val} onChange={(e) => f.set(e.target.value)} className="pl-10 h-12" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 h-12 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Creating account...</span>
                    ) : (<span className="flex items-center gap-2">Create Account<ArrowRight className="h-4 w-4" /></span>)}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button onClick={() => setStep("credentials")} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Sign in</button>
                </p>
              </motion.div>
            ) : (
              <motion.div key="credentials" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }}>
                <button onClick={() => setStep("role")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors mb-6 group">
                  <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />Back
                </button>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
                  <p className="text-text-secondary">Sign in to your RentTrack account.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Signing in...</span>
                    ) : (<span className="flex items-center gap-2">Sign In<ArrowRight className="h-4 w-4" /></span>)}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">
                  Don&apos;t have an account?{" "}
                  <button onClick={() => setStep("signup")} className="text-primary-500 hover:text-primary-600 font-medium transition-colors">Create one</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
