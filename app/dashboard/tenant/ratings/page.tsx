"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getRatingsByUser, getComplaints, Rating, Complaint } from "@/lib/data";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TenantRatingsPage() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [r, c] = await Promise.all([
          getRatingsByUser(user.id),
          getComplaints(user.id),
        ]);
        if (!cancelled) {
          setRatings(r || []);
          setComplaints(c || []);
        }
      } catch {
        if (!cancelled) {
          setRatings([]);
          setComplaints([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Ratings & Complaints</h1>
            <p className="text-xl text-blue-100">View your submitted feedback and reports</p>
          </motion.div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Ratings & Complaints</h2>
            <p className="text-gray-500 text-sm mt-1">Review your submitted feedback and reports</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Loading your feedback...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Ratings</h2>
              {ratings.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-10 text-center">
                    <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No ratings yet</p>
                    <p className="text-gray-500 text-sm mt-1">Rate properties and units from the Browse page</p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  className="space-y-3"
                >
                  {ratings.map((rating) => (
                    <motion.div
                      key={rating.id}
                      variants={item}
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Card className="border-gray-200 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{rating.targetType}: {rating.targetId}</p>
                              <div className="flex items-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <motion.div
                                    key={star}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: star * 0.05 }}
                                  >
                                    <Star className={`h-4 w-4 ${star <= rating.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                                  </motion.div>
                                ))}
                                <span className="text-sm text-gray-600 ml-1">{rating.rating}/5</span>
                              </div>
                              {rating.comment && (
                                <p className="text-sm text-gray-600 mt-2">{rating.comment}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{new Date(rating.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Complaints</h2>
              {complaints.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-10 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No complaints yet</p>
                    <p className="text-gray-500 text-sm mt-1">Submit a complaint from the Browse page if you have issues</p>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  className="space-y-3"
                >
                  {complaints.map((complaint) => (
                    <motion.div
                      key={complaint.id}
                      variants={item}
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Card className="border-gray-200 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{complaint.subject}</p>
                              <p className="text-sm text-gray-600 mt-1">{complaint.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={cn(
                                  "text-xs capitalize",
                                  complaint.status === "open" && "bg-amber-50 text-amber-600 border-amber-200",
                                  complaint.status === "in_progress" && "bg-blue-50 text-blue-600 border-blue-200",
                                  complaint.status === "resolved" && "bg-green-50 text-green-600 border-green-200",
                                  complaint.status === "closed" && "bg-gray-50 text-gray-600 border-gray-200",
                                )}>{complaint.status.replace("_", " ")}</Badge>
                                <Badge variant="outline" className="text-xs capitalize">{complaint.priority}</Badge>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
