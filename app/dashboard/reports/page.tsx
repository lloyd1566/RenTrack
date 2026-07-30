"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Download, TrendingUp, DollarSign, Users, Home, Building2, FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getProperties, getUnits, getTenants, getPayments, Property, Unit, TenantRecord, Payment } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const monthlyData = [
  { month: "Jan", collected: 210000, pending: 45000, overdue: 12000 },
  { month: "Feb", collected: 225000, pending: 38000, overdue: 15000 },
  { month: "Mar", collected: 240000, pending: 42000, overdue: 10000 },
  { month: "Apr", collected: 235000, pending: 35000, overdue: 18000 },
  { month: "May", collected: 250000, pending: 40000, overdue: 14000 },
  { month: "Jun", collected: 260000, pending: 37000, overdue: 11000 },
  { month: "Jul", collected: 245000, pending: 44000, overdue: 16000 },
  { month: "Aug", collected: 255000, pending: 39000, overdue: 13000 },
  { month: "Sep", collected: 270000, pending: 35000, overdue: 9000 },
  { month: "Oct", collected: 265000, pending: 41000, overdue: 11000 },
  { month: "Nov", collected: 280000, pending: 36000, overdue: 8000 },
  { month: "Dec", collected: 300000, pending: 30000, overdue: 5000 },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("collections");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amountPaid, 0);
  const totalReceivables = payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.balance, 0);

  const propData = properties.map((p) => ({
    name: p.name.split(" ")[0],
    revenue: p.monthlyRevenue,
    units: p.units,
    occupied: p.occupiedUnits,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* 📊 Reports Hero — Analytics Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-8 sm:p-10 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-3 border border-white/10">
              <BarChart3 className="h-3 w-3" />
              Analytics Suite
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h2>
            <p className="text-white/60 text-sm mt-1.5">View insights and performance metrics for your rental portfolio</p>
          </div>
          <Button className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"><Download className="h-4 w-4 mr-1.5" />Download Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "from-green-500 to-green-600" },
          { label: "Receivables", value: formatCurrency(totalReceivables), icon: TrendingUp, color: "from-amber-500 to-amber-600" },
          { label: "Active Tenants", value: tenants.filter(t => t.status === "active").length, icon: Users, color: "from-primary-500 to-primary-600" },
          { label: "Occupied Units", value: units.filter(u => u.status === "occupied").length, icon: Home, color: "from-secondary-500 to-secondary-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
                <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
        </TabsList>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Collection Trends</CardTitle>
              <CardDescription>Monthly payment collection performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs text-text-tertiary" />
                    <YAxis className="text-xs text-text-tertiary" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }} />
                    <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
              <CardDescription>Revenue and occupancy by property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={propData.length ? propData : [{ name: "No data", revenue: 0, units: 0, occupied: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs text-text-tertiary" />
                    <YAxis className="text-xs text-text-tertiary" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }} />
                    <Bar dataKey="revenue" name="Monthly Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Overview</CardTitle>
                <CardDescription>Current tenant status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "Active", value: tenants.filter(t => t.status === "active").length },
                        { name: "Inactive", value: tenants.filter(t => t.status === "inactive").length },
                      ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        <Cell fill={COLORS[0]} />
                        <Cell fill={COLORS[3]} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {["Active", "Inactive"].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Total Properties", value: properties.length },
                    { label: "Total Units", value: units.length },
                    { label: "Total Tenants", value: tenants.length },
                    { label: "Occupancy Rate", value: `${Math.round((units.filter((u) => u.status === "occupied").length / (units.length || 1)) * 100)}%` },
                    { label: "Monthly Revenue", value: formatCurrency(units.filter(u => u.status === "occupied").reduce((s, u) => s + u.rentAmount, 0)) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
