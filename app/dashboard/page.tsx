"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Building2, Users, CreditCard, TrendingUp, Home, AlertCircle,
  ArrowUpRight, ArrowDownRight, Calendar, Download, LayoutDashboard,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency, getTimeAgo } from "@/lib/utils";
import {
  getProperties, getPayments,
  getPaymentTrends,
  getTenants,
  Property, Payment, MonthlyTrend, TenantRecord,
  getDashboardData,
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fadeInUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function DashboardOverview() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receivables, setReceivables] = useState(0);
  const [collected, setCollected] = useState(0);
  const [propsCount, setPropsCount] = useState(0);
  const [unitsCount, setUnitsCount] = useState(0);
  const [tenantsCount, setTenantsCount] = useState(0);
  const [occupiedCount, setOccupiedCount] = useState(0);
  const [vacantCount, setVacantCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrend[]>([]);
  const [tenantsList, setTenantsList] = useState<TenantRecord[]>([]);

  useEffect(() => {
    if (!isLoading && user?.role === "tenant") {
      router.push("/dashboard/tenant");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardData(user);
        setProperties(data.properties);
        setPayments(data.payments);
        setMonthlyData(data.trends);
        setTenantsList(data.tenants);
        setPropsCount(data.propertiesCount);
        setUnitsCount(data.unitsCount);
        setTenantsCount(data.tenantsCount);
        setOccupiedCount(data.occupiedUnitsCount);
        setVacantCount(data.vacantUnitsCount);
        setReceivables(data.totalReceivables);
        setCollected(data.totalCollected);
      } catch (err) {
        console.error("Dashboard overview load error:", err);
      }
    })();
  }, [user]);

  const overdueCount = payments.filter(p => p.status === "overdue").length;

  const statCards = [
    { label: "Properties", value: propsCount, icon: Building2, change: `${properties.length} registered`, positive: true, gradient: "from-primary-500 to-primary-600" },
    { label: "Total Units", value: unitsCount, icon: Home, change: `${occupiedCount} occupied`, positive: true, gradient: "from-secondary-500 to-secondary-600" },
    { label: "Tenants", value: tenantsCount, icon: Users, change: `${occupiedCount} active`, positive: true, gradient: "from-accent-500 to-accent-600" },
    { label: "Overdue", value: overdueCount, icon: AlertCircle, change: `${formatCurrency(receivables)} outstanding`, positive: false, gradient: "from-red-500 to-red-600" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6">
      {/* Dashboard Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-3 border border-white/10">
              <LayoutDashboard className="h-3 w-3" />
              {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Overview` : "Dashboard"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Welcome, {user?.name?.split(" ")[0] || "User"} 👋
            </h2>
            <p className="text-white/60 text-sm mt-1.5">Real-time overview of your rental portfolio performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm">
              <Calendar className="h-4 w-4 mr-1.5" />This Month
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
              <Download className="h-4 w-4 mr-1.5" />Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={fadeInUp}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-text-secondary">{stat.label}</span>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", stat.gradient)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.positive ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                    <span className={stat.positive ? "text-green-500" : "text-red-500"}>{stat.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />Collection Trends</CardTitle>
                  <CardDescription>Monthly payment collections overview</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  {formatCurrency(collected)} collected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {monthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-secondary text-sm">No payment data available yet</div>
                ) : (
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
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Home className="h-4 w-4 text-indigo-500" />Occupancy Overview</CardTitle>
                  <CardDescription>Current occupancy status across all units</CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  {Math.round((occupiedCount / (unitsCount || 1)) * 100)}% Occupied
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex justify-center gap-8">
                    <div>
                      <div className="text-4xl font-bold text-emerald-500">{occupiedCount}</div>
                      <p className="text-sm text-text-secondary mt-1">Occupied</p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-amber-500">{vacantCount}</div>
                      <p className="text-sm text-text-secondary mt-1">Vacant</p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary-500">{unitsCount}</div>
                      <p className="text-sm text-text-secondary mt-1">Total Units</p>
                    </div>
                  </div>
                  <div className="mt-6 w-full max-w-md mx-auto h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((occupiedCount / (unitsCount || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    {Math.round((occupiedCount / (unitsCount || 1)) * 100)}% occupancy rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Payments */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-500" />Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions across all properties</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View All <ArrowUpRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">No payment records yet</div>
              ) : (
                payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={payment.tenantName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{payment.tenantName}</p>
                        <p className="text-xs text-text-secondary">{payment.propertyName} &bull; {getTimeAgo(payment.paymentDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(payment.amountPaid)}</p>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-medium px-1.5 py-0 mt-0.5",
                        payment.status === "paid" && "bg-green-50 text-green-600 border-green-200",
                        payment.status === "pending" && "bg-amber-50 text-amber-600 border-amber-200",
                        payment.status === "overdue" && "bg-red-50 text-red-600 border-red-200",
                        payment.status === "partial" && "bg-blue-50 text-blue-600 border-blue-200",
                      )}>{payment.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Registered Tenants */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />Registered Tenants</CardTitle>
                <CardDescription>Tenants currently using the platform</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                {tenantsList.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tenantsList.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">No tenants registered yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Phone</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Property / Unit</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantsList.slice(0, 10).map((tenant) => (
                      <tr key={tenant.id} className="border-b border-border/50 hover:bg-surface-secondary transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar fallback={tenant.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)} size="sm" />
                            <span className="font-medium text-foreground">{tenant.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{tenant.email}</td>
                        <td className="py-3 px-4 text-text-secondary">{tenant.phone}</td>
                        <td className="py-3 px-4">
                          <div className="text-foreground">{tenant.propertyName}</div>
                          <div className="text-xs text-text-tertiary">Unit {tenant.unitNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-medium px-1.5 py-0 capitalize",
                            tenant.status === "active" && "bg-green-50 text-green-600 border-green-200",
                            tenant.status === "inactive" && "bg-gray-50 text-gray-600 border-gray-200",
                          )}>{tenant.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-text-secondary text-xs">
                          {new Date(tenant.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
