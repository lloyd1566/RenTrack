"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, Search, Phone, Mail, Building2, Home, DollarSign, MoreHorizontal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getTenants as getTenantRecords, TenantRecord } from "@/lib/data";

const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const fadeInUp = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function TenantsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getTenantRecords(user).then(setTenants);
  }, [user]);

  const filteredTenants = tenants.filter(
    (t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const avgRent = tenants.length > 0 ? tenants.reduce((s, t) => s + t.rentAmount, 0) / tenants.length : 0;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tenants</h2>
          <p className="text-text-secondary text-sm mt-1">Manage tenant information, contracts, and assignments</p>
        </div>
        <Button><UserPlus className="h-4 w-4 mr-1.5" />Register Tenant</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tenants", value: tenants.length, color: "from-primary-500 to-primary-600" },
          { label: "Active", value: activeCount, color: "from-green-500 to-green-600" },
          { label: "Inactive", value: tenants.length - activeCount, color: "from-gray-500 to-gray-600" },
          { label: "Avg. Rent", value: formatCurrency(avgRent), color: "from-accent-500 to-accent-600" },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
                <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold", stat.color)}>
                  {typeof stat.value === "number" ? stat.value : "₱"}
                </div>
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <Input placeholder="Search tenants by name, email, or property..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
      </div>

      <div className="space-y-3">
        {filteredTenants.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No tenants found</p>
            <p className="text-text-tertiary text-sm mt-1">{tenants.length === 0 ? "Register your first tenant to get started" : "Try a different search term"}</p>
          </div>
        ) : (
          filteredTenants.map((tenant, i) => (
            <motion.div key={tenant.id} variants={fadeInUp} custom={i}
              className="p-5 rounded-2xl border border-border bg-surface hover:shadow-card-hover transition-all duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar fallback={tenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0",
                      tenant.status === "active" ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>{tenant.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tenant.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tenant.phone}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{tenant.propertyName}</span>
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{tenant.unitNumber}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(tenant.rentAmount)}/mo</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
