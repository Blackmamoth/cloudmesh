"use client";

import React from "react";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AddProviderButton } from "@/components/linked-accounts/AddProviderButton";
import { LinkedAccountsGrid } from "@/components/linked-accounts/LinkedAccountGrid";

export default function LinkedAccounts() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 relative">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1600px] mx-auto"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold mb-2 md:mb-0"
              initial={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              Linked Accounts
            </motion.h1>

            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:block"
                initial={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <AddProviderButton variant="button" />
              </motion.div>
            </div>
          </div>

          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <LinkedAccountsGrid />
          </motion.div>
        </motion.div>

        <div className="md:hidden">
          <AddProviderButton variant="floating" />
        </div>
      </div>
    </DashboardLayout>
  );
}
