"use client";

import React from "react";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FileBrowserHeader } from "@/components/file-browser/FileBrowserHeader";
import { FileContextMenu } from "@/components/file-browser/FileContextMenu";
import { FileGrid } from "@/components/file-browser/FileGrid";
import { UploadButton } from "@/components/file-browser/UploadButton";

export default function FileBrowser() {
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [contextMenu, setContextMenu] = React.useState<{
    show: boolean;
    x: number;
    y: number;
    fileId: string | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    fileId: null,
  });

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      fileId,
    });
  };

  const handleFileSelect = (fileId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      if (selectedFiles.includes(fileId)) {
        setSelectedFiles(selectedFiles.filter((id) => id !== fileId));
      } else {
        setSelectedFiles([...selectedFiles, fileId]);
      }
    } else {
      setSelectedFiles(selectedFiles.includes(fileId) ? [] : [fileId]);
    }
  };

  const handleSelectAll = (files: any[]) => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 relative">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1600px] mx-auto" // Added max-width and centered content
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <FileBrowserHeader
            selectedFiles={selectedFiles}
            onClearSelection={() => setSelectedFiles([])}
          />
        </motion.div>

        <motion.div
          animate={{ opacity: 1 }}
          className="max-w-[1600px] mx-auto" // Added max-width and centered content
          initial={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FileGrid
            selectedFiles={selectedFiles}
            onContextMenu={handleContextMenu}
            onFileSelect={handleFileSelect}
            onSelectAll={handleSelectAll}
          />
        </motion.div>

        <UploadButton />

        {contextMenu.show && (
          <FileContextMenu
            fileId={contextMenu.fileId}
            selectedFiles={selectedFiles}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu({ ...contextMenu, show: false })}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
