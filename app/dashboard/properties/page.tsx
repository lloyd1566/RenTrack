"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, Plus, Search, MapPin, Home, Users, DollarSign, Edit, Trash2, Eye, X, Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getProperties, getUnits, addProperty, deleteProperty, Property, Unit } from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "", type: "house" as "house" | "condominium", units: 0 });

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

  const handleAdd = async () => {
    if (!formData.name || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (user) {
      await addProperty(formData as any, user.id);
      const props = await getProperties(user);
      setProperties(props);
      setShowAddModal(false);
      setFormData({ name: "", location: "", type: "house", units: 0 });
      toast.success("Property added successfully");
    }
  };

  const handleEdit = async () => {
    if (!selectedProperty || !formData.name || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await fetch("/api/data/properties/patch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedProperty.id, data: formData }),
      });
      const props = await getProperties(user);
      setProperties(props);
      setShowEditModal(false);
      setSelectedProperty(null);
      toast.success("Property updated successfully");
    } catch {
      toast.error("Failed to update property");
    }
  };

  const openEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({ name: property.name, location: property.location, type: property.type, units: property.units });
    setShowEditModal(true);
  };

  const openView = (property: Property) => {
    setSelectedProperty(property);
    setShowViewModal(true);
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
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
          <Button onClick={() => { setFormData({ name: "", location: "", type: "house", units: 0 }); setShowAddModal(true); }}
            className="bg-white text-orange-700 hover:bg-orange-50 shadow-lg"><Plus className="h-4 w-4 mr-1.5" />Add Property</Button>
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
            const propertyUnits = units.filter((u) => u.propertyId === property.id);
            const occupied = propertyUnits.filter(u => u.status === "occupied").length;
            const rate = propertyUnits.length > 0 ? Math.round((occupied / propertyUnits.length) * 100) : 0;

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
                          <Users className="h-3.5 w-3.5 text-secondary-500" />{occupied}
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
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openView(property)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(property)}>
                        <Edit className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
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

      {/* Add Property Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Property" description="Add a new rental property to your portfolio">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Property Name *</label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location *</label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Butuan City" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "house" | "condominium" })}
              className="w-full h-12 rounded-xl border border-border bg-surface text-foreground px-4">
              <option value="house">House</option>
              <option value="condominium">Condominium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Number of Units</label>
            <Input type="number" value={formData.units || ""} onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 0 })} placeholder="e.g. 10" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="flex-1"><Check className="h-4 w-4 mr-1.5" />Add Property</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* View Property Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={selectedProperty?.name || "Property Details"} description={selectedProperty?.location}>
        {selectedProperty && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-secondary">
                <p className="text-xs text-text-secondary">Type</p>
                <p className="text-sm font-semibold text-foreground capitalize mt-1">{selectedProperty.type}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-secondary">
                <p className="text-xs text-text-secondary">Status</p>
                <p className="text-sm font-semibold text-foreground capitalize mt-1">{selectedProperty.status}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-secondary">
                <p className="text-xs text-text-secondary">Total Units</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedProperty.units}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-secondary">
                <p className="text-xs text-text-secondary">Monthly Revenue</p>
                <p className="text-sm font-semibold text-foreground mt-1">{formatCurrency(selectedProperty.monthlyRevenue)}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowViewModal(false)}>Close</Button>
          </div>
        )}
      </Modal>

      {/* Edit Property Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Property" description="Update property details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Property Name *</label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location *</label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as "house" | "condominium" })}
              className="w-full h-12 rounded-xl border border-border bg-surface text-foreground px-4">
              <option value="house">House</option>
              <option value="condominium">Condominium</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleEdit} className="flex-1"><Check className="h-4 w-4 mr-1.5" />Save Changes</Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
