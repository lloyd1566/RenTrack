"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getProperties, getPayments, getNotifications, Property, Payment, Notification } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Bell, ChevronRight, FileText, RefreshCw } from "lucide-react";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [props, pays, notifs] = await Promise.all([
        getProperties(user),
        getPayments(user),
        user?.id ? getNotifications(user.id) : Promise.resolve([]),
      ]);
      setProperties(props.slice(0, 4));
      setPayments(pays.slice(0, 5));
      setNotifications(notifs.slice(0, 5));
    } catch { /* handled silently */ }
    setIsRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentPayments = payments.filter((p: Payment) => p.status === "paid" || p.status === "pending").slice(0, 4);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-4"
      >
        {/* Centered Welcome Header with Butuan City background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/images/favicon/Butuan City.webp')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 dark:from-slate-900/90 dark:to-slate-900/90" />

            <div className="text-center space-y-4 relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
              >
                Welcome, {user?.name?.split(" ")[0] || "Tenant"}!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-white/70 text-sm sm:text-base max-w-md mx-auto"
              >
                Here is an overview of your account
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex items-center justify-center gap-2"
              >
                <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm" onClick={loadData} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Link href="/dashboard/tenant/properties-page">
                  <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm">
                    Browse Properties
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Payments</h2>
                <Link href="/dashboard/tenant/payments" className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></Link>
              </div>
              {recentPayments.length === 0 ? (
                <div className="text-center py-6">
                  <DollarSign className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">No payments yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((payment: Payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{formatCurrency(payment.amountPaid)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(payment.paymentDate)} • {payment.paymentMethod}</p>
                      </div>
                      <Badge variant={payment.status === "paid" ? "success" : "warning"} className="capitalize text-[10px]">{payment.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Activity</h2>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">No notifications yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Activity updates will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif: Notification) => (
                    <div key={notif.id} className={`p-2.5 rounded-lg ${notif.read ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"}`}>
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{notif.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 shadow-xl">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Featured Properties</h2>
                <Link href="/dashboard/tenant/properties-page" className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></Link>
              </div>
              {properties.length === 0 ? (
                <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                  <Building2 className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">No properties available yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Check back soon for new listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {properties.map((property: Property) => (
                    <Link key={property.id} href="/dashboard/tenant/properties-page" className="block">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-slate-800 h-full flex flex-col">
                        <div className="h-24 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {property.imageUrl ? (
                            <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                          )}
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-xs truncate">{property.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{property.location}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">₱{Number(property.monthlyRevenue || 0).toLocaleString()}<span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">/mo</span></p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 shadow-xl">
            <CardContent className="p-4 h-full flex flex-col">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Your Reports</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Total Paid</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amountPaid, 0))}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Pending</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amountPaid, 0))}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Total Payments</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{payments.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Properties</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{properties.length}</p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Recent Transactions
                  </h4>
                </div>
                <div className="p-3">
                  {payments.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No payments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.slice(0, 10).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(payment.amountPaid)}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(payment.paymentDate)} • {payment.paymentMethod}</p>
                          </div>
                          <Badge variant={payment.status === "paid" ? "success" : "warning"} className="capitalize text-[10px]">{payment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </motion.div>
    </div>
  );
}
