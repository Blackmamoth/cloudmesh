"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ColumnFiltersState, PaginationState, SortingState, VisibilityState } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, getFacetedUniqueValues, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Dialog } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine, RiArrowUpSLine, RiCloseCircleLine, RiDeleteBinLine, RiDownloadLine, RiSearch2Line } from "@remixicon/react";
import FileEmptyState from "@/components/file-empty-state";
import AddItemDialog from "@/components/add-item-dialog";
import FilterPopover from "./FilterPopover";
import { getColumns } from "./columns";
import { PROVIDER_OPTIONS, DATE_RANGE_OPTIONS, FILE_TYPE_OPTIONS } from "./constants";
import { buildDownloadUrl, inferTypeFromName, normalizeProviderLabel, triggerDownload } from "./utils";
import type { ActiveFilter, Item } from "./types";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { getJwtToken } from "@/lib/token";
import { toast } from "sonner";

export default function FileTable() {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  // Selected rows are derived from table state when needed; keep local UI minimal
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  const [data, setData] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Debounced search input value
  const [debouncedSearchInput] = useDebounce(searchInput, 400);

  // Derived request params (no setState in effects)
  const parentFolderParam: string | null = null;
  const sortOnParam = useMemo(() => {
    if (!sorting?.length) return null;
    const primary = sorting[0];
    const fieldMap: Record<string, string> = {
      name: "name",
      size: "size",
      provider: "provider",
      modifiedAt: "modified_time",
    };
    const apiField = fieldMap[primary.id] || "name";
    return `${apiField}:${primary.desc ? "desc" : "asc"}`;
  }, [sorting]);

  const providersParam = useMemo(() => {
    const providerVals = ((columnFilters.find((f) => f.id === "provider")?.value as string[]) || []).map((p) => {
      const v = (p || "").toLowerCase();
      if (v.includes("google")) return "google";
      if (v.includes("onedrive") || v.includes("microsoft")) return "onedrive";
      if (v.includes("dropbox")) return "dropbox";
      return p;
    });
    return providerVals;
  }, [columnFilters]);

  const searchParam = useMemo(() => debouncedSearchInput.trim() || "", [debouncedSearchInput]);

  const columns = useMemo(() => getColumns({ data, setData }), [data]);

  // Note: Resetting pagination on changes is handled in the event handlers (not in effects)

  // Fetch files from API based on params
  const { isFetching } = useQuery({
    queryKey: [
      "files",
      {
        provider: providersParam[0] || null,
        providers: providersParam,
        parent_folder: parentFolderParam,
        search: searchParam || null,
        sort_on: sortOnParam,
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        content_search: null,
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey as [string, any];
      const accessToken = await getJwtToken();
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { access_token: accessToken.token } : {}),
        },
        body: JSON.stringify(params),
      });
      const resp = await response.json();
      // Normalize shape and set data
      try {
        const files = (resp?.files || resp?.data?.files || resp?.payload?.files || resp?.result?.files || []) as any[];
        const transformed: Item[] = (files || []).map((f) => ({
          id: f.id,
          image: (f as any).avatar_url || "/user.png",
          name: f.name,
          type: inferTypeFromName(f.name),
          size: f.size,
          provider: normalizeProviderLabel(f.provider),
          owner: {
            name: (f as any).account_name || "Unknown",
            avatar: (f as any).avatar_url || "/user.png",
          },
          modifiedAt: (() => {
            const raw = (f as any).modified_time;
            if (!raw) return new Date().toISOString();
            const d = new Date(raw);
            return isNaN(d.getTime()) ? String(raw) : d.toISOString();
          })(),
          deletedAt: null,
          originalPath: (f as any).web_view_link,
          previewUrl: (f as any).preview_link,
          viewUrl: (f as any).web_view_link,
          contentUrl: (f as any).web_content_link,
        }));
        setData(transformed);
        const total =
          Number(resp?.total_files) ||
          Number(resp?.file_count) ||
          Number(resp?.data?.total_files) ||
          Number(resp?.payload?.total_files) ||
          (Array.isArray(files) ? files.length : 0);
        setTotalCount(Number.isFinite(total) ? total : transformed.length);
      } catch {
        setData([]);
        setTotalCount(0);
      }
      return resp;
    },
    placeholderData: keepPreviousData,
  });

  const handleMoveSelectedToTrash = async () => {
    const selected = table.getSelectedRowModel().rows;
    const fileIds = selected.map((row) => row.original.id).filter(Boolean);
    if (fileIds.length === 0) return;

    try {
      const accessToken = await getJwtToken();
      const response = await fetch("/api/files/trash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { access_token: accessToken.token } : {}),
        },
        body: JSON.stringify({ file_ids: fileIds }),
      });

      if (response.ok) {
        const updatedData = data.filter((item) => !fileIds.includes(item.id));
        setData(updatedData);
        toast.success("Files moved to trash");
      }
    } catch (e) {
      toast.error("Failed to move files to trash");
    } finally {
      table.resetRowSelection();
    }
  };

  const pageCount = Math.max(1, Math.ceil((totalCount || 0) / pagination.pageSize));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: undefined,
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    // Server-side pagination: we feed current page data; still keep state in table for pageIndex/pageSize
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount,
    autoResetPageIndex: false,
    state: { sorting, pagination, columnFilters, columnVisibility },
  });

  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    const providerFilter = (table.getColumn("provider")?.getFilterValue() as string[]) || [];
    providerFilter.forEach((provider) => {
      const providerOption = PROVIDER_OPTIONS.find((opt) => opt.value === provider);
      filters.push({ type: "provider", value: provider, label: providerOption?.label || provider, logo: providerOption?.logo });
    });

    const typeFilter = (table.getColumn("type")?.getFilterValue() as string[]) || [];
    typeFilter.forEach((type) => {
      const typeOption = FILE_TYPE_OPTIONS.find((opt) => opt.value === type);
      filters.push({ type: "fileType", value: type, label: typeOption?.label || type, icon: typeOption?.icon });
    });

    const dateFilter = (table.getColumn("modifiedAt")?.getFilterValue() as string) || "";
    if (dateFilter) {
      const dateOption = DATE_RANGE_OPTIONS.find((opt) => opt.value === dateFilter);
      filters.push({ type: "dateRange", value: dateFilter, label: dateOption?.label || dateFilter });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  const removeFilter = (filterType: string, value: string) => {
    if (filterType === "provider") {
      const current = (table.getColumn("provider")?.getFilterValue() as string[]) || [];
      const updated = current.filter((v) => v !== value);
      table.getColumn("provider")?.setFilterValue(updated.length ? updated : undefined);
    } else if (filterType === "fileType") {
      const current = (table.getColumn("type")?.getFilterValue() as string[]) || [];
      const updated = current.filter((v) => v !== value);
      table.getColumn("type")?.setFilterValue(updated.length ? updated : undefined);
    } else if (filterType === "dateRange") {
      table.getColumn("modifiedAt")?.setFilterValue(undefined);
    }
  };

  const currentPageIndex = table.getState().pagination.pageIndex;

  return (
    <div className="space-y-4 bg-gradient-to-br from-sidebar/60 to-sidebar border-border border p-5 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn("peer min-w-60 ps-9 bg-background bg-gradient-to-br from-accent/60 to-accent", Boolean(searchInput) && "pe-9")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name"
              type="text"
              aria-label="Search by name"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50">
              <RiSearch2Line size={20} aria-hidden="true" />
            </div>
            {Boolean(searchInput) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/60 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  setSearchInput("");
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                <RiCloseCircleLine size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {table.getSelectedRowModel().rows.length > 0 && (
            <>
              <Dialog>
                <Button className="ml-auto" variant="outline" onClick={handleMoveSelectedToTrash}>
                  <RiDeleteBinLine className="-ms-1 opacity-60" size={16} aria-hidden="true" />
                  Move to Trash
                  <span className="-me-1 ms-1 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => {
                  const rows = table.getSelectedRowModel().rows;
                  rows.forEach((r) => {
                    const url = buildDownloadUrl(r.original);
                    if (url) triggerDownload(url, r.original.name);
                  });
                }}
              >
                <RiDownloadLine className="size-5" size={20} aria-hidden="true" />
                Download
              </Button>
            </>
          )}
          <AddItemDialog />
          <FilterPopover
            table={table}
            onAnyFilterChange={() => {
              table.setPageIndex(0);
            }}
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg ">
          {activeFilters.map((filter, index) => (
            <Badge key={`${filter.type}-${filter.value}-${index}`} variant="secondary" className="flex items-center gap-1.5 pr-1 hover:bg-secondary/80 transition-colors">
              {filter.type === "provider" && filter.logo && <Image src={filter.logo} alt={filter.label} className="w-3 h-3" />}
              {filter.type === "fileType" && filter.icon && <filter.icon className="w-3 h-3" />}
              <span className="text-xs">{filter.label}</span>
              <button onClick={() => removeFilter(filter.type, filter.value)} className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity" aria-label={`Remove ${filter.label} filter`}>
                <RiCloseCircleLine className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          )}
        </div>
      )}

      <Table className="table-fixed border-separate border-spacing-0 [&_tr:not(:last-child)_td]:border-b">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} style={{ width: `${header.getSize()}px` }} className="relative h-9 select-none bg-sidebar border-y border-border first:border-l first:rounded-l-lg last:border-r last:rounded-r-lg">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(header.column.getCanSort() && "flex h-full cursor-pointer select-none items-center gap-2")}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <RiArrowUpSLine className="shrink-0 opacity-60" size={16} aria-hidden="true" />,
                          desc: <RiArrowDownSLine className="shrink-0 opacity-60" size={16} aria-hidden="true" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <tbody aria-hidden="true" className="table-row h-1"></tbody>
        <TableBody>
      {isFetching ? (
            <TableRow className="hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="border-0 [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg h-px hover:bg-accent/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="last:py-0 h-[inherit]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <FileEmptyState
                  searchQuery={searchInput}
                  onClearSearch={() => {
                    setSearchInput("");
                    table.resetColumnFilters();
                    if (inputRef.current) inputRef.current.focus();
                  }}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <tbody aria-hidden="true" className="table-row h-1"></tbody>
      </Table>

      {table.getRowModel().rows.length > 0 && (
        <div className="flex gap-3 justify-between px-3">
          <div className="items-center text-sm text-muted-foreground">
            <p className="text-center mt-1.5">
              {(() => {
                const start = currentPageIndex * table.getState().pagination.pageSize + (data.length ? 1 : 0);
                const end = currentPageIndex * table.getState().pagination.pageSize + data.length;
                return `Showing ${start} to ${end} of ${totalCount} results`;
              })()}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Items per page:</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value: string) => {
                  table.setPageSize(Number(value));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Pagination className="flex justify-end">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to previous page"
                  >
                    <RiArrowLeftSLine size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>

                {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => {
                  const isCurrentPage = pageIndex === currentPageIndex;
                  const isVisible =
                    pageIndex === 0 || pageIndex === table.getPageCount() - 1 || Math.abs(pageIndex - currentPageIndex) <= 1;

                  if (!isVisible && table.getPageCount() > 5) {
                    if (pageIndex === 1 && currentPageIndex > 3) {
                      return (
                        <PaginationItem key={`ellipsis-start`}>
                          <span className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">...</span>
                        </PaginationItem>
                      );
                    }
                    if (pageIndex === table.getPageCount() - 2 && currentPageIndex < table.getPageCount() - 4) {
                      return (
                        <PaginationItem key={`ellipsis-end`}>
                          <span className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={pageIndex}>
                      <Button
                        size="icon"
                        variant={isCurrentPage ? "secondary" : "outline"}
                        className="h-8 w-8"
                        onClick={() => table.setPageIndex(pageIndex)}
                        aria-label={`Go to page ${pageIndex + 1}`}
                        aria-current={isCurrentPage ? "page" : undefined}
                      >
                        {pageIndex + 1}
                      </Button>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to next page"
                  >
                    <RiArrowRightSLine size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}




