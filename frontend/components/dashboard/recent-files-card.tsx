import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { getFileIcon } from "@/lib/utils";
// Mock data for recent files
const recentFiles = [
  {
    id: "file1",
    name: "Q2 Financial Report.pdf",
    type: "pdf",
    provider: "Google Drive",
    providerIcon: "logos:google-drive",
    modifiedAt: "2023-07-15T14:30:00",
    owner: {
      name: "John Doe",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user1",
    },
  },
  {
    id: "file2",
    name: "Marketing Strategy 2023.docx",
    type: "document",
    provider: "Dropbox",
    providerIcon: "logos:dropbox",
    modifiedAt: "2023-07-15T12:15:00",
    owner: {
      name: "Jane Smith",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user2",
    },
  },
  {
    id: "file3",
    name: "Product Roadmap.xlsx",
    type: "spreadsheet",
    provider: "Google Drive",
    providerIcon: "logos:google-drive",
    modifiedAt: "2023-07-14T09:45:00",
    owner: {
      name: "Alex Johnson",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user3",
    },
  },
  {
    id: "file4",
    name: "Team Photo.jpg",
    type: "image",
    provider: "OneDrive",
    providerIcon: "logos:microsoft-onedrive",
    modifiedAt: "2023-07-13T16:20:00",
    owner: {
      name: "Sarah Williams",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user4",
    },
  },
  {
    id: "file5",
    name: "Client Presentation.pptx",
    type: "presentation",
    provider: "Dropbox",
    providerIcon: "logos:dropbox",
    modifiedAt: "2023-07-12T11:10:00",
    owner: {
      name: "Mike Brown",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user5",
    },
  },
];

export const RecentFilesCard = () => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Recent Files</h3>
            <Button
              as={Link}
              color="primary"
              endContent={<Icon icon="lucide:arrow-right" />}
              href="/files"
              size="sm"
              variant="flat"
            >
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentFiles.map((file) => (
              <Link
                key={file.id}
                className="block"
                color="foreground"
                href={`/files?file=${file.id}`}
              >
                <div className="flex items-center justify-between p-3 hover:bg-content2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-primary-50 dark:bg-primary-900/20">
                      <Icon
                        className="text-primary text-xl"
                        icon={getFileIcon(file.type)}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip
                          className="h-5 px-1"
                          size="sm"
                          startContent={
                            <Icon
                              className="text-xs"
                              icon={file.providerIcon}
                            />
                          }
                          variant="flat"
                        >
                          {file.provider}
                        </Chip>
                        <span className="text-xs text-foreground-500">
                          {formatDate(file.modifiedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Icon
                    className="text-foreground-400"
                    icon="lucide:chevron-right"
                  />
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};
