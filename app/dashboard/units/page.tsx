"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Plus, Search, Edit, Check, Upload, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getUnits, getProperties, addUnit, Unit, Property } from "@/lib/data";
import { toast } from "sonner";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({ propertyId: "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!formData.unitNumber || !formData.propertyId) {
      toast.error("Please fill in all required fields");
      return;
    }
    const dataToSend = { ...formData, status: "vacant" as const, imageUrl: imagePreview || formData.imageUrl || undefined };
    await addUnit(dataToSend);
    const unts = await getUnits(user);
    setUnits(unts);
    setShowAddModal(false);
    setFormData({ propertyId: "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "" });
    setSelectedFile(null);
    setImagePreview(null);
    toast.success("Unit added successfully");
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
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
          <Button onClick={() => { setFormData({ propertyId: properties[0]?.id || "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "" }); setSelectedFile(null); setImagePreview(null); setShowAddModal(true); }}
            className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg"><Plus className="h-4 w-4 mr-1.5" />Add Unit</Button>
        </div>
      </div>

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
                        {unit.imageUrl && (
                          <div className="pt-2">
                            <button onClick={() => setShowImageModal(unit.imageUrl!)}
                              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors">
                              <ImageIcon className="h-3.5 w-3.5" />View Photo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

{/* Image Lightbox Modal */}
      <Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title="Unit Photo" description="">
        {showImageModal && (
          <div className="flex justify-center">
            <img src={showImageModal} alt="Unit" className="max-w-full max-h-[70vh] rounded-xl object-contain" />
          </div>
        )}
      </Modal>

      {/* Add Unit Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Unit" description="Add a new rental unit to a property">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Property *</label>
            <select value={formData.propertyId} onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              className="w-full h-12 rounded-xl border border-border bg-surface text-foreground px-4">
              <option value="">Select a property</option>
              {properties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Unit Number *</label>
            <Input value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} placeholder="e.g. Unit 101" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Floor</label>
              <Input type="number" value={formData.floor || ""} onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Rent Amount (₱)</label>
              <Input type="number" value={formData.rentAmount || ""} onChange={(e) => setFormData({ ...formData, rentAmount: parseInt(e.target.value) || 0 })} placeholder="e.g. 5000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Unit Photo</label>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary-300 transition-colors"
              onClick={() => document.getElementById("unit-image-upload")?.click()}>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-32 w-48 object-cover rounded-xl" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-text-tertiary" />
                  <p className="text-sm text-text-secondary">Click to upload a photo of the unit</p>
                  <p className="text-xs text-text-tertiary mt-1">JPG, PNG, or GIF</p>
                </>
              )}
              <input id="unit-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="flex-1"><Check className="h-4 w-4 mr-1.5" />Add Unit</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
