"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, Plus, Search, Filter, MapPin, Home, Users, DollarSign, MoreHorizontal, Edit, Trash2, Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getProperties, getUnits, getOccupancyRate, addProperty, deleteProperty, Property, Unit } from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([
      getProperties(user).then(setProperties),
      getUnits(user).then(setUnits)
    ]);
  }, [user]);

  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      await deleteProperty(id);
      const props = await getProperties(user);
      setProperties(props);
      toast.success("Property deleted");
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* 🏘️ Properties Hero — Bold Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
              <Building2 className="h-3 w-3" />
              Property Portfolio
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Properties</h2>
            <p className="text-white/70 text-sm mt-1.5">Manage your rental properties and their units</p>
          </div>
          <Button className="bg-white text-orange-700 hover:bg-orange-50 shadow-lg"><Plus className="h-4 w-4 mr-1.5" />Add Property</Button>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input placeholder="Search properties..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProperties.length === 0 ? (
          <div className="md:col-span-2 text-center py-16">
            <Building2 className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No properties yet</p>
            <p className="text-text-tertiary text-sm mt-1">Add your first property to get started</p>
          </div>
        ) : (
          filteredProperties.map((property, i) => {
            const rate = getOccupancyRate(property.id);
            const propertyUnits = units.filter((u) => u.propertyId === property.id);

            return (
              <motion.div key={property.id} variants={fadeInUp} custom={i}>
                <Card className="overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/5 relative">
                    <div className="absolute top-4 right-4">
                      <Badge variant="outline" className={cn(
                        "bg-white/90 backdrop-blur-sm",
                        property.status === "active" ? "text-green-600 border-green-200" : "text-gray-600 border-gray-200"
                      )}>
                        {property.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{property.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          <MapPin className="h-3 w-3" />{property.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                          <Home className="h-3.5 w-3.5 text-primary-500" />{propertyUnits.length}
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5">Total Units</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                          <Users className="h-3.5 w-3.5 text-secondary-500" />{propertyUnits.filter(u => u.status === "occupied").length}
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5">Occupied</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-accent-500" />{formatCurrency(property.monthlyRevenue)}
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5">Monthly</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-text-secondary">Occupancy Rate</span>
                        <span className="font-medium text-foreground">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-1.5"
                        indicatorClassName={cn(rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500")} />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                      <Button size="sm" variant="outline" className="flex-1"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(property.id, property.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
