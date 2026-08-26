"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createComplaint, getComplaints, Complaint } from "@/lib/data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TenantContactPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = () => { if (user) getComplaints(user.id).then(setRequests).catch(() => setRequests([])); };
  useEffect(loadRequests, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) { toast.error("Subject and message are required"); return; }
    setSubmitting(true);
    try {
      const request = await createComplaint({ tenantId: user?.id || "", targetType: "support", targetId: "support", subject, message, priority: "medium" });
      setRequests((current) => [request, ...current]); setSubject(""); setMessage(""); toast.success("Support request submitted");
    } catch { toast.error("Failed to submit support request"); } finally { setSubmitting(false); }
  };

  return <div className="mx-auto w-full max-w-6xl space-y-6 py-6 sm:py-10"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Tenant Support</p><h1 className="mt-1 text-3xl font-bold text-gray-900">How can we help?</h1><p className="mt-1 text-sm text-gray-500">Send a request to the RentTrack support team and follow its status here.</p></div><div className="grid grid-cols-1 gap-5 lg:grid-cols-5"><Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5 text-blue-600" />New Support Request</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div><label className="mb-1.5 block text-sm font-medium">Subject / Category</label><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Payment, maintenance, account..." /></div><div><label className="mb-1.5 block text-sm font-medium">Message</label><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} placeholder="Describe what you need help with..." className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" /></div><Button type="submit" disabled={submitting} className="w-full"><Send className="mr-2 h-4 w-4" />{submitting ? "Submitting..." : "Submit Request"}</Button></form></CardContent></Card><Card className="lg:col-span-3"><CardHeader><CardTitle className="text-lg">My Support Requests</CardTitle></CardHeader><CardContent>{requests.length ? <div className="space-y-4">{requests.map((request) => <div key={request.id} className="rounded-xl border border-gray-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{request.subject}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{request.message}</p></div><Badge variant={request.status === "resolved" || request.status === "closed" ? "success" : "warning"} className="capitalize">{request.status.replace("_", " ")}</Badge></div>{request.response_text && <div className="mt-3 rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-700">Admin response</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{request.response_text}</p></div>}</div>)}</div> : <p className="py-12 text-center text-sm text-gray-500">No support requests yet.</p>}</CardContent></Card></div></div>;
}
