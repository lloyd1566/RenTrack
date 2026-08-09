"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Search, Phone, Mail, Shield, X,
  KeyRound, Trash2, MoreHorizontal, CheckCircle2, XCircle, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getTenants as getTenantRecords, TenantRecord, notifyAdmins, addNotification } from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface AgentRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
  experience?: string;
}

export default function AgentsPage() {
  const { user, getUsers } = useAuth();
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [resetPasswordAgent, setResetPasswordAgent] = useState<AgentRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (isAdminOrOwner) {
          const users = await getUsers();
          setAgents(users.filter((u: any) => u.role === "agent").map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            createdAt: u.created_at || u.createdAt,
            avatarUrl: u.avatar_url,
            idVerificationUrl: u.id_verification_url,
            idVerificationStatus: u.id_verification_status,
            experience: u.experience,
          })));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminOrOwner, user, getUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const reloadAgents = async () => {
    if (!isAdminOrOwner) return;
    const users = await getUsers();
    setAgents(users.filter((u: any) => u.role === "agent").map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      createdAt: u.created_at || u.createdAt,
      avatarUrl: u.avatar_url,
      idVerificationUrl: u.id_verification_url,
      idVerificationStatus: u.id_verification_status,
      experience: u.experience,
    })));
  };

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentEmail || !agentPassword) { toast.error("Please fill in all required fields"); return; }
    if (agentPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsRegistering(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, email: agentEmail, password: agentPassword, role: "agent", phone: agentPhone, createSession: false }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Agent registered successfully");
        notifyAdmins({ title: "New Agent Registered", message: `${agentName} has been registered as an agent`, type: "tenant", read: false });
        setShowAgentModal(false);
        setAgentName(""); setAgentEmail(""); setAgentPassword(""); setAgentPhone("");
        await reloadAgents();
      } else {
        toast.error(result.error || "Failed to register agent");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordAgent || !newPassword) { toast.error("Please enter a new password"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: resetPasswordAgent.id, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Password reset successfully");
        setResetPasswordAgent(null);
        setNewPassword("");
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/auth/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: agentId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Agent deleted successfully");
        await reloadAgents();
        if (selectedAgent?.id === agentId) setSelectedAgent(null);
      } else {
        toast.error(result.error || "Failed to delete agent");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    }
    setOpenDropdownId(null);
  };

  const handleVerifyAgent = async (agentId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/auth/verify-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: agentId, status }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`ID verification ${status}`);
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, idVerificationStatus: status } : a));
        if (selectedAgent?.id === agentId) {
          setSelectedAgent(prev => prev ? { ...prev, idVerificationStatus: status } : null);
        }
      } else {
        toast.error(result.error || "Failed to update verification");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agents</h2>
          <p className="text-text-secondary text-sm mt-1">Manage agent accounts and permissions</p>
        </div>
        {isAdminOrOwner && (
          <Button onClick={() => setShowAgentModal(true)}><UserPlus className="h-4 w-4 mr-1.5" />Register Agent</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Agents", value: agents.length, color: "from-primary-500 to-primary-600" },
          { label: "Active", value: agents.filter((a) => a.role === "agent").length, color: "from-green-500 to-green-600" },
          { label: "Inactive", value: agents.filter((a) => a.role !== "agent").length, color: "from-gray-500 to-gray-600" },
          { label: "Avg. Commission", value: "0%", color: "from-accent-500 to-accent-600" },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeInUp} whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="hover:shadow-lg transition-all duration-300"><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
                <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold", stat.color)}>
                  {typeof stat.value === "number" ? stat.value : "%"}
                </div>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-22rem)] min-h-[400px]">
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input placeholder="Search agents..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-10">
                <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-text-secondary">Loading...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-10">
                <Shield className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-text-secondary">No agents found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200",
                      selectedAgent?.id === agent.id
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-surface-secondary border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar fallback={agent.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                        <p className="text-xs text-text-secondary truncate">{agent.email}</p>
                      </div>
                      {agent.idVerificationStatus && (
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1 py-0",
                          agent.idVerificationStatus === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                          agent.idVerificationStatus === "rejected" ? "bg-red-50 text-red-600 border-red-200" :
                          "bg-yellow-50 text-yellow-600 border-yellow-200"
                        )}>
                          ID: {agent.idVerificationStatus}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedAgent ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar fallback={selectedAgent.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedAgent.name}</h3>
                    <p className="text-sm text-text-secondary">{selectedAgent.email}</p>
                  </div>
                </div>
                {isAdminOrOwner && (
                  <div className="relative" ref={dropdownRef}>
                    <Button variant="ghost" size="sm" onClick={() => setOpenDropdownId(openDropdownId === selectedAgent.id ? null : selectedAgent.id)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <AnimatePresence>
                      {openDropdownId === selectedAgent.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20"
                        >
                          <button
                            onClick={() => { setResetPasswordAgent(selectedAgent); setOpenDropdownId(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <KeyRound className="h-4 w-4 text-gray-400" />
                            Reset Password
                          </button>
                          <button
                            onClick={async () => {
                              setOpenDropdownId(null);
                              try {
                                await addNotification({
                                  userId: selectedAgent.id,
                                  title: "ID Verification Required",
                                  message: "Please upload a valid ID to verify your identity and access all features.",
                                  type: "id_verification",
                                  read: false,
                                });
                                toast.success("ID verification request sent to agent");
                              } catch {
                                toast.error("Failed to send notification");
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Shield className="h-4 w-4 text-blue-400" />
                            Request ID Verification
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(selectedAgent.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Agent
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
                    <p className="text-sm font-medium text-foreground">{selectedAgent.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                    <p className="text-sm font-medium text-foreground">{selectedAgent.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                    <p className="text-sm font-medium text-foreground">{selectedAgent.phone || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      selectedAgent.role === "agent" ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>{selectedAgent.role}</Badge>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Experience</label>
                    <p className="text-sm font-medium text-foreground">{selectedAgent.experience || "Not specified"}</p>
                  </div>
                  {selectedAgent.idVerificationUrl && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-secondary mb-2">ID Verification</label>
                      <div
                        onClick={() => setShowIdModal(true)}
                        className="relative rounded-xl border border-border overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={selectedAgent.idVerificationUrl}
                          alt="ID Verification"
                          className="w-full h-auto max-h-[40vh] object-contain bg-gray-50 blur-sm group-hover:blur-none transition-all duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-colors">
                          <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Eye className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                      {isAdminOrOwner && selectedAgent.idVerificationStatus === "pending" && selectedAgent.idVerificationUrl && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleVerifyAgent(selectedAgent.id, "approved")} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerifyAgent(selectedAgent.id, "rejected")} className="text-red-600 hover:text-red-700">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Select an agent to view details</p>
              </div>
            </div>
          )}
        </Card>

        <AnimatePresence>
          {showIdModal && selectedAgent?.idVerificationUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowIdModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-3xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowIdModal(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <img
                  src={selectedAgent.idVerificationUrl}
                  alt="ID Verification"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal isOpen={showAgentModal} onClose={() => setShowAgentModal(false)} title="Register Agent" description="Create a new agent account">
        <form onSubmit={handleRegisterAgent} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <Input placeholder="Agent full name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input type="tel" placeholder="+63 XXX XXX XXXX" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} className="h-9" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <Input type="email" placeholder="agent@example.com" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <Input type="password" placeholder="At least 6 characters" value={agentPassword} onChange={(e) => setAgentPassword(e.target.value)} className="h-9" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowAgentModal(false)} disabled={isRegistering}>Cancel</Button>
            <Button type="submit" disabled={isRegistering}>
              {isRegistering ? "Registering..." : "Register Agent"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!resetPasswordAgent} onClose={() => { setResetPasswordAgent(null); setNewPassword(""); }} title="Reset Password" description={`Set a new password for ${resetPasswordAgent?.name}`}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password *</label>
            <Input type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setResetPasswordAgent(null); setNewPassword(""); }} disabled={isResetting}>Cancel</Button>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
