"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Volume2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Conversation, getConversations, markAllMessagesRead, sendMessage } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

function getCallUrl(body: string) {
  return body.match(/https:\/\/meet\.jit\.si\/[^\s]+/)?.[0] || null;
}

export default function IncomingCallOverlay() {
  const { user } = useAuth();
  const [call, setCall] = useState<Conversation | null>(null);
  const seenCalls = useRef(new Set<string>());

  useEffect(() => {
    if (!user?.id) return;

    const checkForCall = async () => {
      const conversations = await getConversations();
      const incoming = conversations.find((conversation) => {
        const message = conversation.lastMessage;
        const createdAt = new Date(message.createdAt).getTime();
        return message.subject === "Audio call request"
          && message.senderId !== user.id
          && !message.read
          && Date.now() - createdAt < 60_000
          && getCallUrl(message.body);
      });
      if (!incoming || seenCalls.current.has(incoming.lastMessage.id)) return;
      seenCalls.current.add(incoming.lastMessage.id);
      setCall(incoming);
    };

    void checkForCall().catch(() => undefined);
    const interval = window.setInterval(() => void checkForCall().catch(() => undefined), 3_000);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  if (!call || !call.otherUser) return null;

  const callUrl = getCallUrl(call.lastMessage.body);
  if (!callUrl) return null;

  const finishCall = async (accepted: boolean) => {
    setCall(null);
    void markAllMessagesRead(call.userId).catch(() => undefined);
    try {
      await sendMessage({
        receiverId: call.userId,
        subject: accepted ? "Audio call accepted" : "Audio call declined",
        body: accepted ? `${user?.name || "The user"} joined your audio call.` : `${user?.name || "The user"} declined your audio call.`,
      });
    } catch {
      toast.error("Could not send the call response");
    }
    if (accepted) {
      window.open(callUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/35 p-4" role="dialog" aria-label="Incoming audio call">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex flex-col items-center bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-white">
          <div className="relative mb-4">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <Avatar src={call.otherUser.avatarUrl} fallback={getInitials(call.otherUser.name)} size="xl" className="relative ring-4 ring-white/40" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Incoming audio call</p>
          <h2 className="mt-1 text-xl font-semibold">{call.otherUser.name}</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/90"><Volume2 className="h-4 w-4" /> RentTrack call</div>
        </div>
        <div className="flex gap-3 p-5">
          <button type="button" onClick={() => void finishCall(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-200">
            <PhoneOff className="h-4 w-4" /> Decline
          </button>
          <button type="button" onClick={() => void finishCall(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            <Phone className="h-4 w-4" /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}
