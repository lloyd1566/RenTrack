"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Mail } from "lucide-react";

interface InquiryReplyPageProps {
  params: {
    id: string;
  };
}

export default function InquiryReplyPage({ params }: InquiryReplyPageProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInquiry() {
      if (!params.id || !token) return;
      try {
        const res = await fetch(`/api/inquiry-reply?id=${encodeURIComponent(params.id)}&token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.success && data.inquiry) {
          setInquiry(data.inquiry);
        } else {
          toast.error(data.error || "Invalid or expired reply link");
        }
      } catch {
        toast.error("Unable to load inquiry");
      } finally {
        setLoading(false);
      }
    }
    loadInquiry();
  }, [params.id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) {
      toast.error("Please write a reply before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiry-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, token, reply: reply.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (data.emailSent) {
          toast.success("Reply sent and agent notified");
        } else {
          toast.success("Reply saved, but agent notification could not be sent");
        }
      } else {
        toast.error(data.error || "Failed to send reply");
      }
    } catch {
      toast.error("Unable to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-6 text-center">
          <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">This reply link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-900 font-medium">Your reply has been sent</p>
          <p className="text-xs text-gray-500 mt-1">The agent will respond to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-500">Conversation</p>
            <h1 className="text-lg font-semibold text-gray-900">Reply to your inquiry</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Your message</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{inquiry.text}</p>
              {inquiry.replyText && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Agent reply</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{inquiry.replyText}</p>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Your reply</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={5}
                  placeholder="Write your reply here..."
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Reply"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
