"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Home, CreditCard, Building2, UserPlus, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, Search, Filter, MoreHorizontal, Phone, Mail, MapPin, X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatCurrency, getTimeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getProperties, getUnits, getTenants as getTenantRecords, getPayments,
  getOccupancyRate, verifyPayment, addNotification, Property, Unit, TenantRecord, Payment,
} from "@/lib/data";
import { toast } from "sonner";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AgentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([
      getProperties(user).then(setProperties),
      getUnits(user).then(setUnits),
      getTenantRecords(user).then(setTenants),
      getPayments(user).then(setPayments)
    ]);
  }, [user]);

  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "partial");
  const activeTenants = tenants.filter((t) => t.status === "active");
  const totalOccupied = units.filter((u) => u.status === "occupied").length;
  const totalVacant = units.filter((u) => u.status === "vacant").length;

  const filteredTenants = activeTenants.filter(
    (t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = async (paymentId: string, status: "paid" | "rejected") => {
    const result = await verifyPayment(paymentId, user?.id || "", status);
    if (result) {
      const payments = await getPayments(user);
      setPayments(payments);
      if (user) {
        await addNotification({
          userId: result.tenantId,
          title: status === "paid" ? "Payment Verified" : "Payment Rejected",
          message: `Your payment of ${formatCurrency(result.amountPaid)} has been ${status}`,
          type: "payment",
          read: false,
        });
      }
      toast.success(`Payment ${status === "paid" ? "approved" : "rejected"} successfully`);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* 🤝 Agent Hero — Material Accent Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-green-600 p-8 sm:p-10">
        <div className="absolute inset-0 bg-white/5" />
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
              <Users className="h-3 w-3" />
              Agent Portal
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Agent Dashboard</h2>
            <p className="text-white/70 text-sm mt-1.5">Manage tenants, units, and pending payment verifications</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Tenants", value: activeTenants.length, icon: Users, color: "from-primary-500 to-primary-600", change: `${tenants.length} total registered` },
          { label: "Occupied Units", value: totalOccupied, icon: Home, color: "from-secondary-500 to-secondary-600", change: `${Math.round((totalOccupied / (units.length || 1)) * 100)}% occupancy` },
          { label: "Pending Verifications", value: pendingPayments.length, icon: Clock, color: "from-accent-500 to-accent-600", change: "Requires attention" },
          { label: "Vacant Units", value: totalVacant, icon: Building2, color: "from-purple-500 to-purple-600", change: `${formatCurrency(totalVacant * 6500)} potential revenue` },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <Card><CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-text-secondary">{stat.label}</span>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-text-secondary">{stat.change}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="pending">Pending Verifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Occupancy</CardTitle>
                <CardDescription>Current occupancy by property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {properties.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-8">No properties registered yet</p>
                ) : (
                  properties.map((property) => {
                    const rate = getOccupancyRate(property.id);
                    return (
                      <div key={property.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{property.name}</p>
                            <p className="text-xs text-text-secondary">{property.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{rate}%</p>
                            <p className="text-xs text-text-secondary">{property.occupiedUnits}/{property.units} units</p>
                          </div>
                        </div>
                        <Progress value={rate} className="h-2"
                          indicatorClassName={cn(rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500")} />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tenant Activity</CardTitle>
                <CardDescription>Latest tenant registrations and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTenants.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-8">No tenants registered yet</p>
                  ) : (
                    activeTenants.slice(0, 5).map((tenant, i) => (
                      <div key={tenant.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={tenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                            <p className="text-xs text-text-secondary">{tenant.propertyName} • {tenant.unitNumber}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">Active</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Tenants</CardTitle>
                  <CardDescription>Manage tenant information and assignments</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input placeholder="Search tenants..." className="pl-9 h-9 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTenants.length === 0 ? (
                  <p className="text-center py-8 text-text-secondary text-sm">No tenants found</p>
                ) : (
                  filteredTenants.map((tenant, i) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-surface-secondary transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar fallback={tenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} />
                        <div>
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tenant.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tenant.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-foreground">{tenant.propertyName}</p>
                        <p className="text-xs text-text-secondary">{tenant.unitNumber} • {formatCurrency(tenant.rentAmount)}/mo</p>
                      </div>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Payment receipts awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-text-secondary font-medium">All caught up!</p>
                  <p className="text-text-tertiary text-sm">No pending payment verifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((payment, i) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-amber-50/30 dark:bg-amber-900/10">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={payment.tenantName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{payment.tenantName}</p>
                          <p className="text-xs text-text-secondary">{payment.propertyName} • {getTimeAgo(payment.paymentDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</p>
                          <p className="text-xs text-text-secondary">of {formatCurrency(payment.amountDue)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                            onClick={() => handleVerify(payment.id, "paid")}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => handleVerify(payment.id, "rejected")}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
