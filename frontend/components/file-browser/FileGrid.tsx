import React from "react";
import { Checkbox } from "@heroui/checkbox";
import { Card, CardBody } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  fileType?: string;
  size?: string;
  modified: string;
  service: string;
  serviceIcon: string;
}

const files: FileItem[] = [
  {
    id: "folder-1",
    name: "Project Assets",
    type: "folder",
    modified: "Modified 2 days ago",
    service: "Google Drive",
    serviceIcon: "logos:google-drive",
  },
  {
    id: "folder-2",
    name: "Client Presentations",
    type: "folder",
    modified: "Modified yesterday",
    service: "Dropbox",
    serviceIcon: "logos:dropbox",
  },
  {
    id: "folder-3",
    name: "Design Files",
    type: "folder",
    modified: "Modified 5 days ago",
    service: "OneDrive",
    serviceIcon: "logos:microsoft-onedrive",
  },
  {
    id: "file-1",
    name: "Q3 Financial Report.pdf",
    type: "file",
    fileType: "pdf",
    size: "2.4 MB",
    modified: "Modified 3 hours ago",
    service: "Google Drive",
    serviceIcon: "logos:google-drive",
  },
  {
    id: "file-2",
    name: "Product Mockup.psd",
    type: "file",
    fileType: "psd",
    size: "34.2 MB",
    modified: "Modified yesterday",
    service: "Dropbox",
    serviceIcon: "logos:dropbox",
  },
  {
    id: "file-3",
    name: "Meeting Notes.docx",
    type: "file",
    fileType: "docx",
    size: "342 KB",
    modified: "Modified 2 days ago",
    service: "OneDrive",
    serviceIcon: "logos:microsoft-onedrive",
  },
  {
    id: "file-4",
    name: "Project Timeline.xlsx",
    type: "file",
    fileType: "xlsx",
    size: "1.2 MB",
    modified: "Modified 4 days ago",
    service: "Google Drive",
    serviceIcon: "logos:google-drive",
  },
  {
    id: "file-5",
    name: "Logo Design.ai",
    type: "file",
    fileType: "ai",
    size: "5.7 MB",
    modified: "Modified 1 week ago",
    service: "Dropbox",
    serviceIcon: "logos:dropbox",
  },
  {
    id: "file-6",
    name: "Client Feedback.mp4",
    type: "file",
    fileType: "mp4",
    size: "128.5 MB",
    modified: "Modified 2 weeks ago",
    service: "OneDrive",
    serviceIcon: "logos:microsoft-onedrive",
  },
];

const getFileIcon = (fileType?: string) => {
  if (!fileType) return "lucide:folder";

  switch (fileType) {
    case "pdf":
      return "lucide:file-text";
    case "docx":
      return "lucide:file-text";
    case "xlsx":
      return "lucide:file-spreadsheet";
    case "psd":
    case "ai":
      return "lucide:file-image";
    case "mp4":
    case "mov":
      return "lucide:file-video";
    case "mp3":
    case "wav":
      return "lucide:file-audio";
    case "zip":
    case "rar":
      return "lucide:file-archive";
    default:
      return "lucide:file";
  }
};

const getFileColor = (fileType?: string) => {
  if (!fileType) return "text-primary-500";

  switch (fileType) {
    case "pdf":
      return "text-danger-500";
    case "docx":
      return "text-primary-500";
    case "xlsx":
      return "text-success-500";
    case "psd":
    case "ai":
      return "text-secondary-500";
    case "mp4":
    case "mov":
      return "text-warning-500";
    case "mp3":
    case "wav":
      return "text-pink-500";
    case "zip":
    case "rar":
      return "text-foreground-600";
    default:
      return "text-foreground-600";
  }
};

interface FileGridProps {
  selectedFiles: string[];
  onFileSelect: (fileId: string, isMultiSelect: boolean) => void;
  onContextMenu: (e: React.MouseEvent, fileId: string) => void;
  onSelectAll: (files: FileItem[]) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  selectedFiles,
  onFileSelect,
  onContextMenu,
}) => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Get view mode from URL or localStorage
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");

    if (view === "list" || view === "grid") {
      setViewMode(view);
    } else {
      const savedView = localStorage.getItem("cloudmesh-view-mode");

      if (savedView === "list" || savedView === "grid") {
        setViewMode(savedView);
      }
    }
  }, []);

  // Save view mode to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem("cloudmesh-view-mode", viewMode);

    // Update URL without page reload
    const url = new URL(window.location.href);

    url.searchParams.set("view", viewMode);
    window.history.replaceState({}, "", url);
  }, [viewMode]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  // Grid View
  const renderGridView = () => (
    <motion.div
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
      initial="hidden"
      variants={container}
    >
      {files.map((file) => (
        <motion.div key={file.id} layoutId={file.id} variants={item}>
          <Card
            isHoverable
            isPressable
            className={`border border-divider transition-all duration-200 ${
              selectedFiles.includes(file.id)
                ? "bg-primary-500/10 border-primary-500/50"
                : "bg-content1/80 hover:bg-content1"
            }`}
            onContextMenu={(e) => onContextMenu(e, file.id)}
            onPress={(e) =>
              onFileSelect(file.id, e.ctrlKey || e.metaKey || e.shiftKey)
            }
          >
            <CardBody className="p-2.5 overflow-hidden">
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox
                  color="primary"
                  isSelected={selectedFiles.includes(file.id)}
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  onValueChange={() => {
                    onFileSelect(file.id, true);
                  }}
                />
              </div>

              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                    file.type === "folder" ? "bg-primary-500/10" : "bg-content2"
                  }`}
                >
                  <Icon
                    className={`text-2xl ${getFileColor(file.fileType)}`}
                    icon={getFileIcon(file.fileType)}
                  />
                </div>

                <h3 className="font-medium text-xs mb-0.5 truncate w-full">
                  {file.name}
                </h3>

                <div className="flex items-center justify-center gap-1 text-xs text-foreground-500">
                  <Icon className="text-xs" icon={file.serviceIcon} />
                  <span className="text-[10px]">
                    {file.type === "file" ? file.size : file.modified}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );

  // List View
  const renderListView = () => (
    <Card className="border border-divider bg-content1/80 backdrop-blur-sm">
      <Table
        removeWrapper
        aria-label="Files and folders"
        selectedKeys={new Set(selectedFiles)}
        selectionMode="multiple"
        onSelectionChange={() => {
          // const selected = Array.from(keys) as string[];
          // Handle selection change
        }}
      >
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>SIZE</TableColumn>
          <TableColumn>MODIFIED</TableColumn>
          <TableColumn>SERVICE</TableColumn>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow
              key={file.id}
              className={
                selectedFiles.includes(file.id) ? "bg-primary-500/10" : ""
              }
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, file.id);
              }}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      file.type === "folder"
                        ? "bg-primary-500/10"
                        : "bg-content2"
                    }`}
                  >
                    <Icon
                      className={`text-lg ${getFileColor(file.fileType)}`}
                      icon={getFileIcon(file.fileType)}
                    />
                  </div>
                  <span className="font-medium text-sm">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{file.type === "file" ? file.size : "-"}</TableCell>
              <TableCell>{file.modified.replace("Modified ", "")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Icon className="text-sm" icon={file.serviceIcon} />
                  <span>{file.service}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-foreground-600">
          {files.length} {files.length === 1 ? "item" : "items"}
        </div>

        <div className="bg-content2/50 rounded-md p-1 flex">
          <Button
            isIconOnly
            className="rounded-md"
            size="sm"
            variant={viewMode === "grid" ? "flat" : "light"}
            onPress={() => setViewMode("grid")}
          >
            <Icon className="text-lg" icon="lucide:grid" />
          </Button>
          <Button
            isIconOnly
            className="rounded-md"
            size="sm"
            variant={viewMode === "list" ? "flat" : "light"}
            onPress={() => setViewMode("list")}
          >
            <Icon className="text-lg" icon="lucide:list" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? renderGridView() : renderListView()}

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-content2/50 flex items-center justify-center mb-4">
            <Icon
              className="text-3xl text-foreground-500"
              icon="lucide:folder"
            />
          </div>
          <h3 className="text-lg font-medium mb-2">No files found</h3>
          <p className="text-foreground-500 text-center max-w-md">
            This folder is empty. Upload files or create a new folder to get
            started.
          </p>
        </div>
      )}
    </div>
  );
};
