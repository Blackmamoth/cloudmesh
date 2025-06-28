import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";

interface ActionItem {
  icon: string;
  label: string;
  color: string;
}

const actions: ActionItem[] = [
  {
    icon: "lucide:upload",
    label: "Upload File",
    color: "bg-primary-500/10 text-primary-500",
  },
  {
    icon: "lucide:folder-plus",
    label: "New Folder",
    color: "bg-success-500/10 text-success-500",
  },
  {
    icon: "lucide:link",
    label: "Link Account",
    color: "bg-secondary-500/10 text-secondary-500",
  },
  {
    icon: "lucide:share-2",
    label: "Share Files",
    color: "bg-warning-500/10 text-warning-500",
  },
];

export const QuickActions = () => {
  return (
    <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
      <CardBody className="p-5">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-content2/50 hover:bg-content2 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center mb-2 ${action.color}`}
              >
                <Icon className="text-xl" icon={action.icon} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary-500/5 border border-primary-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary-500/10">
              <Icon className="text-primary-500" icon="lucide:zap" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Upgrade to Pro</h3>
              <p className="text-xs text-foreground-600 mb-2">
                Get 100GB storage, priority support, and advanced features.
              </p>
              <button className="text-xs font-medium text-primary-500">
                View Plans →
              </button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
