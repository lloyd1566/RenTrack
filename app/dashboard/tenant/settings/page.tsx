"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit3, Upload, Save, Eye, EyeOff, Key, Shield, CheckCircle2,
  Camera, Phone, Mail, MapPin, Calendar as CalendarIcon, Globe, X,
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

type Tab = "general" | "edit-profile" | "security";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "general", label: "Overview", icon: User },
  { id: "edit-profile", label: "Edit Profile", icon: Edit3 },
  { id: "security", label: "Security", icon: Key },
];

const statCardsDef = [
  { label: "Profile Completeness", valueKey: "percentage", icon: User, color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
  { label: "Account Status", value: "Active", icon: CheckCircle2, color: "from-green-500 to-green-600", bg: "bg-green-50" },
  { label: "Member Since", valueKey: "memberSince", icon: CalendarIcon, color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
];

function getMemberSinceText(createdAt?: string): string {
  if (!createdAt) return "Unknown";
  const joined = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - joined.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);

  if (diffYears > 0) {
    if (remainingMonths > 0) {
      return `${diffYears}y ${remainingMonths}mo`;
    }
    return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
  }
  if (diffDays > 0) {
    const remainingDays = diffDays % 30;
    if (remainingDays > 0) {
      return `${Math.floor(diffDays / 30)}mo ${remainingDays}d`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  return "Today";
}

export default function TenantSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [languages, setLanguages] = useState(user?.languages || "");
  const [hobbies, setHobbies] = useState(user?.hobbies || "");
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [birthdate, setBirthdate] = useState(user?.birthdate || "");
  const [country, setCountry] = useState(user?.country || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [showIdPreview, setShowIdPreview] = useState(false);
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
      userIdRef.current = user.id;
      didSyncRef.current = true;
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: user?.id, name, email, phone, languages, hobbies, aboutMe, gender, birthdate, country, address }),
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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
      const res = await fetch("/api/auth/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
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
      const res = await fetch("/api/auth/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        toast.success("ID uploaded for verification");
        await refreshUser();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUploadingId(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const profile: UserProfile = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    gender,
    birthdate,
    country,
    address,
    languages,
    aboutMe,
    avatarUrl: user.avatarUrl,
    idVerificationUrl: user.idVerificationUrl,
  };
  const profileCompleteness = calculateProfileCompleteness(profile);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <Avatar
              src={user.avatarUrl}
              fallback={user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              size="xl"
              className="h-20 w-20 text-xl border-4 border-white/30 shadow-2xl"
            />
            <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-lg">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </motion.div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">My Profile</h2>
            <p className="text-white/70 text-sm mt-1.5">Manage your account settings and preferences</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {user.role}
              </Badge>
              {user.idVerificationStatus === "approved" ? (
                <Badge variant="outline" className="bg-green-400/20 text-green-100 border-green-300/30 backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : user.idVerificationStatus === "rejected" ? (
                <Badge variant="outline" className="bg-red-400/20 text-red-100 border-red-300/30 backdrop-blur-sm">
                  ID Rejected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-400/20 text-amber-100 border-amber-300/30 backdrop-blur-sm">
                  Pending Verification
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCardsDef.map((stat, i) => {
          const displayValue = stat.valueKey === "percentage" ? `${profileCompleteness.percentage}%`
            : stat.valueKey === "memberSince" ? getMemberSinceText(user?.createdAt)
            : stat.value;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onHoverStart={() => setHoveredStat(stat.label)}
              onHoverEnd={() => setHoveredStat(null)}
            >
              <Card className="border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5 bg-gradient-to-br bg-clip-text text-transparent", `text-[${stat.color}]`)} style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                    </div>
                  <motion.div
                    animate={{ scale: hoveredStat === stat.label ? 1.1 : 1 }}
                    className={cn("h-2 w-2 rounded-full bg-gradient-to-r", stat.color)}
                  />
                </div>
                 <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
                 <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
               </CardContent>
             </Card>
           </motion.div>
         );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
            <div className="grid grid-cols-3 gap-1 w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-gray-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your personal details and account information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <Avatar src={user.avatarUrl} fallback={user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"} size="lg" className="h-16 w-16" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <Badge variant="outline" className="mt-2 capitalize">{user.role}</Badge>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     {[
                       { label: "Full Name", value: user.name, icon: User },
                       { label: "Email Address", value: user.email, icon: Mail },
                       { label: "Phone Number", value: user.phone || "Not set", icon: Phone },
                       { label: "Gender", value: user.gender || "Not specified", icon: User },
                       { label: "Birthdate", value: user.birthdate ? new Date(user.birthdate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "Not specified", icon: CalendarIcon },
                       { label: "Country", value: user.country || "Not specified", icon: Globe },
                       { label: "Address", value: user.address || "Not set", icon: MapPin },
                     ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * i }}
                        className="group"
                      >
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </label>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{item.value}</p>
                      </motion.div>
                      ))}
                    </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ID Verification Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-gray-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>ID Verification</CardTitle>
                      <CardDescription>Verify your identity to enable booking and reservation features</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.idVerificationUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200"
                    >
                      <div
                        onClick={() => setShowIdPreview(true)}
                        className="relative h-20 w-32 rounded-lg shadow-md cursor-pointer overflow-hidden group"
                      >
                        <img src={user.idVerificationUrl} alt="ID" className="h-full w-full object-cover blur-sm group-hover:blur-none transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                          <Eye className="h-6 w-6 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className={
                          user.idVerificationStatus === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                          user.idVerificationStatus === "rejected" ? "bg-red-50 text-red-600 border-red-200" :
                          "bg-yellow-50 text-yellow-600 border-yellow-200"
                        }>
                          {user.idVerificationStatus || "Pending"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Click image to preview</p>
                      </div>
                    </motion.div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-all hover:bg-blue-50/50">
                      <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Click to upload ID</span>
                      <span className="text-xs text-gray-500">JPG, PNG or PDF (max 5MB)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} disabled={isUploadingId} />
                    </label>
                  )}
                </CardContent>
              </Card>

              <AnimatePresence>
                {showIdPreview && user.idVerificationUrl && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowIdPreview(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-3xl max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setShowIdPreview(false)}
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <img src={user.idVerificationUrl} alt="ID Verification" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* Edit Profile Tab */}
          <TabsContent value="edit-profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-gray-200 shadow-lg">
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
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                      >
                        <Avatar
                          src={user.avatarUrl}
                          fallback={user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                          size="xl"
                          className="h-20 w-20"
                        />
                        <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                          <Camera className="h-4 w-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                        </label>
                      </motion.div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <Badge variant="outline" className="mt-2 capitalize">{user.role}</Badge>
                        {isUploadingAvatar && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                      </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                       {[
                         { label: "Full Name", value: name, setter: setName, placeholder: "Your full name" },
                         { label: "Email Address", value: email, setter: setEmail, placeholder: "your@email.com", type: "email" },
                         { label: "Phone Number", value: phone, setter: setPhone, placeholder: "+63 XXX XXX XXXX" },
                         { label: "Gender", value: gender, setter: setGender, placeholder: "Male / Female / Other" },
                         { label: "Birthdate", value: birthdate, setter: setBirthdate, type: "date" },
                         { label: "Country", value: country, setter: setCountry, placeholder: "Philippines" },
                         { label: "Address", value: address, setter: setAddress, placeholder: "Your full address" },
                       ].map((field, i) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * i }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                          <Input
                            type={field.type || "text"}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={field.placeholder}
                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25" disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-gray-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Must be at least 6 characters</p>
                    </div>
                    <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25" disabled={isSaving}>
                      <Key className="h-4 w-4 mr-2" />
                      {isSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
