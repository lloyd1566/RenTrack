"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, cn } from "@/lib/utils";
import { getConversations, markAllMessagesRead, Conversation } from "@/lib/data";
import { toast } from "sonner";

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conv: Conversation) => void;
  fullPage?: boolean;
}

export default function MessagingPanel({ isOpen, onClose, onSelectConversation, fullPage = false }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getConversations()
        .then((convs) => {
          setConversations(convs);
        })
        .catch(() => toast.error("Failed to load conversations"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleConversationClick = async (conv: Conversation) => {
    await markAllMessagesRead(conv.userId);
    setConversations((prev) =>
      prev.map((c) => (c.userId === conv.userId ? { ...c, unreadCount: 0 } : c))
    );
    onSelectConversation?.(conv);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 8, scale: 0.95, filter: "blur(4px)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-dropdown overflow-hidden z-50",
        fullPage ? "relative w-full" : "absolute right-0 mt-2 w-80 sm:w-96"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Messages</h3>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded-lg flex items-center justify-center text-text-tertiary hover:text-foreground hover:bg-surface-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className={cn(fullPage ? "min-h-[360px] max-h-[560px]" : "max-h-80", "overflow-y-auto")}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-text-tertiary" />
            No messages yet
          </div>
        ) : (
          conversations.map((conv, index) => (
            <motion.button
              key={conv.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleConversationClick(conv)}
              className={cn(
                "w-full text-left p-4 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors",
                conv.unreadCount > 0 && "bg-primary-50/50 dark:bg-primary-900/10"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                   <Avatar
                     src={conv.otherUser?.avatarUrl}
                     fallback={conv.otherUser?.name ? getInitials(conv.otherUser.name) : "?"}
                     size="sm"
                   />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary-500 text-[8px] font-bold text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.otherUser?.name || "Unknown User"}
                    </p>
                    <span className="text-[10px] text-text-tertiary">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {conv.lastMessage.subject && `${conv.lastMessage.subject} - `}
                    {conv.lastMessage.body}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {conv.otherUser?.role || "user"}
                    </Badge>
                    {conv.unreadCount > 0 && (
                      <span className="text-[10px] font-medium text-primary-600">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}
