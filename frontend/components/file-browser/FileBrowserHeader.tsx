import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";

interface FileBrowserHeaderProps {
  selectedFiles: string[];
  onClearSelection: () => void;
}

export const FileBrowserHeader: React.FC<FileBrowserHeaderProps> = ({
  selectedFiles,
  onClearSelection,
}) => {
  const [currentPath, setCurrentPath] = React.useState<string[]>([
    "Google Drive",
    "Projects",
    "Screenshots",
  ]);
  const [sortBy, setSortBy] = React.useState<string>("name");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [filterType, setFilterType] = React.useState<string>("all");

  const handlePathChange = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  return (
    <div className="mb-4">
      {/* Breadcrumb navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
        <Breadcrumbs
          className="mb-2 sm:mb-0"
          size="sm"
          onAction={(key) => {
            const index = parseInt(key.toString());

            handlePathChange(index);
          }}
        >
          {currentPath.map((segment, index) => (
            <BreadcrumbItem
              key={index}
              isCurrent={index === currentPath.length - 1}
            >
              {segment}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
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

          {/* Sort dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                endContent={
                  <Icon className="text-sm" icon="lucide:chevron-down" />
                }
                size="sm"
                variant="flat"
              >
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort options"
              selectedKeys={[sortBy]}
              selectionMode="single"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];

                if (selected) setSortBy(selected.toString());
              }}
            >
              <DropdownItem
                key="name"
                startContent={<Icon icon="lucide:text" />}
              >
                Name
              </DropdownItem>
              <DropdownItem
                key="modified"
                startContent={<Icon icon="lucide:clock" />}
              >
                Last Modified
              </DropdownItem>
              <DropdownItem
                key="size"
                startContent={<Icon icon="lucide:database" />}
              >
                Size
              </DropdownItem>
              <DropdownItem
                key="type"
                startContent={<Icon icon="lucide:file" />}
              >
                Type
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* New Filter dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                endContent={<Icon className="text-sm" icon="lucide:filter" />}
                size="sm"
                variant="flat"
              >
                Filter
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Filter options"
              selectedKeys={[filterType]}
              selectionMode="single"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];

                if (selected) setFilterType(selected.toString());
              }}
            >
              <DropdownItem
                key="all"
                startContent={<Icon icon="lucide:layers" />}
              >
                All Files
              </DropdownItem>
              <DropdownItem
                key="documents"
                startContent={<Icon icon="lucide:file-text" />}
              >
                Documents
              </DropdownItem>
              <DropdownItem
                key="images"
                startContent={<Icon icon="lucide:image" />}
              >
                Images
              </DropdownItem>
              <DropdownItem
                key="videos"
                startContent={<Icon icon="lucide:video" />}
              >
                Videos
              </DropdownItem>
              <DropdownItem
                key="audio"
                startContent={<Icon icon="lucide:music" />}
              >
                Audio
              </DropdownItem>
              <DropdownItem
                key="archives"
                startContent={<Icon icon="lucide:archive" />}
              >
                Archives
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* New Search bar */}
      <div className="mb-3">
        <Input
          className="bg-content1/80 backdrop-blur-sm"
          endContent={
            searchQuery && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setSearchQuery("")}
              >
                <Icon className="text-foreground-500 text-sm" icon="lucide:x" />
              </Button>
            )
          }
          placeholder="Search files and folders..."
          startContent={
            <Icon className="text-foreground-500" icon="lucide:search" />
          }
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      </div>

      {/* Selection bar - appears when files are selected */}
      {selectedFiles.length > 0 && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-2 rounded-lg bg-content1/95 backdrop-blur-md border border-divider mb-3"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              className="text-foreground-600"
              size="sm"
              variant="light"
              onPress={onClearSelection}
            >
              <Icon icon="lucide:x" />
            </Button>
            <span className="font-medium">{selectedFiles.length} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              startContent={<Icon icon="lucide:download" />}
              variant="light"
            >
              Download
            </Button>
            <Button
              size="sm"
              startContent={<Icon icon="lucide:move" />}
              variant="light"
            >
              Move
            </Button>
            <Button
              color="danger"
              size="sm"
              startContent={<Icon icon="lucide:trash-2" />}
              variant="light"
            >
              Delete
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
