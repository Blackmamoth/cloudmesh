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

import { TrashItem } from "@/lib/types";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";

interface TrashGridProps {
  items: TrashItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
}

export const TrashGrid: React.FC<TrashGridProps> = ({
  items,
  selectedItems,
  onSelectionChange,
}) => {
  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  // Handle item action
  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Performing ${action} on trash item ${itemId}`);
    // Implementation would go here
  };

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          isPressable
          className={`h-full ${selectedItems.includes(item.id) ? "border-primary" : ""}`}
          onPress={() => handleItemAction(item.id, "preview")}
        >
          <CardBody className="p-0 relative">
            {/* File preview/icon */}
            <div className="h-40 flex items-center justify-center bg-content2 relative">
              {item.type === "image" ? (
                <img
                  alt={item.name}
                  className="object-cover w-full h-full opacity-75"
                  src={`https://img.heroui.chat/image/ai?w=400&h=400&u=${item.id}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <Icon
                    className="text-danger-400 text-4xl opacity-75"
                    icon={getFileIcon(item.type)}
                  />
                </div>
              )}

              {/* Deleted badge overlay */}
              <div className="absolute inset-0 bg-danger/10 flex items-center justify-center">
                <Chip
                  className="bg-danger/20 border-danger/30"
                  color="danger"
                  size="sm"
                  startContent={<Icon icon="lucide:trash-2" />}
                  variant="bordered"
                >
                  Deleted
                </Chip>
              </div>

              {/* Provider badge - consistently positioned top-left */}
              <div className="absolute top-2 left-2">
                <Chip
                  size="sm"
                  startContent={
                    <Icon
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
              </div>

              {/* Deleted by avatar - consistently positioned bottom-right */}
              <div className="absolute bottom-2 right-2">
                <Avatar
                  isBordered
                  showFallback
                  className="bg-background"
                  name={item.deletedBy.name}
                  size="sm"
                  src={item.deletedBy.avatar}
                  title={`Deleted by ${item.deletedBy.name}`}
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
                  aria-label={`Select ${item.name}`}
                  className="bg-background/80 backdrop-blur-sm rounded-md p-1"
                  isSelected={selectedItems.includes(item.id)}
                  onChange={() => toggleItemSelection(item.id)}
                />
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-foreground-600">{item.name}</p>
              <p className="text-xs text-foreground-500 truncate">
                {formatFileSize(item.size)} • Deleted {formatDate(item.deletedAt)}
              </p>
              <p className="text-xs text-foreground-400 truncate">
                From: {item.originalPath}
              </p>
            </div>
            <Dropdown>
              <DropdownTrigger asChild>
                <Button isIconOnly size="sm" variant="light">
                  <Icon icon="lucide:more-horizontal" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Trash item actions">
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
          </CardFooter>
        </Card>
      ))}

      {/* Empty state when no items in trash */}
      {items.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
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
      )}
    </div>
  );
}; 