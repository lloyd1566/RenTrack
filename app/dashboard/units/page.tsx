"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Plus, Search, Edit, MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getUnits, getProperties, Unit, Property } from "@/lib/data";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusColors: Record<string, string> = {
  occupied: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400",
  vacant: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400",
  maintenance: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
};

export default function UnitsPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    Promise.all([
      getUnits(user).then(setUnits),
      getProperties(user).then(setProperties)
    ]);
  }, [user]);

  const filteredUnits = units.filter((u) => {
    const matchesSearch = u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.tenantName && u.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === "all" || u.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Units Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 p-8 sm:p-10">
        <div className="absolute -top-6 -right-6 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
              <Home className="h-3 w-3" />
              Unit Management
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Units</h2>
            <p className="text-white/70 text-sm mt-1.5">Manage all rental units across your properties</p>
          </div>
          <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg"><Plus className="h-4 w-4 mr-1.5" />Add Unit</Button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({units.length})</TabsTrigger>
            <TabsTrigger value="occupied">Occupied ({units.filter((u) => u.status === "occupied").length})</TabsTrigger>
            <TabsTrigger value="vacant">Vacant ({units.filter((u) => u.status === "vacant").length})</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance ({units.filter((u) => u.status === "maintenance").length})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input placeholder="Search units..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUnits.length === 0 ? (
          <div className="md:col-span-3 text-center py-16">
            <Home className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No units found</p>
            <p className="text-text-tertiary text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredUnits.map((unit, i) => {
            const property = properties.find((p) => p.id === unit.propertyId);
            return (
              <motion.div key={unit.id} variants={fadeInUp} custom={i}>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={cn("h-1.5 w-full", unit.status === "occupied" && "bg-green-500", unit.status === "vacant" && "bg-gray-300", unit.status === "maintenance" && "bg-amber-500")} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{unit.unitNumber}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">{property?.name || "Unknown property"}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5 capitalize", statusColors[unit.status])}>
                          {unit.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Rent Amount</span>
                          <span className="font-medium text-foreground">{formatCurrency(unit.rentAmount)}/mo</span>
                        </div>
                        {unit.tenantName && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Tenant</span>
                            <span className="font-medium text-foreground">{unit.tenantName}</span>
                          </div>
                        )}
                        {unit.leaseEnd && (
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Lease Ends</span>
                            <span className="font-medium text-foreground">{formatDate(unit.leaseEnd)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"><Edit className="h-3 w-3 mr-1" />Edit</Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </div>
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
