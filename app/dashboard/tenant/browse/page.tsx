"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Flag, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getProperties, getUnits, createRating, getComplaints, createComplaint,
  Property, Unit,
} from "@/lib/data";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function TenantBrowsePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<{ type: "property" | "unit"; id: string; name: string } | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [complaintTarget, setComplaintTarget] = useState<{ type: "property" | "unit"; id: string; name: string } | null>(null);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("medium");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [props, unts] = await Promise.all([
          getProperties(),
          getUnits(),
        ]);
        if (isMounted) {
          setProperties(props);
          setUnits(unts);
        }
      } catch {
        if (isMounted) {
          setProperties([]);
          setUnits([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitRating = async () => {
    if (!ratingTarget || userRating === 0) { toast.error("Please select a star rating"); return; }
    setIsSubmittingRating(true);
    try {
      await createRating({ userId: user!.id, targetType: ratingTarget.type, targetId: ratingTarget.id, rating: userRating, comment: ratingComment });
      toast.success("Rating submitted! Thank you for your feedback.");
      setRatingTarget(null); setUserRating(0); setRatingComment("");
    } catch { toast.error("Failed to submit rating"); }
    finally { setIsSubmittingRating(false); }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintTarget || !complaintSubject.trim() || !complaintMessage.trim()) { toast.error("Please fill in all fields"); return; }
    setIsSubmittingComplaint(true);
    try {
      await createComplaint({ tenantId: user!.id, targetType: complaintTarget.type, targetId: complaintTarget.id, subject: complaintSubject, message: complaintMessage, priority: complaintPriority });
      toast.success("Complaint submitted! We will review it shortly.");
      setComplaintTarget(null); setComplaintSubject(""); setComplaintMessage(""); setComplaintPriority("medium");
    } catch { toast.error("Failed to submit complaint"); }
    finally { setIsSubmittingComplaint(false); }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Next Home</h1>
            <p className="text-xl text-blue-100 mb-8">Browse verified rental properties and units in your area</p>
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by location, property name, or unit type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base bg-white text-gray-900 border-0 rounded-xl shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Properties</h2>
          <p className="text-gray-500">Discover verified rental properties</p>
        </motion.div>

        {loading ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading properties...</p>
            </CardContent>
          </Card>
        ) : filteredProperties.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 font-medium">No properties found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => {
              const propertyUnits = units.filter(u => u.propertyId === property.id);
              const vacantCount = propertyUnits.filter(u => u.status === "vacant").length;
              return (
                <div key={property.id}>
                  <Card className="overflow-hidden border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {property.imageUrl ? (
                        <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <span className="text-5xl">🏠</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-green-600 border-green-200 capitalize">
                          {property.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg truncate pr-2">{property.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">—</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center gap-1 truncate">
                        📍 {property.location}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize truncate">{property.type === "house" ? "House" : "Condominium"}</span>
                        <span className="font-medium text-gray-900 flex-shrink-0">{vacantCount} units available</span>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          className="h-9 text-xs flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                          onClick={() => { setRatingTarget({ type: "property", id: property.id, name: property.name }); setUserRating(0); setRatingComment(""); }}
                        >
                          <Star className="h-3.5 w-3.5" />Rate
                        </button>
                        <button
                          className="h-9 text-xs flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-all"
                          onClick={() => { setComplaintTarget({ type: "property", id: property.id, name: property.name }); setComplaintSubject(""); setComplaintMessage(""); }}
                        >
                          <Flag className="h-3.5 w-3.5" />Complain
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRatingTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setRatingTarget(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Rate {ratingTarget.name}</h3>
            <p className="text-sm text-gray-500 mb-5">Share your experience with this {ratingTarget.type}</p>
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setUserRating(star)} className="p-1 transition-transform hover:scale-110">
                  <Star className={`h-9 w-9 transition-colors ${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-600">{userRating > 0 ? `${userRating}/5` : ""}</span>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
              <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Share your thoughts..." className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
            </div>
            <Button onClick={handleSubmitRating} disabled={isSubmittingRating || userRating === 0} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSubmittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </motion.div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setComplaintTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setComplaintTarget(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Submit Complaint</h3>
            <p className="text-sm text-gray-500 mb-5">Report an issue with {complaintTarget.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <Input value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} placeholder="Brief description of the issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select value={complaintPriority} onChange={(e) => setComplaintPriority(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 text-sm px-3">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea value={complaintMessage} onChange={(e) => setComplaintMessage(e.target.value)} placeholder="Describe the issue in detail..." className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
              </div>
              <Button onClick={handleSubmitComplaint} disabled={isSubmittingComplaint || !complaintSubject.trim() || !complaintMessage.trim()} className="w-full bg-red-600 hover:bg-red-700">
                {isSubmittingComplaint ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
