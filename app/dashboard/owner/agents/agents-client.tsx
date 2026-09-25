"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Mail, Phone, MapPin, X, Eye, EyeOff, Trash2, MessageSquare, Pencil, Clock3, Shield, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getAgents, registerAgent, deleteUser, getAgentStats, updateUser, UserRecord, getAgentApplications, reviewAgentApplication, AgentApplication } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import MessagingModal from "@/components/messaging-modal";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as any } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

function getPasswordErrors(password: string) {
  const errors: string[] = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("one special character");
  return errors;
}

function getPresenceLabel(lastSeenAt?: string | null, isOnline?: boolean) {
  if (!lastSeenAt) return "Not active yet";
  const lastSeen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(lastSeen)) return "Unknown activity";

  const minutesAgo = Math.max(0, Math.floor((Date.now() - lastSeen) / 60_000));
  if (isOnline && minutesAgo < 2) return "Online now";
  if (minutesAgo < 1) return "Active just now";
  if (minutesAgo < 60) return `Active ${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `Active ${hoursAgo} hour${hoursAgo === 1 ? "" : "s"} ago`;
  return `Active ${Math.floor(hoursAgo / 24)} day${Math.floor(hoursAgo / 24) === 1 ? "" : "s"} ago`;
}

function isRecentlyOnline(lastSeenAt?: string | null, isOnline?: boolean) {
  if (!isOnline || !lastSeenAt) return false;
  const lastSeen = new Date(lastSeenAt).getTime();
  return !Number.isNaN(lastSeen) && Date.now() - lastSeen < 2 * 60_000;
}

export default function OwnerAgentsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [agents, setAgents] = useState<UserRecord[]>([]);
  const [agentStats, setAgentStats] = useState<Record<string, { properties: number; tenants: number; payments: number }>>({});
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [deleteAgent, setDeleteAgent] = useState<UserRecord | null>(null);
  const [viewingAgent, setViewingAgent] = useState<UserRecord | null>(null);
  const [editingAgent, setEditingAgent] = useState<UserRecord | null>(null);
  const [messagingAgent, setMessagingAgent] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [rejectedApplications, setRejectedApplications] = useState<AgentApplication[]>([]);
  const [agentView, setAgentView] = useState<"agents" | "applicants" | "rejected">("agents");
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [agentSearch, setAgentSearch] = useState("");

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (requestedView === "agents" || requestedView === "applicants" || requestedView === "rejected") {
      setAgentView(requestedView);
    }
  }, [searchParams]);

  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    gender: "",
    birthdate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [dismissedBadges, setDismissedBadges] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const agentRecords = await getAgents();
      setAgents(agentRecords);
      setApplications(await getAgentApplications("pending"));
      setRejectedApplications(await getAgentApplications("rejected"));

      const stats: Record<string, { properties: number; tenants: number; payments: number }> = {};
      await Promise.all(
        agentRecords.map(async (agent) => {
          try {
            stats[agent.id] = await getAgentStats(agent.id);
          } catch {
            stats[agent.id] = { properties: 0, tenants: 0, payments: 0 };
          }
        })
      );
      setAgentStats(stats);
    } catch (err) {
      console.error("Agents page load error:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openRegister = () => {
    setAgentForm({ name: "", email: "", password: "", phone: "", address: "", gender: "", birthdate: "" });
    setShowAgentPassword(false);
    setIsRegisterOpen(true);
  };

  const closeRegister = () => {
    setIsRegisterOpen(false);
    setShowAgentPassword(false);
    setAgentForm({ name: "", email: "", password: "", phone: "", address: "", gender: "", birthdate: "" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!agentForm.name || !agentForm.email || !agentForm.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    const passwordErrors = getPasswordErrors(agentForm.password);
    if (passwordErrors.length > 0) {
      toast.error(`Password must contain ${passwordErrors.join(", ")}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const agent = await registerAgent(agentForm);
      setAgents([agent, ...agents]);
      setAgentForm({ name: "", email: "", password: "", phone: "", address: "", gender: "", birthdate: "" });
      toast.success("Agent registered successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register agent";
      if (process.env.NODE_ENV !== "production") {
        console.error("[RegisterAgent]", err);
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    setIsSubmitting(true);
    try {
      await deleteUser(deleteAgent.id);
      setAgents(agents.filter(a => a.id !== deleteAgent.id));
      setDeleteAgent(null);
      toast.success("Agent deleted successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete agent";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = (agent: UserRecord) => {
    setEditingAgent(agent);
    setEditForm({ name: agent.name, email: agent.email, phone: agent.phone || "", address: agent.address || "" });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await updateUser(editingAgent.id, editForm);
      if (updated) {
        setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...editForm } : a));
        toast.success("Agent updated successfully!");
        setEditingAgent(null);
      }
    } catch {
      toast.error("Failed to update agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMessage = (agent: UserRecord) => {
    setMessagingAgent(agent);
  };

  const handleReviewApplication = async (status: "approved" | "rejected") => {
    if (!selectedApplication || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await reviewAgentApplication(selectedApplication.id, status);
      if (!result?.success) throw new Error(result?.error || "Unable to review application");

      setApplications((current) => current.filter((item) => item.id !== selectedApplication.id));
      setRejectedApplications((current) => current.filter((item) => item.id !== selectedApplication.id));
      if (status === "approved" && result.agent) {
        setAgents((current) => [result.agent, ...current]);
        if (result.emailSent) {
          toast.success("Applicant approved and agent account created. Credentials were emailed.");
        } else {
          toast.error(`Agent account was created, but the credentials email failed. Temporary password: ${result.temporaryPassword}`);
        }
      } else {
        setRejectedApplications((current) => [{ ...selectedApplication, status: "rejected", reviewedAt: new Date().toISOString() }, ...current]);
        toast.success("Applicant rejected");
      }
      setSelectedApplication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLoginTime = (value?: string | null) => {
    if (!value) return "Not logged in yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const filteredAgents = agents.filter((agent) => `${agent.name} ${agent.email} ${agent.phone || ""} ${agent.address || ""}`.toLowerCase().includes(agentSearch.trim().toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{agentView === "agents" ? "Agents" : agentView === "applicants" ? "Agent Applicants" : "Rejected Applicants"}</h2>
          <p className="text-text-secondary text-sm mt-1">Manage agents for your properties</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={agentView} onChange={(event) => setAgentView(event.target.value as typeof agentView)} className="h-9 rounded-lg border border-border bg-surface px-3 text-sm">
            <option value="agents">List of Agents</option>
            <option value="applicants">List of Applicants ({applications.length})</option>
            <option value="rejected">List of Rejected ({rejectedApplications.length})</option>
          </select>
          <Button onClick={openRegister}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Register Agent
          </Button>
        </div>
      </div>

      {agentView === "applicants" && (
        <div className="space-y-3">
          {applications.length === 0 ? <div className="rounded-2xl border border-border p-10 text-center text-text-secondary">No pending applicants.</div> : applications.map((application) => (
            <button type="button" key={application.id} onClick={() => setSelectedApplication(application)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left hover:bg-surface-secondary">
              <div><p className="font-semibold text-foreground">{application.name}</p><p className="text-sm text-text-secondary">{application.email} · {application.address}</p></div>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">New applicant</Badge>
            </button>
          ))}
        </div>
      )}

      {agentView === "rejected" && (
        <div className="space-y-3">
          {rejectedApplications.length === 0 ? (
            <div className="rounded-2xl border border-border p-10 text-center text-text-secondary">No rejected applicants.</div>
          ) : (
            rejectedApplications.map((application) => (
              <div key={application.id} className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div>
                  <p className="font-semibold text-foreground">{application.name}</p>
                  <p className="text-sm text-text-secondary">{application.email} · {application.address}</p>
                </div>
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Rejected</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {agentView === "agents" && (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input value={agentSearch} onChange={(event) => setAgentSearch(event.target.value)} placeholder="Search agents by name, email, or location" className="pl-9" />
        </div>
      )}

      {/* Register Modal */}
      <AnimatePresence>
        {isRegisterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/30" onClick={closeRegister} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-border bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold">Register New Agent</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">Agents can manage tenants, units, and payments.</p>
                </div>
                <button
                  onClick={closeRegister}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleRegister} className="max-h-[calc(90vh-90px)] overflow-y-auto p-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Full Name *</label>
                    <Input placeholder="e.g. Juan Dela Cruz" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} required />
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Email *</label>
                    <Input placeholder="agent@example.com" type="email" value={agentForm.email} onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })} required />
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Password *</label>
                    <div className="relative">
                      <Input placeholder="8+ chars, uppercase, number, symbol" type={showAgentPassword ? "text" : "password"} minLength={8} value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} className="pr-10" required />
                      <button type="button" onClick={() => setShowAgentPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-secondary" aria-label={showAgentPassword ? "Hide password" : "Show password"}>
                        {showAgentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Phone</label>
                    <Input placeholder="e.g. 09123456789" value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })} />
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Address</label>
                    <Select value={agentForm.address} onChange={(e) => setAgentForm({ ...agentForm, address: e.target.value })}>
                      <option value="">Select city</option><option value="Cebu">Cebu</option><option value="Manila">Manila</option><option value="Davao">Davao</option><option value="Butuan">Butuan</option>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Gender</label>
                    <Select value={agentForm.gender} onChange={(e) => setAgentForm({ ...agentForm, gender: e.target.value })}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-medium text-text-secondary mb-0.5 block">Birthdate</label>
                    <Input type="date" value={agentForm.birthdate} onChange={(e) => setAgentForm({ ...agentForm, birthdate: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 h-8 text-[10px]">
                    {isSubmitting ? "Registering..." : "Register Agent"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeRegister} className="flex-1 h-8 text-[10px]">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApplication && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between"><div><h3 className="text-lg font-bold">Applicant Information</h3><Badge className="mt-2 bg-amber-100 text-amber-700">Pending review</Badge></div><button onClick={() => setSelectedApplication(null)}><X className="h-5 w-5" /></button></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p><b>Name</b><br />{selectedApplication.name}</p><p><b>Email</b><br />{selectedApplication.email}</p><p><b>Phone</b><br />{selectedApplication.phone || "N/A"}</p><p><b>Location</b><br />{selectedApplication.address}</p><p><b>Gender</b><br />{selectedApplication.gender || "N/A"}</p><p><b>Date Applied</b><br />{selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}</p></div>
              <a href={`/api/agent-applications/${selectedApplication.id}/resume`} target="_blank" rel="noreferrer" className="mt-5 block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-700">View Resume</a>
              <div className="mt-5 flex gap-2"><Button className="flex-1" disabled={isSubmitting} onClick={() => handleReviewApplication("approved")}>{isSubmitting ? "Creating account..." : "Approve & Create Account"}</Button><Button variant="outline" className="flex-1" disabled={isSubmitting} onClick={() => handleReviewApplication("rejected")}>Reject</Button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteAgent(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-white shadow-2xl"
            >
              <div className="p-5 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Delete Agent</h3>
                <p className="text-xs text-text-secondary">Are you sure you want to delete <span className="font-medium text-foreground">{deleteAgent.name}</span>? This action cannot be undone.</p>
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <Button type="button" variant="outline" onClick={() => setDeleteAgent(null)} className="flex-1 h-9 text-xs">Cancel</Button>
                <Button type="button" onClick={handleDelete} disabled={isSubmitting} className="flex-1 h-9 text-xs bg-red-600 hover:bg-red-700 text-white">
                  {isSubmitting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agents Grid */}
      {agentView === "agents" && <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Users className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No agents yet</p>
            <p className="text-text-tertiary text-sm mt-1">Register your first agent to get started</p>
          </div>
        ) : (
          filteredAgents.map((agent, i) => (
            <motion.div key={agent.id} variants={fadeInUp} transition={{ delay: i * 0.05 }} className="p-5 rounded-2xl border border-border bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={agent.avatarUrl} fallback={getInitials(agent.name)} size="md" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${agent.idVerificationStatus === "approved" ? "bg-green-500" : agent.idVerificationStatus === "rejected" ? "bg-red-500" : agent.idVerificationStatus === "pending" ? "bg-yellow-500" : "bg-slate-400"}`} title={agent.idVerificationStatus === "approved" ? "Verified" : agent.idVerificationStatus === "rejected" ? "Rejected" : agent.idVerificationStatus === "pending" ? "Pending" : "Unverified"} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-medium capitalize">agent</Badge>
                      <AnimatePresence mode="popLayout">
                        {!dismissedBadges.has(`${agent.id}-verification`) && (
                          <motion.div
                            key="verification"
                            initial={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge
                              variant="outline"
                              className={
                                agent.idVerificationStatus === "approved" ? "bg-green-50 text-green-600 border-green-200" :
                                agent.idVerificationStatus === "rejected" ? "bg-red-50 text-red-600 border-red-200" :
                                agent.idVerificationStatus === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                                "bg-slate-50 text-slate-500 border-slate-200"
                              }
                              onClick={() => setDismissedBadges(prev => new Set(prev).add(`${agent.id}-verification`))}
                              style={{ cursor: 'pointer' }}
                              title="Click to dismiss"
                            >
                              <Shield className="h-2.5 w-2.5 mr-1" />
                              {agent.idVerificationStatus === "approved" ? "Verified" : agent.idVerificationStatus === "rejected" ? "Rejected" : agent.idVerificationStatus === "pending" ? "Pending" : "Unverified"}
                            </Badge>
                          </motion.div>
                        )}
                        {!dismissedBadges.has(`${agent.id}-presence`) && (
                          <motion.div
                            key="presence"
                            initial={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}
                              onClick={() => setDismissedBadges(prev => new Set(prev).add(`${agent.id}-presence`))}
                              style={{ cursor: 'pointer' }}
                              title="Click to dismiss"
                            >
                              <span className={`relative flex h-2 w-2 ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "text-emerald-500" : "text-slate-400"}`}>
                                {isRecentlyOnline(agent.lastSeenAt, agent.isOnline) && (
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                              </span>
                              {getPresenceLabel(agent.lastSeenAt, agent.isOnline)}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{agent.email}</span>
                </div>
                {agent.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{agent.phone}</span>
                  </div>
                )}
                {agent.address && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{agent.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200/60 px-3 py-2.5">
                  <div className={`rounded-full p-1.5 ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "bg-emerald-100" : "bg-slate-200"}`}>
                    <Clock3 className={`h-3.5 w-3.5 ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "text-emerald-600" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium ${isRecentlyOnline(agent.lastSeenAt, agent.isOnline) ? "text-emerald-700" : "text-slate-600"}`}>
                      {getPresenceLabel(agent.lastSeenAt, agent.isOnline)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Last login: {formatLoginTime(agent.lastLoginAt)}
                    </p>
                  </div>
                </div>
                {agent.gender && (
                  <div className="text-[10px] text-text-tertiary">Gender: {agent.gender}</div>
                )}
                {agent.country && (
                  <div className="text-[10px] text-text-tertiary">Country: {agent.country}</div>
                )}
              </div>
              {agentStats[agent.id] && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-surface-secondary text-center">
                    <p className="text-[10px] text-text-secondary">Properties</p>
                    <p className="text-sm font-semibold text-foreground">{agentStats[agent.id].properties}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-secondary text-center">
                    <p className="text-[10px] text-text-secondary">Tenants</p>
                    <p className="text-sm font-semibold text-foreground">{agentStats[agent.id].tenants}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-secondary text-center">
                    <p className="text-[10px] text-text-secondary">Payments</p>
                    <p className="text-sm font-semibold text-foreground">{agentStats[agent.id].payments}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]" onClick={() => setViewingAgent(agent)}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]" onClick={() => handleEditAgent(agent)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]" onClick={() => handleOpenMessage(agent)}>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Message
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteAgent(agent)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingAgent(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Edit Agent</h3>
                <p className="text-sm text-text-secondary">Update agent information</p>
              </div>
              <button onClick={() => setEditingAgent(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email *</label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingAgent(null)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {messagingAgent && (
        <MessagingModal
          isOpen={!!messagingAgent}
          onClose={() => setMessagingAgent(null)}
          otherUser={{
            id: messagingAgent.id,
            name: messagingAgent.name,
            email: messagingAgent.email,
            role: messagingAgent.role,
            avatarUrl: messagingAgent.avatarUrl,
            allowMessages: true,
          }}
          properties={[]}
        />
      )}

      {/* Agent Details Modal */}
      <AnimatePresence>
        {viewingAgent && (
          <motion.div
            key="agent-details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setViewingAgent(null)} />
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Agent Details</h3>
                  <p className="text-sm text-text-secondary">Agent profile and information</p>
                </div>
                <button onClick={() => setViewingAgent(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <Avatar src={viewingAgent.avatarUrl} fallback={getInitials(viewingAgent.name)} size="lg" />
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-foreground">{viewingAgent.name}</h4>
                  <p className="text-sm text-text-secondary">{viewingAgent.email}</p>
                   <div className="flex items-center gap-2 mt-2 flex-wrap">
                     <Badge variant="outline" className="text-[10px] font-medium capitalize">agent</Badge>
                     {!dismissedBadges.has(`${viewingAgent.id}-presence`) && (
                       <motion.div
                         key="presence"
                         initial={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         transition={{ duration: 0.2 }}
                       >
                         <span
                           className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${viewingAgent.isOnline ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}
                           onClick={() => setDismissedBadges(prev => new Set(prev).add(`${viewingAgent.id}-presence`))}
                           style={{ cursor: 'pointer' }}
                           title="Click to dismiss"
                         >
                           <span className={`relative flex h-2 w-2 ${viewingAgent.isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                             {viewingAgent.isOnline && (
                               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                             )}
                             <span className={`relative inline-flex rounded-full h-2 w-2 ${viewingAgent.isOnline ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                           </span>
                           {viewingAgent.isOnline ? "Online" : "Offline"}
                         </span>
                       </motion.div>
                     )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-secondary">
                  <p className="text-xs text-text-secondary mb-1">Last Login</p>
                  <p className="text-sm font-medium text-foreground">{formatLoginTime(viewingAgent.lastLoginAt)}</p>
                </div>
                {viewingAgent.phone && (
                  <div className="p-4 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-secondary mb-1">Phone</p>
                    <p className="text-sm font-medium text-foreground">{viewingAgent.phone}</p>
                  </div>
                )}
                {viewingAgent.address && (
                  <div className="p-4 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-secondary mb-1">Address</p>
                    <p className="text-sm font-medium text-foreground">{viewingAgent.address}</p>
                  </div>
                )}
                {viewingAgent.gender && (
                  <div className="p-4 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-secondary mb-1">Gender</p>
                    <p className="text-sm font-medium text-foreground">{viewingAgent.gender}</p>
                  </div>
                )}
                {viewingAgent.birthdate && (
                  <div className="p-4 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-secondary mb-1">Birthdate</p>
                    <p className="text-sm font-medium text-foreground">{viewingAgent.birthdate}</p>
                  </div>
                )}
                {viewingAgent.country && (
                  <div className="p-4 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-secondary mb-1">Country</p>
                    <p className="text-sm font-medium text-foreground">{viewingAgent.country}</p>
                  </div>
                )}
              </div>

              {agentStats[viewingAgent.id] && (
                <div>
                  <p className="text-xs text-text-secondary mb-2">Performance</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-surface-secondary text-center">
                      <p className="text-[10px] text-text-secondary">Properties</p>
                      <p className="text-lg font-semibold text-foreground">{agentStats[viewingAgent.id].properties}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary text-center">
                      <p className="text-[10px] text-text-secondary">Tenants</p>
                      <p className="text-lg font-semibold text-foreground">{agentStats[viewingAgent.id].tenants}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary text-center">
                      <p className="text-[10px] text-text-secondary">Payments</p>
                      <p className="text-lg font-semibold text-foreground">{agentStats[viewingAgent.id].payments}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border border-border">
                <p className="text-xs text-text-secondary mb-2">Account Information</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Member Since</span>
                    <span className="text-foreground font-medium">{new Date(viewingAgent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Account ID</span>
                    <span className="text-foreground font-mono text-[10px]">{viewingAgent.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Role</span>
                    <span className="text-foreground font-medium capitalize">{viewingAgent.role}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <Button variant="outline" onClick={() => setViewingAgent(null)} className="w-full">Close</Button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
