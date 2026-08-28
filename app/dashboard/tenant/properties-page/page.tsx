"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, DollarSign, Bed, Bath, Square, Sparkles, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { getProperties, Property } from "@/lib/data";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const propertyImages = [
  "/images/landing/feature-property.jpg",
  "/images/landing/feature-tenant.jpg",
  "/images/landing/feature-payment.jpg",
  "/images/landing/feature-dashboard.jpg",
  "/images/landing/feature-notifications.jpg",
  "/images/landing/feature-security.jpg",
];

export default function TenantPropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const props = await getProperties(user);
        setProperties(props);
      } catch {
        toast.error("Failed to load properties");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white py-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3 border border-white/10">
              <Sparkles className="h-3 w-3" />
              Available Rentals
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Properties</h1>
            <p className="text-lg text-blue-100">Browse available rental properties in your area.</p>
          </motion.div>
        </div>
      </div>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No properties available yet</p>
            <p className="text-gray-400 text-sm mt-1">Please check back later</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProperties.map((property, idx) => (
              <motion.div
                key={property.id}
                variants={item}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="overflow-hidden border border-border hover:shadow-xl transition-all duration-300 h-full group">
                  <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center overflow-hidden">
                     {(() => {
                       const imgSrc = property.imageUrl || propertyImages[idx % propertyImages.length];
                       return imgSrc ? (
                         <img src={imgSrc} alt={property.name} className="w-full h-full object-cover" />
                       ) : (
                         <motion.div
                           animate={{ y: [0, -8, 0] }}
                           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                         >
                           <Building2 className="h-16 w-16 text-blue-500" />
                         </motion.div>
                       );
                     })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 right-3">
                      <Badge variant={property.status === "active" ? "success" : "secondary"} className="text-[10px]">
                        {property.status === "active" ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                   <div className="p-4">
                     <h3 className="font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">{property.name}</h3>
                     <div className="flex items-center gap-1 text-sm text-text-secondary mb-2">
                       <MapPin className="h-3.5 w-3.5" />
                       {property.location}
                     </div>
                     <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                       <span className="flex items-center gap-1 capitalize"><Building2 className="h-4 w-4" /> {property.type}</span>
                       <span className="flex items-center gap-1"><Square className="h-4 w-4" /> {property.units} units</span>
                     </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-foreground">{formatCurrency(property.monthlyRevenue || 0)}</span>
                        <span className="text-sm text-text-secondary font-normal">/mo</span>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" variant="outline">View Details</Button>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
