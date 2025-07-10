import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";

// Mock data for smart actions
const smartActions = [
  {
    id: "sync-now",
    name: "Sync Now",
    description: "Manually trigger a sync across all providers",
    icon: "lucide:refresh-cw",
    color: "text-primary bg-primary-50 dark:bg-primary-900/20",
    action: "/dashboard?sync=true",
  },
  {
    id: "connect-provider",
    name: "Connect Another Provider",
    description: "Add a new cloud storage provider",
    icon: "lucide:plus-circle",
    color: "text-success bg-success-50 dark:bg-success-900/20",
    action: "/accounts",
  },
  {
    id: "deduplicate",
    name: "Deduplicate Files",
    description: "Find and manage duplicate files across providers",
    icon: "lucide:copy",
    color: "text-warning bg-warning-50 dark:bg-warning-900/20",
    action: "/files?deduplicate=true",
  },
  {
    id: "optimize-storage",
    name: "Optimize Storage",
    description: "Find large files and free up space",
    icon: "lucide:hard-drive",
    color: "text-secondary bg-secondary-50 dark:bg-secondary-900/20",
    action: "/files?optimize=true",
  },
];

export const SmartActionsCard = () => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Smart Actions</h3>
            <p className="text-sm text-foreground-500 mt-1">
              Quick actions to manage your cloud storage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {smartActions.map((action) => (
              <Button
                key={action.id}
                as={Link}
                className="h-auto py-4 px-4 justify-start flex-col items-start"
                href={action.action}
                variant="flat"
              >
                <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                  <Icon className="text-xl" icon={action.icon} />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.name}</p>
                  <p className="text-xs text-foreground-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
