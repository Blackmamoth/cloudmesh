"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

import { LinkedAccountsList } from "./linked-account-list";
import { LinkAccountModal } from "./link-account-modal";

export const LinkedAccountsPage = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">
              {" "}
              Manage Cloud Storage Accounts{" "}
            </h2>
            <p className="text-foreground-500 mt-1">
              Connect and manage your cloud storage providers in one place
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => setIsModalOpen(true)}
          >
            Link New Account
          </Button>
        </div>

        <LinkedAccountsList />

        <LinkAccountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </motion.div>
    </>
  );
};
