"use client";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiErrorWarningLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiBardLine,
  RiFilter3Line,
  RiSearch2Line,
  RiVerifiedBadgeFill,
  RiCheckLine,
  RiMoreLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDownloadLine,
} from "@remixicon/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockTrashItems } from "@/lib/constants/Dummydata";
import googledrivelogo from "@/public/google-drive-logo.webp";
import onedrivelogo from "@/public/onedrive-logo.webp";
import dropboxlogo from "@/public/dropbox-logo.png";
import Image from "next/image";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  Video,
  Download,
  File,
} from "lucide-react";

type Item = {
  id: string;
  image: string;
  name: string;
  type:
    | "document"
    | "image"
    | "spreadsheet"
    | "presentation"
    | "pdf"
    | "video"
    | "other";
  size: number;
  provider: string;
  owner: {
    name: string;
    avatar: string;
    email: string;
  };
  modifiedAt: string;
  deletedAt: string;
  deletedBy: {
    name: string;
    avatar: string;
    email: string;
  };
  originalPath: string;
};

// Filter functions
const multiSelectFilterFn: FilterFn<Item> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const value = row.getValue(columnId) as string;
  return filterValue.includes(value);
};

const dateRangeFilterFn: FilterFn<Item> = (
  row,
  columnId,
  filterValue: string
) => {
  if (!filterValue) return true;
  
  const cellValue = row.getValue(columnId) as string;
  const cellDate = new Date(cellValue);
  const now = new Date();
  
  switch (filterValue) {
    case "today":
      return cellDate.toDateString() === now.toDateString();
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return cellDate.toDateString() === yesterday.toDateString();
    case "last7days":
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return cellDate >= week;
    case "last30days":
      const month = new Date(now);
      month.setDate(month.getDate() - 30);
      return cellDate >= month;
    case "thisyear":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return cellDate >= yearStart;
    default:
      return true;
  }
};

// Filter options
const PROVIDER_OPTIONS = [
  { value: "Google Drive", label: "Google Drive", logo: googledrivelogo },
  { value: "OneDrive", label: "OneDrive", logo: onedrivelogo },
  { value: "Dropbox", label: "Dropbox", logo: dropboxlogo },
];

const FILE_TYPE_OPTIONS = [
  { value: "document", label: "Document", icon: FileText },
  { value: "image", label: "Image", icon: FileImage },
  { value: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "pdf", label: "Pdf", icon: Download },
  { value: "video", label: "Video", icon: Video },
  { value: "other", label: "Other", icon: File },
];

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisyear", label: "This year" },
];

interface GetColumnsProps {
  data: Item[];
  setData: React.Dispatch<React.SetStateAction<Item[]>>;
}

const getDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getColumns = ({ data, setData }: GetColumnsProps): ColumnDef<Item>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {getFileTypeIcon(row.original.type)}
        <div className="font-medium">{row.getValue("name")}</div>
      </div>
    ),
    size: 180,
    enableHiding: false,
  },
  {
    header: "Size",
    accessorKey: "size",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatFileSize(row.getValue("size"))}
      </span>
    ),
    size: 110,
  },
  {
    header: "Provider",
    accessorKey: "provider",
    cell: ({ row }) => (
      <Badge variant="secondary">
        <Image 
          src={
            row.getValue("provider") === "Google Drive" 
              ? googledrivelogo 
              : row.getValue("provider") === "OneDrive" 
                ? onedrivelogo 
                : dropboxlogo
          } 
          alt={row.getValue("provider")} 
          className="w-4 h-4 mr-1" 
        />
        {row.getValue("provider")}
      </Badge>
    ),
    size: 140,
    filterFn: multiSelectFilterFn,
  },
  {
    header: "Owner",
    accessorKey: "owner",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img
          className="rounded-full"
          src={row.original.owner.avatar}
          width={20}
          height={20}
          alt={row.original.owner.name}
        />
        <div className="text-muted-foreground">{row.original.owner.name}</div>
      </div>
    ),
    size: 140,
  },
  {
    header: "Modified At",
    accessorKey: "modifiedAt",
    cell: ({ row }) => {
      const value = row.getValue("modifiedAt") as string;
      return (
        <div>
          <p>{getDate(value)}</p>
        </div>
      );
    },
    size: 80,
    filterFn: dateRangeFilterFn,
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const typeOption = FILE_TYPE_OPTIONS.find(opt => opt.value === type);
      return (
        <Badge variant="outline">
          {typeOption && <typeOption.icon className="w-3 h-3 mr-1" />}
          {typeOption?.label || type}
        </Badge>
      );
    },
    size: 120,
    filterFn: multiSelectFilterFn,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <RowActions setData={setData} data={data} item={row.original} />
    ),
    size: 60,
    enableHiding: false,
  },
];

// Filter Popover Component
function FilterPopover({ table }: { table: any }) {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("");

  // Get current filter values and sync with table state
  useEffect(() => {
    const providerFilter = table.getColumn("provider")?.getFilterValue() as string[] || [];
    const typeFilter = table.getColumn("type")?.getFilterValue() as string[] || [];
    const dateFilter = table.getColumn("modifiedAt")?.getFilterValue() as string || "";
    
    setSelectedProviders(providerFilter);
    setSelectedFileTypes(typeFilter);
    setSelectedDateRange(dateFilter);
  }, [table, table.getState().columnFilters]);

  const handleProviderChange = (value: string, checked: boolean) => {
    const newValues = checked 
      ? [...selectedProviders, value]
      : selectedProviders.filter(v => v !== value);
    
    setSelectedProviders(newValues);
    table.getColumn("provider")?.setFilterValue(newValues.length ? newValues : undefined);
  };

  const handleFileTypeChange = (value: string, checked: boolean) => {
    const newValues = checked 
      ? [...selectedFileTypes, value]
      : selectedFileTypes.filter(v => v !== value);
    
    setSelectedFileTypes(newValues);
    table.getColumn("type")?.setFilterValue(newValues.length ? newValues : undefined);
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    table.getColumn("modifiedAt")?.setFilterValue(value || undefined);
  };

  const clearAllFilters = () => {
    setSelectedProviders([]);
    setSelectedFileTypes([]);
    setSelectedDateRange("");
    table.resetColumnFilters();
  };

  const hasActiveFilters = selectedProviders.length > 0 || selectedFileTypes.length > 0 || selectedDateRange;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <RiFilter3Line className="mr-2 h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-6">
          {/* Provider Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Provider</h3>
            <div className="space-y-2">
              {PROVIDER_OPTIONS.map((provider) => (
                <div key={provider.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`provider-${provider.value}`}
                    checked={selectedProviders.includes(provider.value)}
                    onCheckedChange={(checked) => handleProviderChange(provider.value, !!checked)}
                  />
                  <label
                    htmlFor={`provider-${provider.value}`}
                    className="flex items-center space-x-2 text-sm font-normal cursor-pointer"
                  >
                    <Image src={provider.logo} alt={provider.label} className="w-4 h-4" />
                    <span>{provider.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* File Type Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">File Type</h3>
            <div className="space-y-2">
              {FILE_TYPE_OPTIONS.map((fileType) => (
                <div key={fileType.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`type-${fileType.value}`}
                    checked={selectedFileTypes.includes(fileType.value)}
                    onCheckedChange={(checked) => handleFileTypeChange(fileType.value, !!checked)}
                  />
                  <label
                    htmlFor={`type-${fileType.value}`}
                    className="flex items-center space-x-2 text-sm font-normal cursor-pointer"
                  >
                    <fileType.icon className="w-4 h-4" />
                    <span>{fileType.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Modified Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Date Modified</h3>
            <div className="space-y-2">
              {DATE_RANGE_OPTIONS.map((dateOption) => (
                <div key={dateOption.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`date-${dateOption.value}`}
                    checked={selectedDateRange === dateOption.value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleDateRangeChange(dateOption.value);
                      } else {
                        handleDateRangeChange("");
                      }
                    }}
                  />
                  <label
                    htmlFor={`date-${dateOption.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {dateOption.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FileTable() {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  const [data, setData] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns = useMemo(() => getColumns({ data, setData }), [data]);

  useEffect(() => {
    // Transform mockTrashItems to match Item structure
    const transformedData: Item[] = mockTrashItems.map((item) => ({
      id: item.id,
      image: item.owner?.avatar || "/user.png",
      name: item.name,
      type: item.type as
        | "document"
        | "image"
        | "spreadsheet"
        | "presentation"
        | "pdf"
        | "video"
        | "other",
      size: item.size,
      provider: item.provider,
      owner: {
        name: item.owner?.name || "Unknown",
        avatar: item.owner?.avatar || "/user.png",
        email: item.owner?.email || "Unknown",
      },
      modifiedAt: item.modifiedAt,
      deletedAt: item.deletedAt,
      deletedBy: {
        name: item.deletedBy?.name || "Unknown",
        avatar: item.deletedBy?.avatar || "/user.png",
        email: item.deletedBy?.email || "Unknown",
      },
      originalPath: item.originalPath,
    }));

    setData(transformedData);
    setIsLoading(false);
  }, []);

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id)
    );
    setData(updatedData);
    table.resetRowSelection();
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  // Define filter type for badge display
  type ActiveFilter = {
    type: 'provider' | 'fileType' | 'dateRange';
    value: string;
    label: string;
    logo?: any;
    icon?: any;
  };

  // Get active filters for badge display
  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    
    // Provider filters
    const providerFilter = table.getColumn("provider")?.getFilterValue() as string[] || [];
    providerFilter.forEach(provider => {
      const providerOption = PROVIDER_OPTIONS.find(opt => opt.value === provider);
      filters.push({
        type: 'provider',
        value: provider,
        label: providerOption?.label || provider,
        logo: providerOption?.logo
      });
    });

    // File type filters
    const typeFilter = table.getColumn("type")?.getFilterValue() as string[] || [];
    typeFilter.forEach(type => {
      const typeOption = FILE_TYPE_OPTIONS.find(opt => opt.value === type);
      filters.push({
        type: 'fileType',
        value: type,
        label: typeOption?.label || type,
        icon: typeOption?.icon
      });
    });

    // Date range filter
    const dateFilter = table.getColumn("modifiedAt")?.getFilterValue() as string || "";
    if (dateFilter) {
      const dateOption = DATE_RANGE_OPTIONS.find(opt => opt.value === dateFilter);
      filters.push({
        type: 'dateRange',
        value: dateFilter,
        label: dateOption?.label || dateFilter
      });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  const removeFilter = (filterType: string, value: string) => {
    if (filterType === 'provider') {
      const current = table.getColumn("provider")?.getFilterValue() as string[] || [];
      const updated = current.filter(v => v !== value);
      table.getColumn("provider")?.setFilterValue(updated.length ? updated : undefined);
    } else if (filterType === 'fileType') {
      const current = table.getColumn("type")?.getFilterValue() as string[] || [];
      const updated = current.filter(v => v !== value);
      table.getColumn("type")?.setFilterValue(updated.length ? updated : undefined);
    } else if (filterType === 'dateRange') {
      table.getColumn("modifiedAt")?.setFilterValue(undefined);
    }
  };

  return (
    <div className="space-y-4 bg-gradient-to-br from-sidebar/60 to-sidebar border-border border p-5 rounded-lg">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Filter by name */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9 bg-background bg-gradient-to-br from-accent/60 to-accent",
                Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
              )}
              value={
                (table.getColumn("name")?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              placeholder="Search by name"
              type="text"
              aria-label="Search by name"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50">
              <RiSearch2Line size={20} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/60 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <RiCloseCircleLine size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="ml-auto" variant="outline">
                  <RiDeleteBinLine
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Move to Trash
                  <span className="-me-1 ms-1 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                    aria-hidden="true"
                  >
                    <RiErrorWarningLine className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will move the selected files to the trash. You
                      can restore them from the trash later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteRows}>
                    Move to Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline">
              <RiDownloadLine className="size-5" size={20} aria-hidden="true" />
              Download
            </Button> 
            </>
          )}
          {/* Filter button */}
          <FilterPopover table={table} />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg ">
      
          {activeFilters.map((filter, index) => (
            <Badge 
              key={`${filter.type}-${filter.value}-${index}`} 
              variant="secondary" 
              className="flex items-center gap-1.5 pr-1 hover:bg-secondary/80 transition-colors"
            >
              {filter.type === 'provider' && filter.logo && (
                <Image src={filter.logo} alt={filter.label} className="w-3 h-3" />
              )}
              {filter.type === 'fileType' && filter.icon && (
                <filter.icon className="w-3 h-3" />
              )}
              <span className="text-xs">{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.type, filter.value)}
                className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={`Remove ${filter.label} filter`}
              >
                <RiCloseCircleLine className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Table className="table-fixed border-separate border-spacing-0 [&_tr:not(:last-child)_td]:border-b">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="relative h-9 select-none bg-sidebar border-y border-border first:border-l first:rounded-l-lg last:border-r last:rounded-r-lg"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                            "flex h-full cursor-pointer select-none items-center gap-2"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          // Enhanced keyboard handling for sorting
                          if (
                            header.column.getCanSort() &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: (
                            <RiArrowUpSLine
                              className="shrink-0 opacity-60"
                              size={16}
                              aria-hidden="true"
                            />
                          ),
                          desc: (
                            <RiArrowDownSLine
                              className="shrink-0 opacity-60"
                              size={16}
                              aria-hidden="true"
                            />
                          ),
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <tbody aria-hidden="true" className="table-row h-1"></tbody>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-0 [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg h-px hover:bg-accent/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="last:py-0 h-[inherit]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <tbody aria-hidden="true" className="table-row h-1"></tbody>
      </Table>

      {/* Pagination */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex gap-3 justify-between px-3">
        <div className="items-center text-sm text-muted-foreground">
          <p className="text-center mt-1.5">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} of {table.getFilteredRowModel().rows.length} results
          </p>
        </div>
          <div className="flex gap-4 items-center">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">
                Items per page:
              </span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value: string) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const totalItems = table.getFilteredRowModel().rows.length;
                    const baseOptions = [5, 10];
                    const dynamicOptions: number[] = [];

                    // Add base options
                    baseOptions.forEach((option) => {
                      if (option <= totalItems) {
                        dynamicOptions.push(option);
                      }
                    });

                    // Add larger options based on total items
                    if (totalItems > 10) dynamicOptions.push(20);
                    if (totalItems > 20) dynamicOptions.push(30);
                    if (totalItems > 30) dynamicOptions.push(50);
                    if (totalItems > 50) dynamicOptions.push(100);

                    // Add "All" option if total items is reasonable (under 200)
                    if (
                      totalItems > 0 &&
                      totalItems <= 200 &&
                      totalItems > Math.max(...dynamicOptions)
                    ) {
                      dynamicOptions.push(totalItems);
                    }

                    // Remove duplicates and sort
                    const uniqueOptions = [...new Set(dynamicOptions)].sort(
                      (a, b) => a - b
                    );

                    return uniqueOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size === totalItems ? `All (${size})` : size}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

          <Pagination className="flex justify-end">
            <PaginationContent className="gap-1">
              {/* Previous button */}
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

              {/* Page numbers */}
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
                (pageIndex) => {
                  const isCurrentPage =
                    pageIndex === table.getState().pagination.pageIndex;
                  const isVisible =
                    pageIndex === 0 || // First page
                    pageIndex === table.getPageCount() - 1 || // Last page
                    Math.abs(
                      pageIndex - table.getState().pagination.pageIndex
                    ) <= 1; // Current page ± 1

                  if (!isVisible && table.getPageCount() > 5) {
                    if (
                      pageIndex === 1 &&
                      table.getState().pagination.pageIndex > 3
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-start`}>
                          <span className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                            ...
                          </span>
                        </PaginationItem>
                      );
                    }
                    if (
                      pageIndex === table.getPageCount() - 2 &&
                      table.getState().pagination.pageIndex <
                        table.getPageCount() - 4
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-end`}>
                          <span className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                            ...
                          </span>
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
                }
              )}

              {/* Next button */}
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

function RowActions({
  setData,
  data,
  item,
}: {
  setData: React.Dispatch<React.SetStateAction<Item[]>>;
  data: Item[];
  item: Item;
}) {
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    startUpdateTransition(() => {
      const updatedData = data.filter((dataItem) => dataItem.id !== item.id);
      setData(updatedData);
      setShowDeleteDialog(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="shadow-none text-muted-foreground/60"
              aria-label="Edit item"
            >
              <RiMoreLine className="size-5" size={20} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuGroup>
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>Copy Link</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="dark:data-[variant=destructive]:focus:bg-destructive/10"
            >
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isUpdatePending}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Function to get file type icon
const getFileTypeIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="w-4 h-4 text-blue-500" />;
    case "image":
      return <FileImage className="w-4 h-4 text-green-500" />;
    case "spreadsheet":
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    case "presentation":
      return <Presentation className="w-4 h-4 text-orange-500" />;
    case "pdf":
      return <Download className="w-4 h-4 text-red-500" />;
    case "video":
      return <Video className="w-4 h-4 text-purple-500" />;
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
};

// Function to format file size in human-readable format
const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};
