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
import { TrashItem, TrashSortOption } from "@/lib/types";

interface TrashTableProps {
  items: TrashItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  sortOption: TrashSortOption;
  onSortChange: (sortOption: TrashSortOption) => void;
}

export const TrashTable: React.FC<TrashTableProps> = ({
  items,
  selectedItems,
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
      onSelectionChange(keys === "all" ? items.map((item) => item.id) : []);
    }
  };

  // Handle sort change
  const handleSortChange = (columnKey: string) => {
    if (columnKey === sortOption.field) {
      // Toggle direction if same column
      onSortChange({
        field: columnKey as "name" | "size" | "modifiedAt" | "deletedAt",
        direction: sortOption.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to ascending
      onSortChange({
        field: columnKey as "name" | "size" | "modifiedAt" | "deletedAt",
        direction: "asc",
      });
    }
  };

  // Handle item action
  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Performing ${action} on trash item ${itemId}`);
    // Implementation would go here
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Table
        isHeaderSticky
        removeWrapper
        aria-label="Trash items table"
        classNames={{
          base: "min-w-[1000px]",
          emptyWrapper: "py-10",
        }}
        selectedKeys={new Set(selectedItems)}
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
            onClick={() => handleSortChange("deletedAt")}
          >
            <div className="flex items-center gap-1">
              Deleted
              {sortOption.field === "deletedAt" && (
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
          <TableColumn>Deleted By</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-success/10 dark:bg-success/20 p-4 rounded-full mb-4">
                <Icon
                  className="text-success text-4xl"
                  icon="lucide:trash-2"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trash is empty</h3>
              <p className="text-foreground-500 max-w-md">
                Your trash is empty. When you delete files, they'll appear here and can be restored within 30 days.
              </p>
            </div>
          }
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-danger-400 opacity-75"
                    icon={getFileIcon(item.type)}
                  />
                  <span className="truncate max-w-[200px] text-foreground-600">{item.name}</span>
                </div>
              </TableCell>
              <TableCell>{formatFileSize(item.size)}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  startContent={
                    <Icon
                      className="text-sm"
                      icon={
                        item.provider === "Google Drive"
                          ? "logos:google-drive"
                          : "logos:dropbox"
                      }
                    />
                  }
                  variant="flat"
                >
                  {item.provider}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    showFallback
                    name={item.owner.name}
                    size="sm"
                    src={item.owner.avatar}
                  />
                  <span className="hidden md:inline text-sm">
                    {item.owner.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{formatDate(item.deletedAt)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    showFallback
                    name={item.deletedBy.name}
                    size="sm"
                    src={item.deletedBy.avatar}
                  />
                  <span className="hidden lg:inline text-sm">
                    {item.deletedBy.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button isIconOnly size="sm" variant="light">
                      <Icon icon="lucide:more-horizontal" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="restore"
                      startContent={<Icon icon="lucide:undo-2" />}
                    >
                      Restore
                    </DropdownItem>
                    <DropdownItem
                      key="preview"
                      startContent={<Icon icon="lucide:eye" />}
                    >
                      Preview
                    </DropdownItem>
                    <DropdownItem
                      key="download"
                      startContent={<Icon icon="lucide:download" />}
                    >
                      Download
                    </DropdownItem>
                    <DropdownItem
                      key="info"
                      startContent={<Icon icon="lucide:info" />}
                    >
                      Details
                    </DropdownItem>
                    <DropdownItem
                      key="delete-permanently"
                      className="text-danger"
                      color="danger"
                      startContent={<Icon icon="lucide:trash-x" />}
                    >
                      Delete Permanently
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