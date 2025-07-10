import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Progress } from "@heroui/progress";

// Mock data for storage usage
const storageData = [
  {
    provider: "Google Drive",
    icon: "logos:google-drive",
    used: 3200, // MB
    total: 15360, // MB
    color: "bg-blue-500",
  },
  {
    provider: "Dropbox",
    icon: "logos:dropbox",
    used: 1843, // MB
    total: 2048, // MB
    color: "bg-indigo-500",
  },
  {
    provider: "OneDrive",
    icon: "logos:microsoft-onedrive",
    used: 512, // MB
    total: 5120, // MB
    color: "bg-cyan-500",
  },
];

export const StorageUsageCard = () => {
  // Format storage size
  const formatStorage = (size: number) => {
    if (size < 1024) {
      return `${size} MB`;
    } else {
      return `${(size / 1024).toFixed(1)} GB`;
    }
  };

  // Calculate percentage
  const calculatePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  // Get color based on usage percentage
  const getUsageColor = (percentage: number) => {
    if (percentage > 90) {
      return "danger";
    } else if (percentage > 75) {
      return "warning";
    } else {
      return "success";
    }
  };

  // Calculate total storage
  const totalUsed = storageData.reduce(
    (acc, provider) => acc + provider.used,
    0,
  );
  const totalAvailable = storageData.reduce(
    (acc, provider) => acc + provider.total,
    0,
  );
  const totalPercentage = calculatePercentage(totalUsed, totalAvailable);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Storage Usage</h3>
            <Badge color={getUsageColor(totalPercentage)} variant="flat">
              {totalPercentage}% Used
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Mini pie charts */}
            <div className="flex justify-between gap-4">
              {storageData.map((provider, index) => {
                const percentage = calculatePercentage(
                  provider.used,
                  provider.total,
                );

                return (
                  <Tooltip
                    key={provider.provider}
                    content={
                      <div className="px-2 py-1">
                        <p className="font-medium">{provider.provider}</p>
                        <p className="text-xs">
                          {formatStorage(provider.used)} of{" "}
                          {formatStorage(provider.total)} used
                        </p>
                        <p className="text-xs">{percentage}% full</p>
                      </div>
                    }
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle
                            className="stroke-default-200 dark:stroke-default-700"
                            cx="18"
                            cy="18"
                            fill="none"
                            r="16"
                            strokeWidth="3"
                          />
                          <circle
                            className={`stroke-current text-${getUsageColor(percentage)}`}
                            cx="18"
                            cy="18"
                            fill="none"
                            r="16"
                            strokeDasharray="100"
                            strokeDashoffset={100 - percentage}
                            strokeWidth="3"
                            transform="rotate(-90 18 18)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon className="text-xl" icon={provider.icon} />
                        </div>
                      </div>
                      <p className="text-xs font-medium mt-2">{percentage}%</p>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {/* Total usage */}
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Total Storage</span>
                <span className="text-sm">
                  {formatStorage(totalUsed)} of {formatStorage(totalAvailable)}
                </span>
              </div>
              <Progress
                aria-label="Total storage usage"
                className="h-2"
                color={getUsageColor(totalPercentage)}
                value={totalPercentage}
              />
              <div className="flex justify-between mt-4 text-xs text-foreground-500">
                <span>0</span>
                <span>{formatStorage(totalAvailable)}</span>
              </div>
            </div>
          </div>

          {/* Provider breakdown */}
          <div className="space-y-4">
            {storageData.map((provider) => {
              const percentage = calculatePercentage(
                provider.used,
                provider.total,
              );

              return (
                <div key={provider.provider}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon icon={provider.icon} />
                      <span className="text-sm">{provider.provider}</span>
                    </div>
                    <span className="text-xs text-foreground-500">
                      {formatStorage(provider.used)} /{" "}
                      {formatStorage(provider.total)}
                    </span>
                  </div>
                  <Progress
                    aria-label={`${provider.provider} storage usage`}
                    className="h-1.5"
                    color={getUsageColor(percentage)}
                    size="sm"
                    value={percentage}
                  />
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
