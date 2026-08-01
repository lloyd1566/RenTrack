"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Key, Moon, Sun, Save, Eye, EyeOff, Smartphone
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("renttrack_dark") === "true";
    setDarkMode(isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("renttrack_dark", String(next));
    document.documentElement.classList.toggle("dark", next);
    toast.success(`Dark mode ${next ? "enabled" : "disabled"}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user?.id, name, email, phone }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user?.id, currentPassword, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-6">
      {/* ⚙️ Settings Hero — Clean Minimal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-8 sm:p-10">
        <div className="absolute -top-4 -right-4 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
            <User className="h-3 w-3" />
            Account Settings
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
          <p className="text-white/70 text-sm mt-1.5">Manage your account settings and preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-6 mb-6">
              <Avatar
                fallback={user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                size="xl"
              />
              <div>
                <p className="font-medium text-foreground">{user?.name}</p>
                <Badge variant="outline" className="mt-1 capitalize">{user?.role}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 XXX XXX XXXX" />
              </div>
            </div>
            <Button type="submit"><Save className="h-4 w-4 mr-1.5" />Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters" />
            </div>
            <Button type="submit"><Key className="h-4 w-4 mr-1.5" />Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { icon: Bell, label: "Email Notifications", desc: "Receive payment and account updates via email", value: emailNotifs, set: setEmailNotifs },
            { icon: Smartphone, label: "SMS Notifications", desc: "Get text alerts for urgent updates", value: smsNotifs, set: setSmsNotifs },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                </div>
              </div>
              <button onClick={() => item.set(!item.value)}
                className={cn("relative h-6 w-11 rounded-full transition-colors duration-200", item.value ? "bg-primary-500" : "bg-border")}>
                <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200", item.value && "translate-x-5")} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your interface</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-text-secondary" /> : <Sun className="h-5 w-5 text-text-secondary" />}
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-text-secondary">Switch between light and dark themes</p>
              </div>
            </div>
            <button onClick={toggleDark}
              className={cn("relative h-6 w-11 rounded-full transition-colors duration-200", darkMode ? "bg-primary-500" : "bg-border")}>
              <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200", darkMode && "translate-x-5")} />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
