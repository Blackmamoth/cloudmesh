import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Icon } from "@iconify/react";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";

import { formatDate } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import { File } from "@/lib/types";
import { SortOption } from "@/lib/types";

interface FileTableProps {
  files: File[];
  selectedFiles: string[];
  onSelectionChange: (selectedFiles: string[]) => void;
  sortOption: SortOption;
  onSortChange: (sortOption: SortOption) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
  sortOption,
  onSortChange,
}) => {
  // Handle row selection
  const handleSelectionChange = (keys: any) => {
    // keys can be a Set or 'all' or 'none' depending on the table library
    if (keys instanceof Set) {
      onSelectionChange(Array.from(keys));
    } else if (Array.isArray(keys)) {
      onSelectionChange(keys);
    } else if (
      typeof keys === "string" &&
      (keys === "all" || keys === "none")
    ) {
      onSelectionChange(keys === "all" ? files.map((file) => file.id) : []);
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange(files.map((file) => file.id));
    } else {
      onSelectionChange([]);
    }
  };

  // Handle sort change
  const handleSortChange = (columnKey: string) => {
    if (columnKey === sortOption.field) {
      // Toggle direction if same column
      onSortChange({
        field: columnKey as "name" | "size" | "modifiedAt",
        direction: sortOption.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to ascending
      onSortChange({
        field: columnKey as "name" | "size" | "modifiedAt",
        direction: "asc",
      });
    }
  };

  // Handle file action
  const handleFileAction = (fileId: string, action: string) => {
    console.log(`Performing ${action} on file ${fileId}`);
    // Implementation would go here
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Table
        isHeaderSticky
        removeWrapper
        aria-label="Files table"
        classNames={{
          base: "min-w-[800px]",
          emptyWrapper: "py-10",
        }}
        selectedKeys={new Set(selectedFiles)}
        selectionMode="multiple"
        onSelectionChange={handleSelectionChange}
      >
        <TableHeader>
          <TableColumn
            className="cursor-pointer"
            onClick={() => handleSortChange("name")}
          >
            <div className="flex items-center gap-1">
              Name
              {sortOption.field === "name" && (
                <Icon
                  className="text-xs"
                  icon={
                    sortOption.direction === "asc"
                      ? "lucide:arrow-up"
                      : "lucide:arrow-down"
                  }
                />
              )}
            </div>
          </TableColumn>
          <TableColumn
            className="cursor-pointer"
            onClick={() => handleSortChange("size")}
          >
            <div className="flex items-center gap-1">
              Size
              {sortOption.field === "size" && (
                <Icon
                  className="text-xs"
                  icon={
                    sortOption.direction === "asc"
                      ? "lucide:arrow-up"
                      : "lucide:arrow-down"
                  }
                />
              )}
            </div>
          </TableColumn>
          <TableColumn>Provider</TableColumn>
          <TableColumn>Owner</TableColumn>
          <TableColumn
            className="cursor-pointer"
            onClick={() => handleSortChange("modifiedAt")}
          >
            <div className="flex items-center gap-1">
              Modified
              {sortOption.field === "modifiedAt" && (
                <Icon
                  className="text-xs"
                  icon={
                    sortOption.direction === "asc"
                      ? "lucide:arrow-up"
                      : "lucide:arrow-down"
                  }
                />
              )}
            </div>
          </TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-8 text-center">
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
          }
        >
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-primary"
                    icon={getFileIcon(file.type)}
                  />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  startContent={
                    <Icon
                      className="text-sm"
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
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    showFallback
                    name={file.owner.name}
                    size="sm"
                    src={file.owner.avatar}
                  />
                  <span className="hidden md:inline text-sm">
                    {file.owner.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatDate(file.modifiedAt)}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button isIconOnly size="sm" variant="light">
                      <Icon icon="lucide:more-horizontal" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
