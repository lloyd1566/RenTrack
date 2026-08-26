"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getConversations, getProperties, getUnits, Conversation, Property, Unit } from "@/lib/data";
import MessagingPanel from "@/components/messaging-panel";
import MessagingModal from "@/components/messaging-modal";

export default function TenantMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Conversation["otherUser"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConversations(), getProperties(), getUnits()])
      .then(([messages, propertyData, unitData]) => {
        setConversations(messages);
        setProperties(propertyData);
        setUnits(unitData);
      })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  const propertiesWithUnits = properties.map((property) => ({
    ...property,
    unitNames: units.filter((unit) => unit.propertyId === property.id).map((unit) => unit.unitNumber),
  }));

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl py-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Connect with your property team.</p>
        </div>
      </div>
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          </div>
        ) : (
          <MessagingPanel
            isOpen
            onClose={() => undefined}
            fullPage
            onSelectConversation={(conversation) => setSelected(conversation.otherUser)}
          />
        )}
      </div>
      {selected && (
        <MessagingModal
          isOpen
          otherUser={selected}
          properties={propertiesWithUnits}
          onClose={() => setSelected(null)}
        />
      )}
      {!loading && conversations.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">No messages yet.</p>
      )}
    </div>
  );
}
