"use client";

import React from "react";

import { TrashBrowser } from "./trash-browser";

import { mockTrashItems } from "@/components/trash/mock-data";
import { TrashFilterOptions, TrashSortOption, ViewMode } from "@/lib/types";

export const TrashBrowserPage = () => {
  // Add state for view mode, sorting, and filtering
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [sortOption, setSortOption] = React.useState<TrashSortOption>({
    field: "deletedAt",
    direction: "desc",
  });
  const [filterOptions, setFilterOptions] = React.useState<TrashFilterOptions>({
    provider: [],
    fileType: [],
    dateDeleted: null,
    deletedBy: [],
  });

  // Sort and filter items based on current options
  const processedItems = React.useMemo(() => {
    let result = [...mockTrashItems];

    // Apply filters
    if (filterOptions.provider.length > 0) {
      result = result.filter((item) =>
        filterOptions.provider.includes(item.provider),
      );
    }

    if (filterOptions.fileType.length > 0) {
      result = result.filter((item) =>
        filterOptions.fileType.includes(item.type),
      );
    }

    if (filterOptions.deletedBy.length > 0) {
      result = result.filter((item) =>
        filterOptions.deletedBy.includes(item.deletedBy.name),
      );
    }

    if (filterOptions.dateDeleted) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);

      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);

      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);

      lastMonth.setDate(lastMonth.getDate() - 30);

      result = result.filter((item) => {
        const deletedDate = new Date(item.deletedAt);

        switch (filterOptions.dateDeleted) {
          case "today":
            return deletedDate >= today;
          case "yesterday":
            return deletedDate >= yesterday && deletedDate < today;
          case "week":
            return deletedDate >= lastWeek;
          case "month":
            return deletedDate >= lastMonth;
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
      } else if (field === "deletedAt") {
        return (
          (new Date(a.deletedAt).getTime() -
            new Date(b.deletedAt).getTime()) *
          modifier
        );
      }

      return 0;
    });
  }, [mockTrashItems, sortOption, filterOptions]);

  return (
    <>
      <TrashBrowser
        items={processedItems}
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
