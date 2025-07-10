"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";

import { StorageUsageCard } from "./storage-usage-card";
import { SyncHealthCard } from "./sync-health-card";
import { RecentFilesCard } from "./recent-files-card";
import { SmartActionsCard } from "./smart-actions";
import { NaturalLanguageSearch } from "./natural-language-search";

// Mock data for the dashboard
const mockData = {
  hasLinkedAccounts: true, // Set to false to see empty state
  accounts: {
    google: 2,
    dropbox: 1,
  },
  files: 1243,
  lastSync: "2023-07-15T14:30:00",
  syncStatus: "idle", // idle, syncing, failed
  activities: [
    {
      id: 1,
      action: "Synced 10 files from Dropbox",
      timestamp: "2023-07-15T14:30:00",
      status: "success",
    },
    {
      id: 2,
      action: "Updated file index for Google Drive",
      timestamp: "2023-07-15T14:25:00",
      status: "success",
    },
    {
      id: 3,
      action: "Failed to sync 2 files from Google Drive",
      timestamp: "2023-07-15T14:20:00",
      status: "error",
      error: "Permission denied",
    },
    {
      id: 4,
      action: "Added new Google Drive account",
      timestamp: "2023-07-15T13:45:00",
      status: "success",
    },
  ],
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

export default function DashboardPage() {
  return (
    <>
      {!mockData.hasLinkedAccounts ? (
        <EmptyState />
      ) : (
        <LinkedAccountsView data={mockData} />
      )}
    </>
  );
}

const EmptyState = () => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-primary-100/30 dark:bg-primary-900/20 p-6 rounded-full mb-6">
        <Icon className="text-primary text-5xl" icon="lucide:cloud-off" />
      </div>

      <h2 className="text-2xl font-bold mb-3">No cloud accounts linked yet</h2>
      <p className="text-foreground-600 mb-8">
        Connect your cloud storage accounts to start managing all your files in
        one place.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md">
        <Button
          className="flex-1"
          color="primary"
          startContent={<Icon icon="logos:google-drive" />}
        >
          Link Google Drive
        </Button>
        <Button
          className="flex-1"
          color="primary"
          startContent={<Icon icon="logos:dropbox" />}
        >
          Link Dropbox
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-foreground-500">
        <Icon icon="lucide:shield" />
        <p>{"We don't store your files. Linking is safe and secure."}</p>
      </div>
    </motion.div>
  );
};

const LinkedAccountsView = ({ data }: { data: typeof mockData }) => {
  return (
    <div className="space-y-8">
      <UnifiedStatsCard data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StorageUsageCard />
          <SyncHealthCard />
        </div>
        <div className="space-y-6">
          <RecentFilesCard />
          <SmartActionsCard />
        </div>
      </div>

      <NaturalLanguageSearch />
    </div>
  );
};

const UnifiedStatsCard = ({ data }: { data: typeof mockData }) => {
  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "syncing":
        return "primary";
      case "failed":
        return "danger";
      default:
        return "success";
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case "syncing":
        return "Syncing...";
      case "failed":
        return "Sync Failed";
      default:
        return "Idle";
    }
  };

  // Calculate time since last sync
  const getTimeSinceLastSync = () => {
    const lastSync = new Date(data.lastSync);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);

      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);

        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      }
    }
  };

  // Calculate sync success rate (mock data)
  const syncSuccessRate = 94;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Linked Accounts */}
            <div className="flex items-start gap-4">
              <div className="bg-primary-100/30 dark:bg-primary-900/20 p-3 rounded-xl">
                <Icon className="text-primary text-2xl" icon="lucide:cloud" />
              </div>
              <div>
                <p className="text-foreground-600 text-sm">Linked Accounts</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-semibold">
                    {data.accounts.google + data.accounts.dropbox}
                  </span>
                  <div className="flex">
                    {data.accounts.google > 0 && (
                      <Avatar
                        className="bg-white dark:bg-white mr-1"
                        icon={<Icon icon="logos:google-drive" />}
                        size="sm"
                      />
                    )}

                    {data.accounts.dropbox > 0 && (
                      <Avatar
                        className="bg-white dark:bg-white mr-1"
                        icon={<Icon icon="logos:dropbox" />}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Files Indexed */}
            <div className="flex items-start gap-4">
              <div className="bg-primary-100/30 dark:bg-primary-900/20 p-3 rounded-xl">
                <Icon className="text-primary text-2xl" icon="lucide:file" />
              </div>
              <div>
                <p className="text-foreground-600 text-sm">Files Indexed</p>
                <p className="text-xl font-semibold mt-1">
                  {data.files.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Last Synced */}
            <div className="flex items-start gap-4">
              <div className="bg-primary-100/30 dark:bg-primary-900/20 p-3 rounded-xl">
                <Icon className="text-primary text-2xl" icon="lucide:clock" />
              </div>
              <div>
                <p className="text-foreground-600 text-sm">Last Synced</p>
                <p className="text-xl font-semibold mt-1">
                  {formatDate(data.lastSync)}
                </p>
              </div>
            </div>

            {/* Sync Success Rate */}
            <div className="flex items-start gap-4">
              <div className="bg-primary-100/30 dark:bg-primary-900/20 p-3 rounded-xl">
                <Icon
                  className="text-primary text-2xl"
                  icon="lucide:check-circle"
                />
              </div>
              <div>
                <p className="text-foreground-600 text-sm">Sync Success Rate</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-semibold">
                    {syncSuccessRate}%
                  </span>
                  <Badge
                    color={
                      syncSuccessRate > 90
                        ? "success"
                        : syncSuccessRate > 75
                          ? "warning"
                          : "danger"
                    }
                    size="sm"
                    variant="flat"
                  >
                    Past 7 days
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

const ActivityFeed = ({
  activities,
}: {
  activities: typeof mockData.activities;
}) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card">
        <CardBody className="p-4 sm:p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Updated activity status icons with filled colored circles */}
                  <div
                    className={`mt-1 p-2 rounded-full ${
                      activity.status === "error"
                        ? "bg-danger"
                        : activity.status === "warning"
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                  >
                    <Icon
                      className="text-lg text-white"
                      icon={
                        activity.status === "error"
                          ? "lucide:x"
                          : activity.status === "warning"
                            ? "lucide:alert-triangle"
                            : "lucide:check"
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="font-medium">{activity.action}</p>
                      <span className="text-sm text-foreground-500">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    {activity.status === "error" && activity.error && (
                      <p className="text-sm text-danger mt-1">
                        {activity.error}
                      </p>
                    )}
                  </div>
                </div>
                {index < activities.length - 1 && <Divider className="my-4" />}
              </React.Fragment>
            ))}
          </div>

          {/* Updated "View All Activity" button with more prominence */}
          <div className="mt-6 text-center">
            <Button
              className="font-medium"
              color="primary"
              endContent={
                <Icon className="font-bold" icon="lucide:arrow-right" />
              }
              size="md"
              variant="flat"
            >
              View All Activity
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
