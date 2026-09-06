"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error("Please enter both email and verification code");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      }).then((res) => res.json());

      if (result.success && result.verified) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        await refreshUser();
      } else {
        setStatus("error");
        setMessage(result.error || "Verification failed. Please check your code and try again.");
      }
    } catch {
      setStatus("error");
      setMessage("An error occurred during verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending || resendCooldown > 0) return;
    setIsResending(true);
    try {
      const result = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((res) => res.json());

      if (result.success) {
        toast.success("Verification code sent! Please check your email.");
        setResendCooldown(60);
      } else {
        toast.error(result.error || "Failed to resend verification code");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      {/* Background image — Butuan City */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/favicon/Butuan\\ City.webp')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-900/70 to-secondary-900/80" />

      {/* Animated gradient orbs */}
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
      <motion.div
        animate={{ x: [0, 12, 0], y: [0, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/10 to-cyan-300/10 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -8, 0], y: [0, -12, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/10 to-purple-300/10 blur-3xl"
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: 5 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            className="absolute rounded-full bg-white"
            style={{
              left: `${10 + i * 4.5}%`,
              top: `${20 + (i % 5) * 18}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
            }}
          />
        ))}
      </div>

      {/* Subtle scan line */}
      <motion.div
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent"
      />
      {/* Subtle grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-border bg-surface/95 p-6 pb-5 shadow-xl shadow-black/4">
            {status === "form" && (
              <>
                <div className="text-center mb-6">
                  <Mail className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-text-primary tracking-tight">Verify your email</h2>
                  <p className="mt-1.5 text-sm text-text-secondary">Enter the 6-digit verification code sent to your email.</p>
                </div>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 text-sm rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Verification Code</label>
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="h-10 text-sm text-center text-2xl tracking-widest rounded-xl border-border bg-surface-secondary focus:border-primary-500 focus:ring-primary-500/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full h-10"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Verifying..." : "Verify Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-[10px]"
                    disabled={isResending || resendCooldown > 0}
                    onClick={handleResend}
                  >
                    {isResending ? "Sending..." : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
                  </Button>
                </form>
                <p className="text-[10px] text-center text-text-tertiary mt-3">
                  Didn&apos;t receive it? Check your spam folder or contact support.
                </p>
              </>
            )}

            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-semibold text-text-primary mb-2 text-center">Verifying...</h2>
                <p className="text-sm text-text-secondary text-center">Please wait while we verify your email address.</p>
              </>
            )}

            {status === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Email Verified!</h2>
                <p className="text-sm text-text-secondary mb-6 text-center">{message}</p>
                <Link href="/login?mode=signin">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Continue to Login
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Verification Failed</h2>
                <p className="text-sm text-text-secondary mb-6 text-center">{message}</p>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStatus("form");
                      setMessage("");
                      setOtp("");
                    }}
                  >
                    Try Again
                  </Button>
                  <Link href="/login?mode=signin">
                    <Button variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen w-full overflow-hidden bg-surface">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/favicon/Butuan\\ City.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-900/70 to-secondary-900/80" />
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface/95 p-8 text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Loading...</h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
