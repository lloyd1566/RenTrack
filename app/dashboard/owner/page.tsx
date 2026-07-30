"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Home,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatCurrency, getTimeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  getProperties,
  getUnits,
  getPayments,
  getOccupancyRate,
  getTotalRevenue,
  getTotalReceivables,
  getTotalCollected,
  Property,
  Unit,
  Payment,
} from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const revenueData = [
  { month: "Jan", revenue: 240000, expenses: 180000 },
  { month: "Feb", revenue: 248000, expenses: 175000 },
  { month: "Mar", revenue: 256000, expenses: 190000 },
  { month: "Apr", revenue: 262000, expenses: 185000 },
  { month: "May", revenue: 258000, expenses: 195000 },
  { month: "Jun", revenue: 270000, expenses: 200000 },
  { month: "Jul", revenue: 275000, expenses: 210000 },
  { month: "Aug", revenue: 268000, expenses: 205000 },
  { month: "Sep", revenue: 285000, expenses: 215000 },
  { month: "Oct", revenue: 290000, expenses: 220000 },
  { month: "Nov", revenue: 295000, expenses: 225000 },
  { month: "Dec", revenue: 310000, expenses: 230000 },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    (async () => {
      const [props, unts, pays, t, r, c] = await Promise.all([
        getProperties(user),
        getUnits(user),
        getPayments(user),
        getTotalRevenue(),
        getTotalReceivables(),
        getTotalCollected(),
      ]);
      setProperties(props);
      setUnits(unts);
      setPayments(pays);
      setTotal(t);
      setReceivables(r);
      setCollected(c);
    })();
  }, [user]);

  const overduePayments = payments.filter((p) => p.status === "overdue");
  const propertiesCount = properties.length;
  const unitsCount = units.length;
  const occupiedCount = units.filter((u) => u.status === "occupied").length;

  const occupancyData = properties.map((p) => ({
    name: p.name.split(" ")[0],
    occupancy: getOccupancyRate(p.id),
    units: p.units,
    occupied: p.occupiedUnits,
  }));

  const paymentStatusData = [
    { name: "Paid", value: Math.round((collected / (total || 1)) * 100), color: "#10b981" },
    { name: "Pending", value: Math.round(((total - collected) / (total || 1)) * 50), color: "#f59e0b" },
    { name: "Overdue", value: Math.round((receivables / (total || 1)) * 50), color: "#ef4444" },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Owner Dashboard</h2>
          <p className="text-text-secondary text-sm mt-1">Overview of your rental portfolio and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Calendar className="h-4 w-4 mr-1.5" />This Year</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: propertiesCount, icon: Building2, change: properties.length + " registered", positive: true, gradient: "from-primary-500 to-primary-600" },
          { label: "Total Units", value: unitsCount, icon: Home, change: occupiedCount + " occupied", positive: true, gradient: "from-secondary-500 to-secondary-600" },
          { label: "Monthly Revenue", value: formatCurrency(total), icon: DollarSign, change: payments.filter(p => p.status === "paid").length + " payments this month", positive: true, gradient: "from-accent-500 to-accent-600" },
          { label: "Outstanding", value: formatCurrency(receivables), icon: AlertCircle, change: overduePayments.length + " overdue accounts", positive: false, gradient: "from-red-500 to-red-600" },
        ].map((stat, i) => (
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
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue vs expenses</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><TrendingUp className="h-3 w-3 mr-1" />Projection</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs text-text-tertiary" />
                    <YAxis className="text-xs text-text-tertiary" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Occupancy Overview</CardTitle>
                  <CardDescription>Property occupancy rates</CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  <Home className="h-3 w-3 mr-1" />{Math.round((occupiedCount / (unitsCount || 1)) * 100)}% Occupied
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData.length > 0 ? occupancyData : [{ name: "No data", occupancy: 0, units: 0, occupied: 0 }]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs text-text-tertiary" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" className="text-xs text-text-tertiary" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }} />
                    <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
                      {occupancyData.map((_: any, index: number) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Current payment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {paymentStatusData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {paymentStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-text-secondary">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest payment transactions</CardDescription>
                </div>
                <Button variant="ghost" size="sm">View All <ArrowUpRight className="h-3 w-3 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">No payment records yet</div>
                ) : (
                  payments.slice(0, 6).map((payment) => (
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
      </div>
    </motion.div>
  );
}
