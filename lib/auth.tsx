"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type UserRole = "admin" | "owner" | "agent" | "tenant";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

interface AuthContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole, phone?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  getUsers: () => Promise<(Omit<User, "password"> & { _password: string })[]>;
  getUserByEmail: (email: string) => Promise<(Omit<User, "password"> & { _password: string }) | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "renttrack_session";

async function apiCall(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved session
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, role: UserRole, phone?: string): Promise<boolean> => {
      try {
        const result = await apiCall("/api/auth/signup", { name, email, password, role, phone });
        if (result.success) {
          setUser(result.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
          toast.success("Account created successfully!");
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

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const result = await apiCall("/api/auth/login", { email, password });
        if (result.success) {
          setUser(result.user);
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
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    toast.success("Logged out successfully");
  }, []);

  const getUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/users");
      const result = await res.json();
      return result.success ? result.users : [];
    } catch {
      return [];
    }
  }, []);

  const getUserByEmail = useCallback(async (email: string) => {
    const users = await getUsers();
    return users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  }, [getUsers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        isAuthenticated: !!user,
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
