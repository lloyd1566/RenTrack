"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Globe,
  ArrowLeft,
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

export default function LoginPage() {
  const [selectedRole] = useState<UserRole>("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("signup");
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

  const { login, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const bgImage = step === "signup" || step === "signup-verify"
    ? "/images/favicon/createaccountpage.jpg"
    : "/images/favicon/loginpage.jpg";

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
          router.push("/dashboard/tenant/browse");
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
    { label: "8+ characters", met: signupPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(signupPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(signupPassword) },
    { label: "Number", met: /\d/.test(signupPassword) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(signupPassword) },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-white">
      {/* Left Side - Image/Illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={bgImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 right-20 w-[30rem] h-[30rem] rounded-full bg-indigo-400/15 blur-3xl"
          />
        </div>

        {/* Content on left side */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <img src="/images/landing/logo.png" alt="RentTrack" className="h-8 w-8 object-contain" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Rent<span className="text-white/70">Track</span></span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-white leading-tight mb-3">
                {step === "signup" || step === "signup-verify" ? "Start Your Journey" : "Your Property Dashboard Awaits"}
              </h1>
              <p className="text-xs text-white/80 leading-relaxed max-w-lg">
                {step === "signup" || step === "signup-verify"
                  ? "Create your account and discover verified rental properties across Cebu, Manila, Butuan, and Davao."
                  : "Sign in to manage your rentals, track payments, and stay connected with your property dashboard."}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">Verified Listings</h3>
                  <p className="text-[11px] text-white/70 leading-relaxed">Explore properties with full details, high-resolution photos, and transparent rental terms.</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-0.5">Enterprise-Grade Security</h3>
                  <p className="text-[11px] text-white/70 leading-relaxed">Advanced encryption and strict access controls keep your personal and payment data safe.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-4 sm:p-8 relative overflow-y-auto">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 lg:hidden mb-12">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <img src="/images/landing/logo.png" alt="RentTrack" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Rent<span className="text-blue-600">Track</span></span>
          </Link>

          {!mounted ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence initial={false} mode="wait">
            {step === "signup" ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <div>
                  <button
                    onClick={() => setStep("credentials")}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors mb-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Create account</h2>
                  <p className="text-[11px] text-gray-500">Registering as Guest</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">First Name</label>
                      <Input
                        type="text"
                        placeholder="John"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        className="h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Name</label>
                      <Input
                        type="text"
                        placeholder="Galito"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        className="h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="h-8 text-xs rounded-lg border border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all px-2"
                      >
                        <option value="">Month</option>
                        {months.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="h-8 text-xs rounded-lg border border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all px-2"
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className="h-8 text-xs rounded-lg border border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all px-2"
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-gray-200 bg-gray-50/50 shrink-0">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">+63</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="917-XXX-XXXX"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="email"
                        placeholder="galitojohnlloyd@gmail.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-8 h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="John123!"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-8 pr-8 h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="mt-1 space-y-0.5">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${req.met ? "bg-green-500" : "bg-gray-300"}`} />
                            <span className={`text-[10px] ${req.met ? "text-green-600" : "text-gray-500"}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Location</label>
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          type="text"
                          placeholder="Address"
                          value={signupAddress}
                          onChange={(e) => setSignupAddress(e.target.value)}
                          className="pl-8 h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          placeholder="City"
                          value={signupCity}
                          onChange={(e) => setSignupCity(e.target.value)}
                          className="h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                        <Input
                          type="text"
                          placeholder="State / Province"
                          value={signupProvince}
                          onChange={(e) => setSignupProvince(e.target.value)}
                          className="h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-8 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Register as Guest
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </Button>
                </form>

                <p className="mt-2 text-center text-xs text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setStep("credentials")}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Login
                  </button>
                </p>
              </motion.div>
            ) : step === "signup-verify" ? (
              <motion.div
                key="signup-verify"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                 {!emailVerified ? (
                   <div className="space-y-3">
                     <div className="mb-4">
                       <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
                         <Shield className="h-3 w-3" />
                         Verify Your Email
                       </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">Check your Email!</h2>
                       <p className="text-xs text-gray-500 leading-relaxed">
                         We've sent a verification code to <strong>{signupEmail}</strong>. Please check your inbox (and spam folder) to unlock your account.
                       </p>
                     </div>

                    <form onSubmit={handleVerifySignupOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Verification Code</label>
                      <div className="relative group">
                        <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={signupOtp}
                          onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                           className="pl-8 h-8 rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all tracking-[0.3em] text-center text-base font-mono"
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-9 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Got it, Thanks!
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending || resendCooldown > 0}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : isResending ? "Sending..." : "Didn't receive it? Resend code"}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setStep("signup"); clearSignupState(); }}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Back to signup
                      </button>
                    </div>
                  </form>
                  </div>
                 ) : (
                   <div className="text-center py-6">
                     <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600 mb-3">
                       <Shield className="h-5 w-5" />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Email verified!</h2>
                     <p className="text-xs text-gray-500 leading-relaxed mb-4">
                       Your account is now fully active.
                     </p>
                     <Button
                       onClick={() => { setStep("credentials"); clearSignupState(); }}
                       className="h-9 px-5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
                     >
                       Go to Login
                     </Button>
                   </div>
                 )}
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mb-4"
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
                    Account Access
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Welcome Back</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">Sign in to access your dashboard, manage tenants, and track payments.</p>
                </motion.div>

                <form onSubmit={handleLogin} className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-8 h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                  >
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                         className="pl-8 pr-8 h-8 text-sm rounded-lg border-gray-200 bg-gray-50/50 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                       />
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                       >
                         {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                       </button>
                     </div>
                   </motion.div>

                   <motion.div
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.29 }}
                   >
                    <Button type="submit" className="w-full h-9 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Sign In
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.37 }}
                  className="mt-4 text-center text-xs text-gray-600"
                >
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setStep("signup")}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Create one
                  </button>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
           )}
         </div>

       {/* Footer at bottom of right panel */}
       <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-gray-400">
         © {new Date().getFullYear()} RentTrack. All rights reserved.
       </p>
      </div>
    </div>
  );
}
