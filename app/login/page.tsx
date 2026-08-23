"use client";

import { useState, useEffect, FormEvent, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  MapPin,
  Shield,
  Globe,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, UserRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type Step = "credentials" | "signup" | "signup-verify";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

interface CustomSelectProps {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (val: string) => void;
}

function CustomSelect({ value, placeholder, options, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value || placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setHighlightedIdx(value ? options.indexOf(value) : 0); }}
        className="h-8 w-full text-xs rounded-xl border border-border bg-surface-secondary hover:border-border focus:border-primary-500 focus:ring-primary-500/20 transition-all pr-7 pl-2 text-left text-text-primary flex items-center justify-between"
      >
        <span className={value ? "text-text-primary" : "text-text-tertiary"}>{selectedLabel}</span>
        <ChevronDown className="h-3 w-3 text-text-tertiary shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface-secondary shadow-lg shadow-black/20">
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onMouseEnter={() => setHighlightedIdx(i)}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={
                "w-full text-left px-2 py-1 text-xs transition-colors " +
                (i === highlightedIdx
                  ? "bg-primary-100 text-primary-800"
                  : "text-text-primary hover:bg-surface-tertiary")
              }
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const stepperVariant = {
  initial: { width: 0 },
  animate: { width: "100%" },
  exit: { width: 0 },
};

const Stepper = ({ step }: { step: Step }) => {
  const steps = [
    { key: "signup" as Step, label: "Account" },
    { key: "signup-verify" as Step, label: "Verify" },
    { key: "credentials" as Step, label: "Sign In" },
  ];
  const order = steps.map((s) => s.key);
  const currentIdx = order.indexOf(step);
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        {steps.map((s, i) => {
          const active = i === currentIdx;
          const done = i < currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={
                  "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all " +
                  (done
                    ? "bg-primary-600 text-white"
                    : active
                    ? "bg-primary-600 text-white ring-2 ring-primary-200"
                    : "bg-surface-secondary text-text-tertiary border border-border")
                }
              >
                {done ? "✓" : String(i + 1)}
              </div>
              <span className={active ? "text-text-primary" : ""}>{s.label}</span>
              {i < steps.length - 1 && <span className="text-text-tertiary">›</span>}
            </div>
          );
        })}
      </div>
      <motion.div
        key={step + "-bar"}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={stepperVariant}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-2 h-0.5 rounded-full bg-primary-600/30 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500"
          style={{ width: currentIdx > 0 ? `${(currentIdx / (steps.length - 1)) * 100}%` : "0%" }}
        />
      </motion.div>
    </div>
  );
};

const FormCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="w-full max-w-md px-2">
      <div className="mb-4 text-center">
      <Link href="/" className="inline-flex items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shadow-lg shadow-primary-600/25">
          <img src="/images/landing/logo.png" alt="RentTrack" className="h-6 w-6 object-contain" />
        </div>
      </Link>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-3xl border border-border bg-surface/95 p-6 pb-5 shadow-xl shadow-black/4"
    >
      <h2 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{subtitle}</p>}

        <div className="mt-4">{children}</div>
    </motion.div>

    <p className="mt-5 text-center text-xs text-text-tertiary">
      © {new Date().getFullYear()} RentTrack. All rights reserved.
    </p>
  </div>
);

export default function LoginPage() {
  const [selectedRole] = useState<UserRole>("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("credentials");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "signin") setStep("credentials");
    if (mode === "signup") setStep("signup");
  }, []);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupProvince, setSignupProvince] = useState("");
  const [signupUserId, setSignupUserId] = useState<string | null>(null);
  const [signupOtp, setSignupOtp] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("signupUserId");
    if (saved) setSignupUserId(saved);
  }, []);

  useEffect(() => {
    if (signupUserId) sessionStorage.setItem("signupUserId", signupUserId);
  }, [signupUserId]);

  const clearSignupState = () => {
    setSignupUserId(null);
    setSignupOtp("");
    setEmailVerified(false);
    sessionStorage.removeItem("signupUserId");
  };
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  const { setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    const fullName = `${signupFirstName} ${signupLastName}`.trim();
    if (!fullName || !signupEmail || !signupPassword || !signupPhone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fullName,
          email: signupEmail,
          password: signupPassword,
          role: selectedRole,
          phone: signupPhone,
          address: [signupAddress, signupCity, signupProvince].filter(Boolean).join(", "),
        }),
      });
      const data = await res.json();
      if (data.success && data.needsOtp) {
        setSignupUserId(data.userId);
        setSignupEmail(data.email);
        setStep("signup-verify");
        setResendCooldown(15);
        if (data.emailError) {
          toast.error(`Email delivery failed: ${data.emailError}`);
        } else if (data.devOtp) {
          toast.success(`Dev mode: verification code is ${data.devOtp}`);
        } else {
          toast.success("Account created! Check your email for the verification code.");
        }
      } else if (data.success) {
        toast.success("Account created! Please log in.");
        setStep("credentials");
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch { toast.error("An error occurred. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const handleResendOtp = async () => {
    if (!signupEmail) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: signupEmail }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.emailError) {
          toast.error(`Email delivery failed: ${data.emailError}`);
        } else if (data.devOtp) {
          toast.success(`Dev mode: verification code is ${data.devOtp}`);
        } else {
          toast.success("Verification code sent! Please check your inbox.");
        }
        setResendCooldown(15);
      } else {
        toast.error(data.error || "Failed to send verification code");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySignupOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupOtp || !signupUserId) { toast.error("Please enter the verification code"); return; }
    if (signupOtp.length !== 6) { toast.error("Please enter the 6-digit code"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: signupUserId, otp: signupOtp }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        setEmailVerified(true);
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch { toast.error("An error occurred. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Login successful!");
        setUser(data.user);
        const role = data.user.role;
        if (role === "tenant") {
          router.push("/dashboard/tenant");
        } else if (role === "agent") {
          router.push("/dashboard/agent");
        } else {
          router.push("/dashboard");
        }
      } else if (data.needsVerification) {
        setSignupEmail(data.email || email);
        setSignupUserId(data.userId || null);
        setStep("signup-verify");
        setResendCooldown(15);
        toast.error("Please verify your email before logging in. Check your inbox for the verification code.");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch { toast.error("An error occurred. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: signupPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(signupPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(signupPassword) },
    { label: "One number", met: /\d/.test(signupPassword) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(signupPassword) },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      {/* Background image — Butuan City */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/favicon/Butuan\ City.webp')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-900/70 to-secondary-900/80" />

      {/* Animated gradient orbs (subtle accents over the city photo) */}
      <motion.div
        animate={{ x: [0, 14, 0], y: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-primary-300/10 to-accent-300/10 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -10, 0], y: [0, 22, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-secondary-300/8 to-primary-300/8 blur-3xl"
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {!mounted ? (
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-text-tertiary border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence initial={false} mode="wait">
            {step === "signup" ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <FormCard
                  title="Create your account"
                  subtitle="Join RentTrack and start managing your rentals in minutes."
                >
                  <Stepper step={step} />

                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-0.5">First Name</label>
                        <Input
                          type="text"
                          placeholder="Juan"
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          className="h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-0.5">Last Name</label>
                        <Input
                          type="text"
                          placeholder="Dela Cruz"
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          className="h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-0.5">Date of Birth</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ value: birthMonth, onChange: setBirthMonth, placeholder: "Month", options: months },
                          { value: birthDay, onChange: setBirthDay, placeholder: "Day", options: Array.from({ length: 31 }, (_, i) => i + 1) },
                          { value: birthYear, onChange: setBirthYear, placeholder: "Year", options: years }].map((field, idx) => (
                          <CustomSelect
                            key={idx}
                            value={field.value || ""}
                            placeholder={field.placeholder}
                            options={field.options.map((opt) => String(opt))}
                            onChange={field.onChange}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-0.5">Phone Number</label>
                        <div className="flex gap-1.5">
                          <div className="flex items-center gap-1 h-8 px-2 rounded-xl border border-border bg-surface-secondary shrink-0">
                            <Globe className="h-3 w-3 text-text-tertiary" />
                            <span className="text-xs font-medium text-text-secondary">+63</span>
                          </div>
                          <Input
                            type="tel"
                            placeholder="917-XXX-XXXX"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-0.5">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                          <Input
                            type="email"
                            placeholder="juan@email.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-8 h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-0.5">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-8 pr-8 h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {signupPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mt-1.5 space-y-0.5"
                        >
                          {passwordRequirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              {req.met ? (
                                <CheckCircle2 className="h-3 w-3 text-secondary-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-text-tertiary" />
                              )}
                              <span className={`text-[10px] ${req.met ? "text-secondary-600 font-medium" : "text-text-tertiary"}`}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-0.5">Address</label>
                        <div className="relative group">
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                          <Input
                            type="text"
                            placeholder="Street address"
                            value={signupAddress}
                            onChange={(e) => setSignupAddress(e.target.value)}
                            className="pl-8 h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-0.5">City</label>
                          <Input
                            type="text"
                            placeholder="City"
                            value={signupCity}
                            onChange={(e) => setSignupCity(e.target.value)}
                            className="h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-0.5">Province</label>
                          <Input
                            type="text"
                            placeholder="Province"
                            value={signupProvince}
                            onChange={(e) => setSignupProvince(e.target.value)}
                            className="h-8 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full mt-2 h-10"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create account
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <p className="mt-4 text-center text-xs text-text-secondary">
                    Already have an account?{" "}
                    <motion.button
                      onClick={() => setStep("credentials")}
                      className="text-primary-600 font-semibold inline-flex items-center"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Sign in
                    </motion.button>
                  </p>
                </FormCard>
              </motion.div>
            ) : step === "signup-verify" ? (
              <motion.div
                key="signup-verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                {!emailVerified ? (
                  <FormCard
                    title="Check your email"
                    subtitle="Enter the 6-digit verification code sent to your inbox."
                  >
                    <Stepper step={step} />

                    <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Verification code
                        </label>
                        <div className="relative group">
                          <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                            className="pl-9 h-11 text-center text-base font-mono tracking-[0.3em] rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                            maxLength={6}
                          />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary">
                        Forgot password?{" "}
                        <motion.button
                          onClick={() => router.push("/reset-password")}
                          className="text-primary-600 font-semibold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Reset here
                        </motion.button>
                      </p>
                    </div>

                    <Button
                        type="submit"
                        variant="gradient"
                        size="lg"
                        className="w-full mt-2 h-10"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Verify email
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isResending || resendCooldown > 0}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : isResending ? "Sending..." : "Didn't receive it? Resend code"}
                        </button>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => { setStep("signup"); clearSignupState(); }}
                          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          Back to signup
                        </button>
                      </div>
                    </form>
                  </FormCard>
                ) : (
                  <FormCard
                    title="Email verified!"
                    subtitle="Your account is now fully active. You can sign in to access your dashboard."
                  >
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 text-secondary-600 mb-3">
                        <Shield className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-1">Welcome aboard!</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {signupEmail}
                      </p>

                      <Button
                        onClick={() => { setStep("credentials"); clearSignupState(); }}
                        variant="gradient"
                        size="lg"
                        className="mt-6 w-full h-10"
                      >
                        <span className="flex items-center gap-2">
                          Go to sign in
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </div>
                  </FormCard>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <FormCard
                  title="Welcome back"
                  subtitle="Sign in to manage your rentals, track payments, and connect with tenants."
                >
                  <Stepper step={step} />

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                        <Input
                          type="email"
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-9 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-primary-600 transition-colors" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-9 h-9 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                     <div className="flex items-center justify-between">
                       <p className="text-xs text-text-secondary">
                         Forgot password?{" "}
                         <motion.button
                           onClick={() => toast.info("Password reset is temporarily disabled on this build")}
                           className="text-primary-600 font-semibold"
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                         >
                           Reset here
                         </motion.button>
                       </p>
                     </div>

                     <Button
                       type="submit"
                       variant="gradient"
                       size="lg"
                       className="w-full h-10"
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? (
                         <span className="flex items-center gap-2">
                           <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Signing in...
                         </span>
                       ) : (
                         <span className="flex items-center gap-2">
                           Sign in
                           <ArrowRight className="h-4 w-4" />
                         </span>
                       )}
                     </Button>

                    <p className="mt-4 text-center text-xs text-text-secondary">
                      Don&apos;t have an account?{" "}
                      <motion.button
                        onClick={() => setStep("signup")}
                        className="text-primary-600 font-semibold inline-flex items-center"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        Create one
                      </motion.button>
                    </p>
                  </form>
                </FormCard>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}