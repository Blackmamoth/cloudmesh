import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { Badge } from "@heroui/badge";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";

import { DisconnectModal } from "./DisconnectModal";

interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  lastSync: string;
  usedStorage: number;
  totalStorage: number;
  email?: string;
}

const cloudProviders: CloudProvider[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    icon: "logos:google-drive",
    status: "connected",
    lastSync: "5 minutes ago",
    usedStorage: 5.2,
    totalStorage: 15,
    email: "alex@example.com",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "logos:dropbox",
    status: "syncing",
    lastSync: "Syncing...",
    usedStorage: 3.8,
    totalStorage: 5,
    email: "alex@example.com",
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    icon: "logos:microsoft-onedrive",
    status: "connected",
    lastSync: "3 hours ago",
    usedStorage: 2.1,
    totalStorage: 5,
    email: "alex.work@example.com",
  },
  {
    id: "box",
    name: "Box",
    icon: "logos:box",
    status: "error",
    lastSync: "Failed to sync",
    usedStorage: 0.5,
    totalStorage: 10,
    email: "alex@example.com",
  },
  {
    id: "icloud",
    name: "Apple iCloud",
    icon: "logos:apple",
    status: "disconnected",
    lastSync: "Never",
    usedStorage: 0,
    totalStorage: 5,
  },
  {
    id: "mega",
    name: "Mega",
    icon: "logos:mega",
    status: "disconnected",
    lastSync: "Never",
    usedStorage: 0,
    totalStorage: 20,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "connected":
      return "success";
    case "syncing":
      return "primary";
    case "error":
      return "danger";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "connected":
      return "lucide:check-circle";
    case "syncing":
      return "lucide:refresh-cw";
    case "error":
      return "lucide:alert-circle";
    default:
      return "lucide:x-circle";
  }
};

export const LinkedAccountsGrid = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] =
    React.useState<CloudProvider | null>(null);

  const handleDisconnect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const confirmDisconnect = () => {
    setIsModalOpen(false);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className="relative">
        {/* Glassmorphism background effect */}
        <div className="absolute inset-0 bg-content1/30 backdrop-blur-md rounded-xl -z-10" />

        <motion.div
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
          initial="hidden"
          variants={container}
        >
          {cloudProviders.map((provider) => (
            <motion.div key={provider.id} variants={item}>
              <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-md bg-content2/70">
                        <Icon className="text-2xl" icon={provider.icon} />
                      </div>
                      <div>
                        <h3 className="font-medium text-base">
                          {provider.name}
                        </h3>
                        {provider.email && (
                          <p className="text-xs text-foreground-500">
                            {provider.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      color={getStatusColor(provider.status)}
                      startContent={
                        provider.status === "syncing" ? (
                          <Icon
                            className="text-sm animate-spin"
                            icon={getStatusIcon(provider.status)}
                          />
                        ) : (
                          <Icon
                            className="text-sm"
                            icon={getStatusIcon(provider.status)}
                          />
                        )
                      }
                      variant="flat"
                    >
                      {provider.status.charAt(0).toUpperCase() +
                        provider.status.slice(1)}
                    </Badge>
                  </div>

                  {provider.status !== "disconnected" && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground-500">
                          Storage
                        </span>
                        <span className="text-xs font-medium">
                          {provider.usedStorage} GB / {provider.totalStorage} GB
                        </span>
                      </div>
                      <Progress
                        className="h-1"
                        color={
                          provider.usedStorage / provider.totalStorage > 0.9
                            ? "danger"
                            : provider.usedStorage / provider.totalStorage > 0.7
                              ? "warning"
                              : "primary"
                        }
                        size="sm"
                        value={
                          (provider.usedStorage / provider.totalStorage) * 100
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className="text-xs text-foreground-500"
                        icon="lucide:clock"
                      />
                      <span className="text-xs text-foreground-500">
                        {provider.status === "disconnected"
                          ? "Not connected"
                          : `Last sync: ${provider.lastSync}`}
                      </span>
                    </div>

                    {provider.status === "disconnected" ? (
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<Icon icon="lucide:link" />}
                        variant="flat"
                      >
                        Connect
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        {provider.status === "error" && (
                          <Tooltip content="Retry connection">
                            <Button
                              isIconOnly
                              color="primary"
                              size="sm"
                              variant="flat"
                            >
                              <Icon icon="lucide:refresh-cw" />
                            </Button>
                          </Tooltip>
                        )}

                        {provider.status !== "syncing" && (
                          <Tooltip content="Sync now">
                            <Button
                              isIconOnly
                              color="default"
                              size="sm"
                              variant="flat"
                            >
                              <Icon icon="lucide:refresh-cw" />
                            </Button>
                          </Tooltip>
                        )}

                        <Button
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleDisconnect(provider)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <DisconnectModal
        isOpen={isModalOpen}
        provider={selectedProvider}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDisconnect}
      />
    </>
  );
};
