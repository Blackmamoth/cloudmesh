import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Checkbox } from "@heroui/checkbox";
import { Dropdown } from "@heroui/dropdown";
import { DropdownTrigger } from "@heroui/dropdown";
import { DropdownMenu } from "@heroui/dropdown";
import { DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";

import { File } from "@/lib/types";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";

interface FileGridProps {
  files: File[];
  selectedFiles: string[];
  onSelectionChange: (selectedFiles: string[]) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
}) => {
  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      onSelectionChange(selectedFiles.filter((id) => id !== fileId));
    } else {
      onSelectionChange([...selectedFiles, fileId]);
    }
  };

  // Handle file action
  const handleFileAction = (fileId: string, action: string) => {
    console.log(`Performing ${action} on file ${fileId}`);
    // Implementation would go here
  };

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {files.map((file) => (
        <Card
          key={file.id}
          isPressable
          className={`h-full ${selectedFiles.includes(file.id) ? "border-primary" : ""}`}
          onPress={() => handleFileAction(file.id, "view")}
        >
          <CardBody className="p-0 relative">
            {/* File preview/icon */}
            <div className="h-40 flex items-center justify-center bg-content2 relative">
              {file.type === "image" ? (
                <img
                  alt={file.name}
                  className="object-cover w-full h-full"
                  src={`https://img.heroui.chat/image/ai?w=400&h=400&u=${file.id}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Icon
                    className="text-primary text-4xl"
                    icon={getFileIcon(file.type)}
                  />
                </div>
              )}

              {/* Provider badge - consistently positioned top-left */}
              <div className="absolute top-2 left-2">
                <Chip
                  size="sm"
                  startContent={
                    <Icon
                      icon={
                        file.provider === "Google Drive"
                          ? "logos:google-drive"
                          : "logos:dropbox"
                      }
                    />
                  }
                  variant="flat"
                >
                  {file.provider}
                </Chip>
              </div>

              {/* Owner avatar - consistently positioned bottom-right */}
              <div className="absolute bottom-2 right-2">
                <Avatar
                  isBordered
                  showFallback
                  className="bg-background"
                  name={file.owner.name}
                  size="sm"
                  src={file.owner.avatar}
                />
              </div>

              {/* Selection checkbox - consistently positioned top-right */}
              <div
                className="absolute top-2 right-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <Checkbox
                  aria-label={`Select ${file.name}`}
                  className="bg-background/80 backdrop-blur-sm rounded-md p-1"
                  isSelected={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                />
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-foreground-500 truncate">
                {formatFileSize(file.size)} • {formatDate(file.modifiedAt)}
              </p>
            </div>
            <Dropdown>
              <DropdownTrigger asChild>
                <Button isIconOnly size="sm" variant="light">
                  <Icon icon="lucide:more-horizontal" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="File actions">
                <DropdownItem
                  key="view"
                  startContent={<Icon icon="lucide:eye" />}
                >
                  View
                </DropdownItem>
                <DropdownItem
                  key="download"
                  startContent={<Icon icon="lucide:download" />}
                >
                  Download
                </DropdownItem>
                <DropdownItem
                  key="copy"
                  startContent={<Icon icon="lucide:copy" />}
                >
                  Copy Link
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Icon icon="lucide:trash" />}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </CardFooter>
        </Card>
      ))}

      {/* Empty state when no files */}
      {files.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full mb-4">
            <Icon
              className="text-primary text-4xl"
              icon="lucide:file-question"
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">No files found</h3>
          <p className="text-foreground-500 max-w-md">
            Try adjusting your search or filter criteria to find what you're
            looking for.
          </p>
        </div>
      )}
    </div>
  );
};
