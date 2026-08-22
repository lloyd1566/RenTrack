"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Home, Search, Eye } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getUnits, Unit, getProperties, Property } from "@/lib/data";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function TenantUnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([
      getUnits().then(setUnits).catch(() => setUnits([])),
      getProperties().then(setProperties).catch(() => setProperties([])),
    ]);
  }, []);

  const filteredUnits = units.filter((u) =>
    u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.propertyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const vacantUnits = filteredUnits.filter(u => u.status === "vacant");

  return (
    <div className="min-h-screen">
      {/* Hero */}
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Available Units</h1>
            <p className="text-xl text-blue-100">Browse vacant units across all properties</p>
          </motion.div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-white border-gray-200"
            />
          </div>
        </motion.div>

        {vacantUnits.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No vacant units found</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new listings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vacantUnits.map((unit, index) => {
              const property = properties.find(p => p.id === unit.propertyId);
              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Card className="border-gray-200 hover:shadow-2xl transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Home className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Unit {unit.unitNumber}</p>
                            <p className="text-sm text-gray-500">{property?.name || "Unknown Property"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Floor</span>
                          <span className="text-sm font-medium text-gray-900">{unit.floor || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Monthly Rent</span>
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(unit.rentAmount)}</span>
                        </div>
                         <div className="flex items-center justify-between py-2">
                           <span className="text-sm text-gray-500">Status</span>
                           <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 capitalize">Vacant</Badge>
                         </div>
                       </div>
                       <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <Button size="sm" variant="ghost" className="h-9 text-xs flex-1 hover:bg-blue-50 hover:text-blue-600 transition-all">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />View Details
                        </Button>
                        <Button size="sm" className="h-9 text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                          Inquire
                        </Button>
                      </div>
                     </CardContent>
                   </Card>
                 </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
