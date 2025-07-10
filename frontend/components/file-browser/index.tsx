"use client";

import React from "react";

import { FileBrowser } from "./file-browser";

import { mockFiles } from "@/components/file-browser/mock-data";
import { FilterOptions, SortOption, ViewMode } from "@/lib/types";

export const FileBrowserPage = () => {
  // Add state for view mode, sorting, and filtering
  const [viewMode, setViewMode] = React.useState<ViewMode>("table"); // Changed to table as default
  const [sortOption, setSortOption] = React.useState<SortOption>({
    field: "modifiedAt",
    direction: "desc",
  });
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({
    provider: [],
    fileType: [],
    dateModified: null,
  });

  // Sort and filter files based on current options
  const processedFiles = React.useMemo(() => {
    let result = [...mockFiles];

    // Apply filters
    if (filterOptions.provider.length > 0) {
      result = result.filter((file) =>
        filterOptions.provider.includes(file.provider),
      );
    }

    if (filterOptions.fileType.length > 0) {
      result = result.filter((file) =>
        filterOptions.fileType.includes(file.type),
      );
    }

    if (filterOptions.dateModified) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);

      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);

      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);

      lastMonth.setDate(lastMonth.getDate() - 30);
      const thisYear = new Date(today);

      thisYear.setMonth(0, 1);

      result = result.filter((file) => {
        const fileDate = new Date(file.modifiedAt);

        switch (filterOptions.dateModified) {
          case "today":
            return fileDate >= today;
          case "yesterday":
            return fileDate >= yesterday && fileDate < today;
          case "week":
            return fileDate >= lastWeek;
          case "month":
            return fileDate >= lastMonth;
          case "year":
            return fileDate >= thisYear;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return result.sort((a, b) => {
      const { field, direction } = sortOption;
      const modifier = direction === "asc" ? 1 : -1;

      if (field === "name") {
        return a.name.localeCompare(b.name) * modifier;
      } else if (field === "size") {
        return (a.size - b.size) * modifier;
      } else if (field === "modifiedAt") {
        return (
          (new Date(a.modifiedAt).getTime() -
            new Date(b.modifiedAt).getTime()) *
          modifier
        );
      }

      return 0;
    });
  }, [mockFiles, sortOption, filterOptions]);

  return (
    <>
      <FileBrowser
        files={processedFiles}
        filterOptions={filterOptions}
        sortOption={sortOption}
        viewMode={viewMode}
        onFilterChange={setFilterOptions}
        onSortChange={setSortOption}
        onViewModeChange={setViewMode}
      />
    </>
  );
};
