import React from "react";
import { Button, ButtonGroup } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Chip } from "@heroui/chip";

import { FileType, TrashFilterOptions, TrashSortOption, ViewMode } from "@/lib/types";

interface TrashToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: TrashSortOption;
  onSortChange: (option: TrashSortOption) => void;
  filterOptions: TrashFilterOptions;
  onFilterChange: (options: TrashFilterOptions) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalCount: number;
  onBulkAction: (action: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export const TrashToolbar: React.FC<TrashToolbarProps> = ({
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  totalCount,
  onBulkAction,
  currentPage,
  totalPages,
  itemsPerPage,
}) => {
  // Provider options
  const providers = ["Google Drive", "Dropbox"];

  // File type options
  const fileTypes: FileType[] = [
    "document",
    "image",
    "spreadsheet",
    "presentation",
    "pdf",
    "other",
  ];

  // Date deleted options
  const dateOptions = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "week" },
    { label: "Last 30 days", value: "month" },
  ];

  // Deleted by users (mock data - in real app this would come from props or API)
  const deletedByUsers = [
    "John Doe",
    "Jane Smith", 
    "Alex Johnson",
    "Sarah Wilson",
  ];

  // Handle filter change
  const updateFilter = (key: keyof TrashFilterOptions, value: any) => {
    onFilterChange({
      ...filterOptions,
      [key]: value,
    });
  };

  // Toggle provider filter
  const toggleProviderFilter = (provider: string) => {
    const currentProviders = [...filterOptions.provider];

    if (currentProviders.includes(provider)) {
      updateFilter(
        "provider",
        currentProviders.filter((p) => p !== provider),
      );
    } else {
      updateFilter("provider", [...currentProviders, provider]);
    }
  };

  // Toggle file type filter
  const toggleFileTypeFilter = (fileType: FileType) => {
    const currentTypes = [...filterOptions.fileType];

    if (currentTypes.includes(fileType)) {
      updateFilter(
        "fileType",
        currentTypes.filter((t) => t !== fileType),
      );
    } else {
      updateFilter("fileType", [...currentTypes, fileType]);
    }
  };

  // Toggle deleted by filter
  const toggleDeletedByFilter = (user: string) => {
    const currentUsers = [...filterOptions.deletedBy];

    if (currentUsers.includes(user)) {
      updateFilter(
        "deletedBy",
        currentUsers.filter((u) => u !== user),
      );
    } else {
      updateFilter("deletedBy", [...currentUsers, user]);
    }
  };

  // Format file type for display
  const formatFileType = (type: FileType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get file type icon
  const getFileTypeIcon = (type: FileType): string => {
    switch (type) {
      case "document":
        return "lucide:file-text";
      case "image":
        return "lucide:image";
      case "spreadsheet":
        return "lucide:table";
      case "presentation":
        return "lucide:monitor";
      case "pdf":
        return "lucide:file";
      default:
        return "lucide:file";
    }
  };

  // Get active filters count
  const activeFiltersCount =
    filterOptions.provider.length +
    filterOptions.fileType.length +
    filterOptions.deletedBy.length +
    (filterOptions.dateDeleted ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
        {/* Search input */}
        <div className="flex-grow w-full sm:w-auto sm:max-w-md">
          <Input
            fullWidth
            isClearable
            placeholder="Search deleted files..."
            startContent={
              <Icon className="text-default-400" icon="lucide:search" />
            }
            value={searchQuery}
            onValueChange={onSearchChange}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Bulk actions for selected items */}
          {selectedCount > 0 && (
            <div className="flex gap-2">
              <Button
                color="primary"
                startContent={<Icon icon="lucide:undo-2" />}
                variant="flat"
                onPress={() => onBulkAction("restore")}
              >
                Restore ({selectedCount})
              </Button>
              <Button
                color="danger"
                startContent={<Icon icon="lucide:trash-x" />}
                variant="flat"
                onPress={() => onBulkAction("delete-permanently")}
              >
                Delete Permanently ({selectedCount})
              </Button>
            </div>
          )}

          {/* View mode toggle */}
          <ButtonGroup variant="flat">
            <Button
              isIconOnly
              color={viewMode === "grid" ? "primary" : "default"}
              onPress={() => onViewModeChange("grid")}
            >
              <Icon icon="lucide:grid" />
            </Button>
            <Button
              isIconOnly
              color={viewMode === "table" ? "primary" : "default"}
              onPress={() => onViewModeChange("table")}
            >
              <Icon icon="lucide:list" />
            </Button>
          </ButtonGroup>

          {/* Sort dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                startContent={<Icon icon="lucide:arrow-up-down" />}
                variant="flat"
              >
                Sort
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Sort options"
              onAction={(key) => {
                const [field, direction] = (key as string).split('-');
                onSortChange({
                  field: field as "name" | "size" | "modifiedAt" | "deletedAt",
                  direction: direction as "asc" | "desc",
                });
              }}
            >
              <DropdownItem key="name-asc">Name (A-Z)</DropdownItem>
              <DropdownItem key="name-desc">Name (Z-A)</DropdownItem>
              <DropdownItem key="size-asc">Size (Smallest)</DropdownItem>
              <DropdownItem key="size-desc">Size (Largest)</DropdownItem>
              <DropdownItem key="deletedAt-desc">Recently Deleted</DropdownItem>
              <DropdownItem key="deletedAt-asc">Oldest Deleted</DropdownItem>
              <DropdownItem key="modifiedAt-desc">Last Modified</DropdownItem>
              <DropdownItem key="modifiedAt-asc">Oldest Modified</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Filter dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                endContent={
                  activeFiltersCount > 0 && (
                    <Chip color="primary" size="sm" variant="flat">
                      {activeFiltersCount}
                    </Chip>
                  )
                }
                startContent={<Icon icon="lucide:filter" />}
                variant="flat"
              >
                Filter
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Filter options" className="min-w-[280px]">
              <>
                <DropdownItem
                  key="provider-header"
                  isReadOnly
                  className="opacity-70"
                >
                  Provider
                </DropdownItem>
                {providers.map((provider) => (
                  <DropdownItem
                    key={`provider-${provider}`}
                    endContent={
                      filterOptions.provider.includes(provider) && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    startContent={
                      <Icon
                        className="text-lg"
                        icon={
                          provider === "Google Drive"
                            ? "logos:google-drive"
                            : "logos:dropbox"
                        }
                      />
                    }
                    onPress={() => toggleProviderFilter(provider)}
                  >
                    {provider}
                  </DropdownItem>
                ))}

                <DropdownItem
                  key="type-divider"
                  isReadOnly
                  className="opacity-70 mt-2"
                >
                  File Type
                </DropdownItem>
                {fileTypes.map((fileType: FileType) => (
                  <DropdownItem
                    key={`type-${fileType}`}
                    endContent={
                      filterOptions.fileType.includes(fileType) && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    startContent={
                      <Icon className="text-lg" icon={getFileTypeIcon(fileType)} />
                    }
                    onPress={() => toggleFileTypeFilter(fileType)}
                  >
                    {formatFileType(fileType)}
                  </DropdownItem>
                ))}

                <DropdownItem
                  key="date-divider"
                  isReadOnly
                  className="opacity-70 mt-2"
                >
                  Date Deleted
                </DropdownItem>
                {dateOptions.map((dateOption) => (
                  <DropdownItem
                    key={`date-${dateOption.value}`}
                    endContent={
                      filterOptions.dateDeleted === dateOption.value && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    startContent={<Icon className="text-lg" icon="lucide:calendar" />}
                    onPress={() => updateFilter("dateDeleted", 
                      filterOptions.dateDeleted === dateOption.value ? null : dateOption.value
                    )}
                  >
                    {dateOption.label}
                  </DropdownItem>
                ))}

                <DropdownItem
                  key="deletedby-divider"
                  isReadOnly
                  className="opacity-70 mt-2"
                >
                  Deleted By
                </DropdownItem>
                {deletedByUsers.map((user) => (
                  <DropdownItem
                    key={`deletedby-${user}`}
                    endContent={
                      filterOptions.deletedBy.includes(user) && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    startContent={<Icon className="text-lg" icon="lucide:user" />}
                    onPress={() => toggleDeletedByFilter(user)}
                  >
                    {user}
                  </DropdownItem>
                ))}
              </>
            </DropdownMenu>
          </Dropdown>

          {/* Empty trash button */}
          {totalCount > 0 && (
            <Button
              color="danger"
              startContent={<Icon icon="lucide:trash-x" />}
              variant="bordered"
              onPress={() => onBulkAction("empty-trash")}
            >
              Empty Trash
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterOptions.provider.map((provider) => (
            <Chip
              key={`filter-${provider}`}
              startContent={
                <Icon
                  className="text-sm"
                  icon={
                    provider === "Google Drive"
                      ? "logos:google-drive"
                      : "logos:dropbox"
                  }
                />
              }
              variant="flat"
              onClose={() => toggleProviderFilter(provider)}
            >
              {provider}
            </Chip>
          ))}

          {filterOptions.fileType.map((fileType: FileType) => (
            <Chip
              key={`filter-${fileType}`}
              startContent={
                <Icon className="text-sm" icon={getFileTypeIcon(fileType)} />
              }
              variant="flat"
              onClose={() => toggleFileTypeFilter(fileType)}
            >
              {formatFileType(fileType)}
            </Chip>
          ))}

          {filterOptions.dateDeleted && (
            <Chip
              key="filter-date"
              startContent={<Icon className="text-sm" icon="lucide:calendar" />}
              variant="flat"
              onClose={() => updateFilter("dateDeleted", null)}
            >
              {
                dateOptions.find((d) => d.value === filterOptions.dateDeleted)
                  ?.label
              }
            </Chip>
          )}

          {filterOptions.deletedBy.map((user) => (
            <Chip
              key={`filter-deletedby-${user}`}
              startContent={<Icon className="text-sm" icon="lucide:user" />}
              variant="flat"
              onClose={() => toggleDeletedByFilter(user)}
            >
              {user}
            </Chip>
          ))}
        </div>
      )}

      {/* Item count info */}
      <div className="text-sm text-foreground-500">
        {selectedCount > 0 ? (
          <span>
            {selectedCount} of {totalCount} items selected
          </span>
        ) : (
          <span>{totalCount} items in trash</span>
        )}
      </div>
    </div>
  );
}; 