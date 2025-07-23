import React from "react";
import { Card, CardBody } from "@heroui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";

import { TrashToolbar } from "./trash-toolbar";
import { TrashGrid } from "./trash-grid";
import { TrashTable } from "./trash-table";

import { TrashFilterOptions, TrashSortOption, ViewMode, TrashItem } from "@/lib/types";

interface TrashBrowserProps {
  items: TrashItem[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: TrashSortOption;
  onSortChange: (option: TrashSortOption) => void;
  filterOptions: TrashFilterOptions;
  onFilterChange: (options: TrashFilterOptions) => void;
}

export const TrashBrowser: React.FC<TrashBrowserProps> = ({
  items,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
}) => {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [itemsPerPage, setItemsPerPage] = React.useState(20);

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items;

    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalPath.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Get current items for pagination
  const currentItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of browser when page changes
    window.scrollTo(0, 0);
  };

  // Handle page size change
  const handlePageSizeChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on ${selectedItems.length} items`);
    
    if (action === "restore") {
      console.log("Restoring items:", selectedItems);
      // Implementation would go here - restore selected items
      setSelectedItems([]);
    } else if (action === "delete-permanently") {
      console.log("Permanently deleting items:", selectedItems);
      // Implementation would go here - permanently delete selected items
      setSelectedItems([]);
    } else if (action === "empty-trash") {
      console.log("Emptying entire trash");
      // Implementation would go here - empty entire trash
      setSelectedItems([]);
    }
  };

  // Clear selection when items change
  React.useEffect(() => {
    setSelectedItems([]);
  }, [items]);

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <TrashToolbar
            currentPage={currentPage}
            filterOptions={filterOptions}
            itemsPerPage={itemsPerPage}
            searchQuery={searchQuery}
            selectedCount={selectedItems.length}
            sortOption={sortOption}
            totalCount={filteredItems.length}
            totalPages={totalPages}
            viewMode={viewMode}
            onBulkAction={handleBulkAction}
            onFilterChange={onFilterChange}
            onSearchChange={setSearchQuery}
            onSortChange={onSortChange}
            onViewModeChange={onViewModeChange}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "grid" ? (
                <TrashGrid
                  items={currentItems}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                />
              ) : (
                <TrashTable
                  items={currentItems}
                  selectedItems={selectedItems}
                  sortOption={sortOption}
                  onSelectionChange={setSelectedItems}
                  onSortChange={onSortChange}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Enhanced pagination - ALWAYS visible with proper spacing */}
          {filteredItems.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-2 border-t border-divider pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
                  {filteredItems.length} items
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-500">
                    Items per page:
                  </span>
                  <Select
                    className="w-20"
                    size="sm"
                    value={itemsPerPage.toString()}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    <SelectItem key="10" textValue="10">
                      10
                    </SelectItem>
                    <SelectItem key="20" textValue="20">
                      20
                    </SelectItem>
                    <SelectItem key="50" textValue="50">
                      50
                    </SelectItem>
                    <SelectItem key="100" textValue="100">
                      100
                    </SelectItem>
                  </Select>
                </div>

                {totalPages > 1 && (
                  <Pagination
                    showControls
                    className="rounded-md shadow-sm"
                    color="primary"
                    initialPage={currentPage}
                    page={currentPage}
                    size="sm"
                    total={totalPages}
                    onChange={handlePageChange}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}; 