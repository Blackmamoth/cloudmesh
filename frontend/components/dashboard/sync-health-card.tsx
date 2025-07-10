import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";

// Mock data for sync health
const syncHealthData = [
  {
    provider: "Google Drive",
    icon: "logos:google-drive",
    successRate: 98,
    lastSync: "2023-07-15T14:30:00",
    status: "healthy",
    issues: [],
  },
  {
    provider: "Dropbox",
    icon: "logos:dropbox",
    successRate: 87,
    lastSync: "2023-07-14T09:45:00",
    status: "warning",
    issues: ["3 files failed to sync due to permission issues"],
  },
  {
    provider: "OneDrive",
    icon: "logos:microsoft-onedrive",
    successRate: 100,
    lastSync: "2023-07-15T08:30:00",
    status: "healthy",
    issues: [],
  },
];

export const SyncHealthCard = () => {
  // Format date
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

  // Calculate time since last sync
  const getTimeSinceLastSync = (dateString: string) => {
    const lastSync = new Date(dateString);
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  // Get success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "success";
    if (rate >= 80) return "warning";

    return "danger";
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Sync Health</h3>
            <Button
              color="primary"
              size="sm"
              startContent={<Icon icon="lucide:refresh-cw" />}
              variant="flat"
            >
              Sync All
            </Button>
          </div>

          <div className="space-y-6">
            {syncHealthData.map((provider) => (
              <div
                key={provider.provider}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-content2">
                    <Icon className="text-2xl" icon={provider.icon} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{provider.provider}</h4>
                      <Badge
                        color={getStatusColor(provider.status)}
                        size="sm"
                        variant="flat"
                      >
                        {provider.status === "healthy"
                          ? "Healthy"
                          : provider.status === "warning"
                            ? "Warning"
                            : "Error"}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-500">
                      Last synced {getTimeSinceLastSync(provider.lastSync)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Tooltip
                    content={
                      <div className="px-2 py-1">
                        <p className="text-xs">
                          Success rate over the last 7 days
                        </p>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Success Rate:</span>
                      <Badge
                        color={getSuccessRateColor(provider.successRate)}
                        variant="flat"
                      >
                        {provider.successRate}%
                      </Badge>
                    </div>
                  </Tooltip>

                  <Button
                    isIconOnly
                    size="sm"
                    startContent={<Icon icon="lucide:refresh-cw" />}
                    variant="flat"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Issues section */}
          <div className="mt-6">
            {syncHealthData.some((provider) => provider.issues.length > 0) ? (
              <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-xl">
                <div className="flex items-start gap-2">
                  <Icon
                    className="text-warning mt-0.5"
                    icon="lucide:alert-triangle"
                  />
                  <div>
                    <h4 className="font-medium text-sm">
                      Sync Issues Detected
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {syncHealthData.map((provider) =>
                        provider.issues.map((issue, index) => (
                          <li
                            key={`${provider.provider}-${index}`}
                            className="text-xs text-foreground-600"
                          >
                            <span className="font-medium">
                              {provider.provider}:
                            </span>{" "}
                            {issue}
                          </li>
                        )),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                  <Icon className="text-success" icon="lucide:check-circle" />
                  <p className="text-sm">
                    All syncs are healthy. No issues detected.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
