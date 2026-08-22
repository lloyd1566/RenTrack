"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Key, Save, Eye, EyeOff, Edit3, Shield, Upload
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { calculateProfileCompleteness, type UserProfile } from "@/lib/profile";
import { toast } from "sonner";

type Tab = "general" | "edit-profile" | "password";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "general", label: "General", icon: User },
  { id: "edit-profile", label: "Edit Profile", icon: Edit3 },
  { id: "password", label: "Password", icon: Key },
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [languages, setLanguages] = useState(user?.languages || "");
  const [hobbies, setHobbies] = useState(user?.hobbies || "");
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [birthdate, setBirthdate] = useState(user?.birthdate || "");
  const [country, setCountry] = useState(user?.country || "");
  const [address, setAddress] = useState(user?.address || "");
  const [experience, setExperience] = useState(user?.experience || "");
  const userIdRef = useRef(user?.id || null);
  const didSyncRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (didSyncRef.current && userIdRef.current === user.id) return;
    if (didSyncRef.current && userIdRef.current !== user.id) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setLanguages(user.languages || "");
      setHobbies(user.hobbies || "");
      setAboutMe(user.aboutMe || "");
      setGender(user.gender || "");
      setBirthdate(user.birthdate || "");
      setCountry(user.country || "");
      setAddress(user.address || "");
      setExperience(user.experience || "");
      userIdRef.current = user.id;
      didSyncRef.current = true;
      return;
    }
    if (!didSyncRef.current) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setLanguages(user.languages || "");
      setHobbies(user.hobbies || "");
      setAboutMe(user.aboutMe || "");
      setGender(user.gender || "");
      setBirthdate(user.birthdate || "");
      setCountry(user.country || "");
      setAddress(user.address || "");
      setExperience(user.experience || "");
      userIdRef.current = user.id;
      didSyncRef.current = true;
    }
   }, [user]);

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

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: user?.id, name, email, phone, languages, hobbies, aboutMe, gender, birthdate, country, address, experience }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Profile updated successfully");
        await refreshUser();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
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
        credentials: "include",
        body: JSON.stringify({ id: user?.id, currentPassword, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        await refreshUser();
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const res = await fetch("/api/auth/upload", { method: "POST", body: formData, credentials: "include" });
      const result = await res.json();
      if (result.success) {
        toast.success("Profile picture updated");
        await refreshUser();
      } else {
        toast.error(result.error || "Failed to upload profile picture");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingId(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "id_verification");
      const res = await fetch("/api/auth/upload", { method: "POST", body: formData, credentials: "include" });
      const result = await res.json();
      if (result.success) {
        toast.success("ID uploaded for verification");
        await refreshUser();
      } else {
        toast.error(result.error || "Failed to upload ID");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUploadingId(false);
    }
  };

  const profile: UserProfile = {
    name: user?.name,
    email: user?.email,
    phone,
    gender,
    birthdate,
    country,
    address,
    languages,
    aboutMe,
    avatarUrl: user?.avatarUrl,
  };
  const profileCompleteness = calculateProfileCompleteness(profile);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-8 sm:p-10">
        <div className="absolute -top-4 -right-4 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Avatar src={user?.avatarUrl} fallback={user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"} size="xl" className="h-16 w-16 text-lg border-4 border-white/20" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">My Profile</h2>
            <p className="text-white/70 text-sm mt-1.5">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>General</CardTitle>
                  <CardDescription>View your profile information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar src={user?.avatarUrl} fallback={user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"} size="lg" />
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.name || "Not set"}</p>
                  <p className="text-xs text-text-secondary">{user?.email || "Not set"}</p>
                </div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                   <p className="text-sm font-medium text-foreground">{user?.name || "Not set"}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-1">Account Email</label>
                   <p className="text-sm font-medium text-foreground">{user?.email || "Not set"}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
                   <p className="text-sm font-medium text-foreground">{phone || user?.phone || "Not set"}</p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                   <p className="text-sm font-medium text-foreground">{address || user?.address || "Not set"}</p>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Languages Spoken</label>
                  <p className="text-sm font-medium text-foreground">{languages || "None specified"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Hobbies & Interests</label>
                  <p className="text-sm font-medium text-foreground">{hobbies || "None specified"}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">A Little Something About Me</label>
                  <p className="text-sm font-medium text-foreground">{aboutMe || "Share something about yourself in the Edit Profile tab!"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
                  <p className="text-sm font-medium text-foreground">{phone || user?.phone || "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Gender</label>
                  <p className="text-sm font-medium text-foreground">{gender || "Not specified"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Birthdate</label>
                  <p className="text-sm font-medium text-foreground">{birthdate ? new Date(birthdate).toLocaleDateString() : "Not specified"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Country</label>
                  <p className="text-sm font-medium text-foreground">{country || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-profile">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <Avatar
                      src={user?.avatarUrl}
                      fallback={user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                      size="xl"
                    />
                    <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                      <Upload className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <Badge variant="outline" className="mt-1 capitalize">{user?.role}</Badge>
                    {isUploadingAvatar && <p className="text-xs text-text-secondary mt-1">Uploading...</p>}
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
                   <div>
                     <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                     <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your full address" />
                   </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <Input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="e.g. Male / Female / Other" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Birthdate</label>
                    <Input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Experience</label>
                    <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 2 Years" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Philippines" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Languages Spoken</label>
                    <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. English, Filipino" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Hobbies & Interests</label>
                    <Input value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="e.g. Basketball, Coding" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">A Little Something About Me</label>
                    <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="Tell us a bit about yourself..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none" rows={3} />
                  </div>
                  {(user?.role === "tenant" || user?.role === "agent") && (
                    <div className="sm:col-span-2 pt-4 border-t border-border">
                      <label className="block text-sm font-medium text-foreground mb-2">ID Verification</label>
                      <p className="text-xs text-text-secondary mb-3">Upload a valid ID to verify your identity and enable booking/reservation features.</p>
                      {user?.idVerificationUrl ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                          <img src={user.idVerificationUrl} alt="ID" className="h-16 w-24 object-cover rounded" />
                          <div>
                            <Badge variant="outline" className={
                              user?.idVerificationStatus === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                              user?.idVerificationStatus === "rejected" ? "bg-red-50 text-red-600 border-red-200" :
                              "bg-yellow-50 text-yellow-600 border-yellow-200"
                            }>
                              {user?.idVerificationStatus || "Pending"}
                            </Badge>
                            <p className="text-xs text-text-secondary mt-1">ID uploaded</p>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary-300 cursor-pointer transition-colors">
                          <Upload className="h-5 w-5 text-text-tertiary" />
                          <span className="text-sm text-text-secondary">Click to upload ID</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} disabled={isUploadingId} />
                        </label>
                      )}
                      {isUploadingId && <p className="text-xs text-text-secondary mt-1">Uploading ID...</p>}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Save className="h-4 w-4 mr-1.5" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Key className="h-5 w-5 text-amber-600" />
                </div>
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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
