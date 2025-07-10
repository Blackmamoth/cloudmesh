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

import { FileType, FilterOptions, SortOption, ViewMode } from "@/lib/types";

interface FileToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalCount: number;
  onBulkAction: (action: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export const FileToolbar: React.FC<FileToolbarProps> = ({
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

  // Date modified options
  const dateOptions = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "week" },
    { label: "Last 30 days", value: "month" },
    { label: "This year", value: "year" },
  ];

  // Handle filter change
  const updateFilter = (key: keyof FilterOptions, value: any) => {
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
    (filterOptions.dateModified ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
        {/* Search input */}
        <div className="flex-grow w-full sm:w-auto sm:max-w-md">
          <Input
            fullWidth
            isClearable
            placeholder="Search files..."
            startContent={
              <Icon className="text-default-400" icon="lucide:search" />
            }
            value={searchQuery}
            onValueChange={onSearchChange}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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
            <DropdownMenu aria-label="Sort options">
              <DropdownItem
                key="name-asc"
                description="Alphabetical A-Z"
                isSelected={
                  sortOption.field === "name" && sortOption.direction === "asc"
                }
                startContent={<Icon icon="lucide:arrow-up" />}
                onPress={() =>
                  onSortChange({ field: "name", direction: "asc" })
                }
              >
                Name
              </DropdownItem>
              <DropdownItem
                key="name-desc"
                description="Alphabetical Z-A"
                isSelected={
                  sortOption.field === "name" && sortOption.direction === "desc"
                }
                startContent={<Icon icon="lucide:arrow-down" />}
                onPress={() =>
                  onSortChange({ field: "name", direction: "desc" })
                }
              >
                Name
              </DropdownItem>
              <DropdownItem
                key="size-asc"
                description="Smallest first"
                isSelected={
                  sortOption.field === "size" && sortOption.direction === "asc"
                }
                startContent={<Icon icon="lucide:arrow-up" />}
                onPress={() =>
                  onSortChange({ field: "size", direction: "asc" })
                }
              >
                Size
              </DropdownItem>
              <DropdownItem
                key="size-desc"
                description="Largest first"
                isSelected={
                  sortOption.field === "size" && sortOption.direction === "desc"
                }
                startContent={<Icon icon="lucide:arrow-down" />}
                onPress={() =>
                  onSortChange({ field: "size", direction: "desc" })
                }
              >
                Size
              </DropdownItem>
              <DropdownItem
                key="date-asc"
                description="Oldest first"
                isSelected={
                  sortOption.field === "modifiedAt" &&
                  sortOption.direction === "asc"
                }
                startContent={<Icon icon="lucide:arrow-up" />}
                onPress={() =>
                  onSortChange({ field: "modifiedAt", direction: "asc" })
                }
              >
                Date Modified
              </DropdownItem>
              <DropdownItem
                key="date-desc"
                description="Newest first"
                isSelected={
                  sortOption.field === "modifiedAt" &&
                  sortOption.direction === "desc"
                }
                startContent={<Icon icon="lucide:arrow-down" />}
                onPress={() =>
                  onSortChange({ field: "modifiedAt", direction: "desc" })
                }
              >
                Date Modified
              </DropdownItem>
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
            <DropdownMenu aria-label="Filter options" className="min-w-[240px]">
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
                {fileTypes.map((fileType) => (
                  <DropdownItem
                    key={`type-${fileType}`}
                    endContent={
                      filterOptions.fileType.includes(fileType) && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    startContent={<Icon icon={getFileTypeIcon(fileType)} />}
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
                  Date Modified
                </DropdownItem>
                {dateOptions.map((option) => (
                  <DropdownItem
                    key={`date-${option.value}`}
                    endContent={
                      filterOptions.dateModified === option.value && (
                        <Icon className="text-primary" icon="lucide:check" />
                      )
                    }
                    onPress={() =>
                      updateFilter(
                        "dateModified",
                        filterOptions.dateModified === option.value
                          ? null
                          : option.value,
                      )
                    }
                  >
                    {option.label}
                  </DropdownItem>
                ))}

                {activeFiltersCount > 0 && (
                  <DropdownItem
                    key="clear-filters"
                    className="text-danger"
                    onPress={() =>
                      onFilterChange({
                        provider: [],
                        fileType: [],
                        dateModified: null,
                      })
                    }
                  >
                    Clear All Filters
                  </DropdownItem>
                )}
              </>
            </DropdownMenu>
          </Dropdown>

          {/* Bulk actions (only shown when files are selected) */}
          {selectedCount > 0 && (
            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="primary"
                  startContent={<Icon icon="lucide:check-square" />}
                  variant="flat"
                >
                  {selectedCount} Selected
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Bulk actions">
                <DropdownItem
                  key="download"
                  startContent={<Icon icon="lucide:download" />}
                  onPress={() => onBulkAction("download")}
                >
                  Download
                </DropdownItem>
                <DropdownItem
                  key="share"
                  startContent={<Icon icon="lucide:share" />}
                  onPress={() => onBulkAction("share")}
                >
                  Share
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Icon icon="lucide:trash" />}
                  onPress={() => onBulkAction("delete")}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
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

          {filterOptions.dateModified && (
            <Chip
              key="filter-date"
              startContent={<Icon className="text-sm" icon="lucide:calendar" />}
              variant="flat"
              onClose={() => updateFilter("dateModified", null)}
            >
              {
                dateOptions.find((d) => d.value === filterOptions.dateModified)
                  ?.label
              }
            </Chip>
          )}
        </div>
      )}

      {/* File count info */}
      <div className="text-sm text-foreground-500">
        {selectedCount > 0 ? (
          <span>
            {selectedCount} of {totalCount} files selected
          </span>
        ) : (
          <span>{totalCount} files</span>
        )}
      </div>
    </div>
  );
};
