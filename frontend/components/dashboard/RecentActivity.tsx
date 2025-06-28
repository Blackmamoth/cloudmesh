import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Icon } from "@iconify/react";

interface ActivityItem {
  id: number;
  type: "upload" | "delete" | "share" | "edit";
  fileName: string;
  fileType: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  service: string;
  serviceIcon: string;
}

const activityData: ActivityItem[] = [
  {
    id: 1,
    type: "upload",
    fileName: "Q3 Financial Report.pdf",
    fileType: "pdf",
    user: {
      name: "You",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5",
    },
    timestamp: "Just now",
    service: "Google Drive",
    serviceIcon: "logos:google-drive",
  },
  {
    id: 2,
    type: "share",
    fileName: "Project Proposal.docx",
    fileType: "docx",
    user: {
      name: "You",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5",
    },
    timestamp: "2 hours ago",
    service: "OneDrive",
    serviceIcon: "logos:microsoft-onedrive",
  },
  {
    id: 3,
    type: "edit",
    fileName: "Marketing Strategy.pptx",
    fileType: "pptx",
    user: {
      name: "Alex Rodriguez",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3",
    },
    timestamp: "Yesterday",
    service: "Dropbox",
    serviceIcon: "logos:dropbox",
  },
  {
    id: 4,
    type: "delete",
    fileName: "Old Assets.zip",
    fileType: "zip",
    user: {
      name: "You",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5",
    },
    timestamp: "Yesterday",
    service: "Google Drive",
    serviceIcon: "logos:google-drive",
  },
  {
    id: 5,
    type: "upload",
    fileName: "Client Meeting Notes.md",
    fileType: "md",
    user: {
      name: "Sarah Johnson",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=1",
    },
    timestamp: "2 days ago",
    service: "Dropbox",
    serviceIcon: "logos:dropbox",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "upload":
      return {
        icon: "lucide:upload",
        color: "text-primary-500 bg-primary-500/10",
      };
    case "delete":
      return {
        icon: "lucide:trash-2",
        color: "text-danger-500 bg-danger-500/10",
      };
    case "share":
      return {
        icon: "lucide:share-2",
        color: "text-success-500 bg-success-500/10",
      };
    case "edit":
      return {
        icon: "lucide:edit-3",
        color: "text-warning-500 bg-warning-500/10",
      };
    default:
      return { icon: "lucide:file", color: "text-foreground bg-content3" };
  }
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
      return { icon: "lucide:file-text", color: "text-danger-500" };
    case "docx":
      return { icon: "lucide:file-text", color: "text-primary-500" };
    case "pptx":
      return { icon: "lucide:file-presentation", color: "text-warning-500" };
    case "xlsx":
      return { icon: "lucide:file-spreadsheet", color: "text-success-500" };
    case "zip":
      return { icon: "lucide:folder-archive", color: "text-foreground-600" };
    case "md":
      return { icon: "lucide:file-code", color: "text-secondary-500" };
    default:
      return { icon: "lucide:file", color: "text-foreground-600" };
  }
};

export const RecentActivity = () => {
  return (
    <Card className="border border-divider bg-content1/80 backdrop-blur-sm h-full">
      <CardBody className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-sm text-primary-500 font-medium">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {activityData.map((item) => {
            const activityIcon = getActivityIcon(item.type);
            const fileIcon = getFileIcon(item.fileType);

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${activityIcon.color}`}
                >
                  <Icon className="text-lg" icon={activityIcon.icon} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      className="flex-shrink-0"
                      size="sm"
                      src={item.user.avatar}
                    />
                    <span className="font-medium text-sm truncate">
                      {item.user.name}{" "}
                      {item.type === "upload"
                        ? "uploaded"
                        : item.type === "delete"
                          ? "deleted"
                          : item.type === "share"
                            ? "shared"
                            : "edited"}
                    </span>
                  </div>

                  <div className="flex items-center mt-1 ml-8">
                    <Icon
                      className={`mr-1.5 ${fileIcon.color}`}
                      icon={fileIcon.icon}
                    />
                    <span className="text-sm truncate">{item.fileName}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 ml-8">
                    <div className="flex items-center gap-1">
                      <Icon className="text-sm" icon={item.serviceIcon} />
                      <span className="text-xs text-foreground-500">
                        {item.service}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-500">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
