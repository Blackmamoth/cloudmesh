import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { Progress } from "@heroui/progress";
import { Icon } from "@iconify/react";

interface StorageData {
  service: string;
  icon: string;
  color: string;
  used: number;
  total: number;
}

const storageData: StorageData[] = [
  {
    service: "Google Drive",
    icon: "logos:google-drive",
    color: "bg-blue-500",
    used: 5.2,
    total: 15,
  },
  {
    service: "Dropbox",
    icon: "logos:dropbox",
    color: "bg-blue-600",
    used: 3.8,
    total: 5,
  },
  {
    service: "OneDrive",
    icon: "logos:microsoft-onedrive",
    color: "bg-blue-400",
    used: 2.1,
    total: 5,
  },
];

export const StorageOverview = () => {
  const totalUsed = storageData.reduce((sum, item) => sum + item.used, 0);
  const totalStorage = storageData.reduce((sum, item) => sum + item.total, 0);
  const percentUsed = Math.round((totalUsed / totalStorage) * 100);

  return (
    <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
      <CardBody className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Storage Overview</h2>
          <Tooltip content="View storage details">
            <Button isIconOnly size="sm" variant="light">
              <Icon className="text-lg" icon="lucide:more-horizontal" />
            </Button>
          </Tooltip>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground-600 text-sm">
                Total Storage Used
              </span>
              <span className="font-semibold">
                {totalUsed.toFixed(1)} GB / {totalStorage} GB
              </span>
            </div>
            <Progress
              aria-label="Storage usage"
              className="h-2"
              color={
                percentUsed > 80
                  ? "danger"
                  : percentUsed > 60
                    ? "warning"
                    : "primary"
              }
              value={percentUsed}
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-foreground-500">
                {percentUsed}% used
              </span>
              <span className="text-xs text-foreground-500">
                {(totalStorage - totalUsed).toFixed(1)} GB free
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-content3"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary-500"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * percentUsed) / 100}
                  strokeWidth="8"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-semibold text-lg">{percentUsed}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {storageData.map((item) => (
            <div key={item.service} className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-content2">
                <Icon className="text-xl" icon={item.icon} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{item.service}</span>
                  <span className="text-sm">
                    {item.used} GB / {item.total} GB
                  </span>
                </div>
                <Progress
                  aria-label={`${item.service} storage usage`}
                  className="h-1.5"
                  color="primary"
                  size="sm"
                  value={(item.used / item.total) * 100}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

// Add Button component since it's used in the code but not imported
const Button = ({
  children,
  variant = "solid",
  isIconOnly,
  size = "md",
  className = "",
  ...props
}) => {
  const variantClasses = {
    solid: "bg-primary-500 text-white",
    light: "bg-transparent hover:bg-content2/70",
    flat: "bg-primary-500/20 text-primary-500",
  };

  const sizeClasses = {
    sm: "p-1",
    md: "p-2",
  };

  return (
    <button
      className={`rounded-md ${variantClasses[variant]} ${sizeClasses[size]} ${isIconOnly ? "aspect-square" : "px-3"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
