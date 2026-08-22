"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getMessages, sendMessage, markAllMessagesRead, Message } from "@/lib/data";
import { toast } from "sonner";

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    allowMessages?: boolean;
  };
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  owner: "bg-blue-100 text-blue-700 border-blue-200",
  agent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  tenant: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function MessagingModal({ isOpen, onClose, otherUser }: MessagingModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && otherUser.id) {
      setLoading(true);
      setMessages([]);
      setNewMessage("");
      setSubject("");
      getMessages(otherUser.id)
        .then((msgs) => {
          setMessages(msgs);
          if (msgs.length > 0) {
            markAllMessagesRead(otherUser.id);
          }
        })
        .catch(() => toast.error("Failed to load messages"))
        .finally(() => setLoading(false));
      scrollToBottom();
    }
  }, [isOpen, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage({
        receiverId: otherUser.id,
        subject: subject.trim() || undefined,
        body: newMessage.trim(),
      });
      setMessages((prev) => [...prev, sent]);
      setNewMessage("");
      setSubject("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative w-full max-w-lg h-[600px] rounded-3xl border border-gray-200 bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar src={otherUser.avatarUrl} fallback={getInitials(otherUser.name)} size="md" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">{otherUser.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] capitalize ${roleColors[otherUser.role] || "bg-gray-100 text-gray-700"}`}>
                  {otherUser.role}
                </Badge>
                {otherUser.allowMessages === false && (
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Messages off</Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    {msg.subject && (
                      <p className={`text-xs font-medium mb-1 ${isMe ? "text-right text-gray-600" : "text-left text-gray-600"}`}>
                        {msg.subject}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
          {messages.length === 0 && (
            <input
              type="text"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 min-h-[40px] max-h-24 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
