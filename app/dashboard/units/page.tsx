"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Plus, Search, Edit, Check, Trash2, Image as ImageIcon, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getUnits, getProperties, addUnit, updateUnit, deleteUnit, Unit, Property, notifyAdmins } from "@/lib/data";
import { toast } from "sonner";
import UnitImageCarousel from "@/components/unit-image-carousel";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editForm, setEditForm] = useState({ propertyId: "", unitNumber: "", floor: "", status: "vacant" as Unit["status"], rentAmount: "", imageUrl: "", imageUrls: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({ propertyId: "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "", imageUrls: [] as string[] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canManage = user && (user.role === "admin" || user.role === "owner");

  useEffect(() => {
    (async () => {
      try {
        const [unts, props] = await Promise.all([
          getUnits(user),
          getProperties(user),
        ]);
        setUnits(unts);
        setProperties(props);
      } catch (err) {
        console.error("Failed to load units", err);
        toast.error("Failed to load units");
      } finally {
        setLoading(false);
      }
    })();
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

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.unitNumber || !formData.propertyId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const dataToSend = { ...formData, status: "vacant" as const, imageUrl: formData.imageUrls[0] || imagePreview || formData.imageUrl || undefined, imageUrls: formData.imageUrls };
      const createdUnit = await addUnit(dataToSend);
      setUnits((current) => [createdUnit, ...current]);
      setProperties((current) => current.map((property) => property.id === formData.propertyId ? { ...property, units: property.units + 1 } : property));
      setShowAddModal(false);
      setFormData({ propertyId: "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "", imageUrls: [] });
      setSelectedFile(null);
      setImagePreview(null);
      notifyAdmins({ title: "New Unit Added", message: `Unit ${formData.unitNumber} was added by ${user?.name}`, type: "property", read: false });
      toast.success("Unit added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add unit");
    }
  };

  const openEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditForm({
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber,
      floor: unit.floor?.toString() || "",
      status: unit.status,
      rentAmount: unit.rentAmount.toString(),
      imageUrl: unit.imageUrl || "",
      imageUrls: unit.imageUrls || (unit.imageUrl ? [unit.imageUrl] : []),
    });
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving || !editingUnit || !editForm.propertyId || !editForm.unitNumber || editForm.rentAmount === "") {
      toast.error("Complete the property, unit number, and rent fields");
      return;
    }
    setIsSaving(true);
    try {
      const savedUnit = await updateUnit(editingUnit.id, {
        propertyId: editForm.propertyId,
        unitNumber: editForm.unitNumber.trim(),
        floor: editForm.floor === "" ? undefined : Number(editForm.floor),
        status: editForm.status,
        rentAmount: Number(editForm.rentAmount),
        imageUrl: editForm.imageUrl.trim() || undefined,
        imageUrls: editForm.imageUrls,
      });
      if (!savedUnit) throw new Error("Failed to update unit");
      const updatedUnit = { ...editingUnit, ...editForm, floor: editForm.floor === "" ? undefined : Number(editForm.floor), rentAmount: Number(editForm.rentAmount), imageUrl: editForm.imageUrl.trim() || undefined };
      setUnits((current) => current.map((unit) => unit.id === editingUnit.id ? updatedUnit : unit));
      setEditingUnit(null);
      toast.success("Unit updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update unit");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadUnitImages = async (files: File[]) => {
    const urls = await Promise.all(files.map(async (file) => {
      const body = new FormData();
      body.append("file", file);
      body.append("type", "unit");
      const response = await fetch("/api/auth/upload", { method: "POST", credentials: "include", body });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to upload image");
      return result.url as string;
    }));
    return Array.from(new Set(urls));
  };

  const removeUnitImage = async (imageUrl: string, editing: boolean) => {
    if (editing) {
      setEditForm((current) => {
        const imageUrls = current.imageUrls.filter((url) => url !== imageUrl);
        return { ...current, imageUrls, imageUrl: imageUrls[0] || "" };
      });
    } else {
      setFormData((current) => {
        const imageUrls = current.imageUrls.filter((url) => url !== imageUrl);
        return { ...current, imageUrls, imageUrl: imageUrls[0] || "" };
      });
    }
    const uploadId = imageUrl.match(/\/api\/auth\/upload\/([^/?#]+)/)?.[1];
    if (uploadId) await fetch(`/api/auth/upload/${uploadId}`, { method: "DELETE", credentials: "include" }).catch(() => undefined);
  };

  const handleDelete = async (unit: Unit) => {
    if (!window.confirm(`Delete unit ${unit.unitNumber}? This cannot be undone.`)) return;
    try {
      await deleteUnit(unit.id);
      setUnits((current) => current.filter((item) => item.id !== unit.id));
      toast.success("Unit deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete unit");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 p-8 sm:p-10">
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
          {canManage && (
            <Button onClick={() => { setFormData({ propertyId: properties[0]?.id || "", unitNumber: "", floor: 0, rentAmount: 0, imageUrl: "", imageUrls: [] }); setSelectedFile(null); setImagePreview(null); setShowAddModal(true); }}
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg"><Plus className="h-4 w-4 mr-1.5" />Add Unit</Button>
          )}
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
                <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className={cn("h-1.5 w-full", unit.status === "occupied" && "bg-green-500", unit.status === "vacant" && "bg-gray-300", unit.status === "maintenance" && "bg-amber-500")} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-5">
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Unit Number</p>
                            <h3 className="mt-1 text-xl font-semibold text-foreground wrap-break-word">{unit.unitNumber}</h3>
                            <p className="mt-1 text-sm text-text-secondary truncate">{property?.name || "Unknown property"}</p>
                          </div>
                          <Badge variant="outline" className={cn("shrink-0 text-xs font-medium px-2.5 py-1 capitalize", statusColors[unit.status])}>
                            {unit.status}
                          </Badge>
                        </div>
                        {canManage && (
                          <div className="mb-4 flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => openEdit(unit)} className="flex-1"><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(unit)} className="flex-1"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button>
                          </div>
                        )}
                        {unit.imageUrls?.length || unit.imageUrl ? <UnitImageCarousel images={unit.imageUrls || (unit.imageUrl ? [unit.imageUrl] : [])} alt={`Unit ${unit.unitNumber}`} className="mb-4 h-40 w-full rounded-xl" /> : null}
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
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Property *</label>
              <select value={formData.propertyId} onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })} className="w-full h-9 rounded-lg border border-border bg-surface text-foreground px-3 text-sm">
                <option value="">Select a property</option>
                {properties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Unit Number *</label>
              <Input value={formData.unitNumber} onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })} placeholder="e.g. Unit 101" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Floor</label>
              <Input type="number" value={formData.floor || ""} onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })} placeholder="e.g. 1" className="h-9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Rent Amount (₱)</label>
              <Input type="number" value={formData.rentAmount || ""} onChange={(e) => setFormData({ ...formData, rentAmount: parseInt(e.target.value) || 0 })} placeholder="e.g. 5000" className="h-9" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Unit Images</label>
            <Input type="file" accept="image/*" multiple onChange={async (event) => {
              const files = Array.from(event.target.files || []);
              if (!files.length) return;
              try {
                const urls = await uploadUnitImages(files);
                setFormData((current) => ({ ...current, imageUrl: current.imageUrl || urls[0], imageUrls: Array.from(new Set([...current.imageUrls, ...urls])) }));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to upload images");
              } finally {
                event.target.value = "";
              }
            }} />
            {formData.imageUrls.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{formData.imageUrls.map((url, index) => <div key={`${url}-${index}`} className="relative"><img src={url} alt={`Unit preview ${index + 1}`} className="h-16 w-16 rounded-lg border object-cover" /><button type="button" onClick={() => void removeUnitImage(url, false)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white" aria-label={`Remove image ${index + 1}`}><X className="h-3 w-3" /></button></div>)}</div>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="h-9">Cancel</Button>
            <Button type="submit" className="h-9"><Check className="h-4 w-4 mr-1.5" />Add Unit</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingUnit} onClose={() => setEditingUnit(null)} title="Edit Unit" description="Update every unit detail">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Property *</label>
            <select required value={editForm.propertyId} onChange={(event) => setEditForm({ ...editForm, propertyId: event.target.value })} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm">
              <option value="">Select a property</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-foreground">Unit Number *</label><Input required value={editForm.unitNumber} onChange={(event) => setEditForm({ ...editForm, unitNumber: event.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium text-foreground">Floor</label><Input type="number" min="0" value={editForm.floor} onChange={(event) => setEditForm({ ...editForm, floor: event.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-foreground">Monthly Rent *</label><Input required type="number" min="0" value={editForm.rentAmount} onChange={(event) => setEditForm({ ...editForm, rentAmount: event.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium text-foreground">Status</label><select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value as Unit["status"] })} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="vacant">Vacant</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Unit Images</label>
            <Input type="file" accept="image/*" multiple onChange={async (event) => {
              const files = Array.from(event.target.files || []);
              if (!files.length) return;
              try {
                const urls = await uploadUnitImages(files);
                setEditForm((current) => ({ ...current, imageUrl: current.imageUrl || urls[0], imageUrls: Array.from(new Set([...current.imageUrls, ...urls])) }));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to upload images");
              } finally {
                event.target.value = "";
              }
            }} />
            {editForm.imageUrls.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{editForm.imageUrls.map((url, index) => <div key={`${url}-${index}`} className="relative"><img src={url} alt={`Unit preview ${index + 1}`} className="h-16 w-16 rounded-lg border object-cover" /><button type="button" onClick={() => void removeUnitImage(url, true)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white" aria-label={`Remove image ${index + 1}`}><X className="h-3 w-3" /></button></div>)}</div>}
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button></div>
        </form>
      </Modal>
    </motion.div>
  );
}
