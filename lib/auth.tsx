"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { validatePasswordStrength } from "@/lib/auth-security";

export type UserRole = "admin" | "owner" | "agent" | "tenant";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  languages?: string;
  hobbies?: string;
  aboutMe?: string;
  gender?: string;
  birthdate?: string;
  country?: string;
  experience?: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
  profileVisibility?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  allowMessages?: boolean;
  dataSharing?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole, phone?: string, paymentPin?: string, address?: string) => Promise<boolean>;
  verifySignupOtp: (userId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: Omit<User, "password"> | null) => void;
  getUsers: () => Promise<(Omit<User, "password"> & { _password: string })[]>;
  getUserByEmail: (email: string) => Promise<(Omit<User, "password"> & { _password: string }) | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "renttrack_session";

export { SESSION_KEY };

async function apiCall(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(url: string) {
  const res = await fetch(url, { credentials: "include" });
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((user: Omit<User, "password"> | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiGet("/api/auth/me");
        if (result.success) {
          setUserState(result.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
        } else {
          setUserState(null);
          localStorage.removeItem(SESSION_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setUser]);

  const signup = useCallback(
    async (name: string, email: string, password: string, role: UserRole, phone?: string, paymentPin?: string, address?: string): Promise<boolean> => {
      const strength = validatePasswordStrength(password);
      if (!strength.valid) {
        toast.error(`Password too weak: ${strength.errors.join(", ")}`);
        return false;
      }
      try {
        const result = await apiCall("/api/auth/signup", { name, email, password, role, phone, paymentPin, address });
        if (result.success) {
          if (result.needsOtp) {
            toast.success("Account created! Please verify your email.");
            return true;
          }
          toast.success("Account created successfully! Please log in.");
          return true;
        } else {
          toast.error(result.error || "Signup failed");
          return false;
        }
      } catch {
        toast.error("An error occurred. Please try again.");
        return false;
      }
    },
    []
  );

  const verifySignupOtp = useCallback(
    async (userId: string, otp: string): Promise<boolean> => {
      try {
        const result = await apiCall("/api/auth/signup/verify-otp", { userId, otp });
        if (result.success && result.verified) {
          toast.success("Email verified! You can now log in.");
          return true;
        } else {
          toast.error(result.error || "Verification failed");
          return false;
        }
      } catch {
        toast.error("An error occurred. Please try again.");
        return false;
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const result = await apiCall("/api/auth/login", { email, password });
        if (result.success) {
          setUserState(result.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
          toast.success(`Welcome back, ${result.user.name}!`);
          return true;
        } else {
          toast.error(result.error || "Invalid email or password");
          return false;
        }
      } catch {
        toast.error("An error occurred. Please try again.");
        return false;
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(SESSION_KEY);
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    toast.success("Logged out successfully");
  }, [setUser]);

  const refreshUser = useCallback(async () => {
    try {
      const result = await apiGet("/api/auth/me");
      if (result.success) {
        setUserState(result.user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      } else {
        setUserState(null);
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      setUserState(null);
      localStorage.removeItem(SESSION_KEY);
    }
  }, [setUser]);

  const getUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/users", { credentials: "include" });
      const result = await res.json();
      return result.success ? result.users : [];
    } catch {
      return [];
    }
  }, []);

  const getUserByEmail = useCallback(async (email: string) => {
    const users = await getUsers();
    return users.find((u: { email: string }) => u.email.toLowerCase() === email.toLowerCase());
  }, [getUsers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        verifySignupOtp,
        logout,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        setUser,
        getUsers,
        getUserByEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
