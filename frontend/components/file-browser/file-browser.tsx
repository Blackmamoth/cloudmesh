import React from "react";
import { Card, CardBody } from "@heroui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";

import { FileToolbar } from "./file-toolbar";
import { FileGrid } from "./file-grid";
import { FileTable } from "./file-table";

import { FilterOptions, SortOption, ViewMode, File } from "@/lib/types";

interface FileBrowserProps {
  files: File[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  files,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
}) => {
  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [itemsPerPage, setItemsPerPage] = React.useState(20);

  // Filter files based on search query
  const filteredFiles = React.useMemo(() => {
    if (!searchQuery) return files;

    return files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [files, searchQuery]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  // Get current files for pagination
  const currentFiles = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFiles, currentPage]);

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
    console.log(`Performing ${action} on ${selectedFiles.length} files`);
    // Implementation would go here
  };

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <FileToolbar
            currentPage={currentPage}
            filterOptions={filterOptions}
            itemsPerPage={itemsPerPage}
            searchQuery={searchQuery}
            selectedCount={selectedFiles.length}
            sortOption={sortOption}
            totalCount={filteredFiles.length}
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
                <FileGrid
                  files={currentFiles}
                  selectedFiles={selectedFiles}
                  onSelectionChange={setSelectedFiles}
                />
              ) : (
                <FileTable
                  files={currentFiles}
                  selectedFiles={selectedFiles}
                  sortOption={sortOption}
                  onSelectionChange={setSelectedFiles}
                  onSortChange={onSortChange}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Enhanced pagination - ALWAYS visible with proper spacing */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-2 border-t border-divider pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of{" "}
                {filteredFiles.length} items
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
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
