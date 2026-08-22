"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Flag, Search, X, Sparkles, Home, MapPin, Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  getProperties, getUnits, createRating, createComplaint,
  Property, Unit,
} from "@/lib/data";
import { toast } from "sonner";

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
      {/* Hero Section - Centered */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700 text-white overflow-hidden">
        {/* Animated floating orbs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-secondary-400/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-2xl"
        />

        {/* Sparkle icons */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-20 opacity-30"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-20 opacity-20"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>

        {/* Centered content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="space-y-6"
          >
            {/* Animated icon */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-2"
            >
              <Home className="h-8 w-8 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Find Your Next Home
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Browse verified rental properties and units in your area
            </p>

            {/* Search bar with glow effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by location, property name, or unit type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base bg-white text-gray-900 border-0 rounded-2xl shadow-2xl shadow-black/20 focus:ring-4 focus:ring-white/30 transition-all"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-2"
            >
              {[
                { icon: Shield, label: "Verified Listings" },
                { icon: MapPin, label: "Prime Locations" },
                { icon: Clock, label: "Quick Booking" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium"
                >
                  <feature.icon className="h-3.5 w-3.5" />
                  {feature.label}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto h-10 w-10 rounded-full border-4 border-primary-200 border-t-primary-600 mb-4"
              />
              <p className="text-gray-600 font-medium">Loading properties...</p>
            </CardContent>
          </Card>
        ) : filteredProperties.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🏠
              </motion.div>
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
                <motion.div key={property.id} whileHover={{ y: -8, transition: { duration: 0.2 } }}>
                  <Card className="overflow-hidden border-gray-200 hover:shadow-2xl transition-all duration-300 h-full group">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {property.imageUrl ? (
                        <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-6xl"
                          >
                            🏠
                          </motion.span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="absolute top-3 right-3"
                      >
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-green-600 border-green-200 capitalize">
                          {property.status}
                        </Badge>
                      </motion.div>
                      {vacantCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="absolute bottom-3 left-3"
                        >
                          <Badge className="bg-primary-600 text-white text-[10px] font-bold">
                            {vacantCount} Available
                          </Badge>
                        </motion.div>
                      )}
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
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="h-9 text-xs flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all"
                          onClick={() => { setRatingTarget({ type: "property", id: property.id, name: property.name }); setUserRating(0); setRatingComment(""); }}
                        >
                          <Star className="h-3.5 w-3.5" />Rate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="h-9 text-xs flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-all"
                          onClick={() => { setComplaintTarget({ type: "property", id: property.id, name: property.name }); setComplaintSubject(""); setComplaintMessage(""); }}
                        >
                          <Flag className="h-3.5 w-3.5" />Complain
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
                <motion.button
                  key={star}
                  onClick={() => setUserRating(star)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1"
                >
                  <Star className={`h-9 w-9 transition-colors ${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                </motion.button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-600">{userRating > 0 ? `${userRating}/5` : ""}</span>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
              <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Share your thoughts..." className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" />
            </div>
            <Button onClick={handleSubmitRating} disabled={isSubmittingRating || userRating === 0} className="w-full bg-primary-600 hover:bg-primary-700">
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
                <textarea value={complaintMessage} onChange={(e) => setComplaintMessage(e.target.value)} placeholder="Describe the issue in detail..." className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" />
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
