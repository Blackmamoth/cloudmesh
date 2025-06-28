"use client";

import React from "react";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LinkedServices } from "@/components/dashboard/LinkedServices";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StorageOverview } from "@/components/dashboard/StorageOverview";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          Dashboard
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <StorageOverview />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <QuickActions />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <RecentActivity />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <LinkedServices />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
