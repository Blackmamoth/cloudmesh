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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
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
import { mockTrashItems } from "@/lib/constants/Dummydata";
import googledrivelogo from "@/public/google-drive-logo.webp";
import onedrivelogo from "@/public/onedrive-logo.webp";
import dropboxlogo from "@/public/dropbox-logo.png";
import Image from "next/image";
import { Image as ImageIcon, FileText, Video, FileSpreadsheet, Presentation, FileImage, Download, File, ScrollText, Plus, Upload, CloudUpload } from "lucide-react";
import Link from "next/link";
type Item = {
  id: string;
  image: string;
  name: string;
  type: "document" | "image" | "spreadsheet" | "presentation" | "pdf" | "video" | "other";
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

const statusFilterFn: FilterFn<Item> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

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
      <span className="text-muted-foreground">{formatFileSize(row.getValue("size"))}</span>
    ),
    size: 110,
  },
  {
    header: "Provider",
    accessorKey: "provider",
    cell: ({ row }) => (
      <Badge variant="secondary">
        <Image src={row.getValue("provider") === "Google Drive" ? googledrivelogo : row.getValue("provider") === "OneDrive" ? onedrivelogo : dropboxlogo} alt={row.getValue("provider")} className="w-4 h-4" />
        {row.getValue("provider")}
      </Badge>
    ),
    size: 140,
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
        <div className="text-muted-foreground">
          {row.original.owner.name}
        </div>
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

export default function OverviewTable() {
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

  // File upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock cloud accounts
  const cloudAccounts = [
    { id: "gdrive-1", name: "john.doe@gmail.com", provider: "Google Drive", logo: googledrivelogo },
    { id: "gdrive-2", name: "work@company.com", provider: "Google Drive", logo: googledrivelogo },
    { id: "onedrive-1", name: "john.doe@outlook.com", provider: "OneDrive", logo: onedrivelogo },
    { id: "dropbox-1", name: "john.doe@dropbox.com", provider: "Dropbox", logo: dropboxlogo },
  ];

  const columns = useMemo(() => getColumns({ data, setData }), [data]);

  useEffect(() => {
    // Transform mockTrashItems to match Item structure
    const transformedData: Item[] = mockTrashItems.map((item) => ({
      id: item.id,
      image: item.owner?.avatar || "/user.png",
      name: item.name,
      type: item.type as "document" | "image" | "spreadsheet" | "presentation" | "pdf" | "video" | "other",
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

  // File upload functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      // Check individual file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const updatedFiles = [...selectedFiles, ...newFiles];
    
    // Check total size (500MB limit)
    const totalSize = updatedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 500 * 1024 * 1024) {
      alert("Total file size exceeds 500MB limit");
      return;
    }

    setSelectedFiles(updatedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((sum, file) => sum + file.size, 0);
  };

  const handleUpload = () => {
    // Reset state since this is UI only
    setSelectedFiles([]);
    setSelectedAccount("");
    setUploadDialogOpen(false);
    // You could show a success message here
    alert("Files uploaded successfully! (UI Demo)");
  };

  const resetUploadDialog = () => {
    setSelectedFiles([]);
    setSelectedAccount("");
    setIsDragOver(false);
  };

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id),
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

  return (
    <div className="space-y-4 p-3">
      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Filter by name */}
          <div className="relative pl-2 ">
           <h1 className="text-lg">Overview</h1>

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="ml-auto" variant="outline">
                  <RiDeleteBinLine
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Delete
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
                      This action cannot be undone. This will permanently delete{" "}
                      {table.getSelectedRowModel().rows.length} selected{" "}
                      {table.getSelectedRowModel().rows.length === 1
                        ? "row"
                        : "rows"}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteRows}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Upload Files Dialog */}
          <AlertDialog open={uploadDialogOpen} onOpenChange={(open) => {
            setUploadDialogOpen(open);
            if (!open) resetUploadDialog();
          }}>
            <AlertDialogTrigger asChild>
              <Button variant="default">
                <Plus className="size-5 -ms-1.5 text-white" />
                Add New Files
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="min-w-[600px] min-h-[700px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Upload className="size-5" />
                  Upload Files
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Upload files to your connected cloud storage accounts
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                {/* Select Account */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Account</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-12">
                        {selectedAccount ? (
                          <div className="flex items-center gap-2">
                            <Image 
                              src={cloudAccounts.find(acc => acc.id === selectedAccount)?.logo || googledrivelogo} 
                              alt="Provider" 
                              className="w-5 h-5" 
                            />
                            <span>{cloudAccounts.find(acc => acc.id === selectedAccount)?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {cloudAccounts.find(acc => acc.id === selectedAccount)?.provider}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Choose a cloud storage account</span>
                        )}
                        <RiArrowDownSLine className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[500px]">
                      {cloudAccounts.map((account) => (
                        <DropdownMenuItem
                          key={account.id}
                          onClick={() => setSelectedAccount(account.id)}
                          className="flex items-center gap-3 p-3"
                        >
                          <Image src={account.logo} alt={account.provider} className="w-5 h-5" />
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-xs text-muted-foreground">{account.provider}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Select Files */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Files</label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                      isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <CloudUpload className="size-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload files or drag and drop</p>
                      <p className="text-xs text-muted-foreground">Maximum: 50MB per file, 500MB total</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <div className="text-sm font-medium">Selected Files:</div>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <File className="size-4" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                          >
                            <RiCloseCircleLine className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Total: {formatFileSize(getTotalSize())} / 500MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={resetUploadDialog}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleUpload}
                  disabled={!selectedAccount || selectedFiles.length === 0}
                >
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

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
                            "flex h-full cursor-pointer select-none items-center gap-2",
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
                          header.getContext(),
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
                        header.getContext(),
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
     <div className="flex justify-end">
      <Link href="/files" className="text-sm text-muted-foreground hover:text-foreground">
        View All
      </Link>
     </div>
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
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="dark:data-[variant=destructive]:focus:bg-destructive/10"
            >
              Delete
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
      return <ScrollText className="w-4 h-4 text-yellow-500" />;
    case "video":
      return <Video className="w-4 h-4 text-purple-500" />;
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
};

// Function to format file size in human-readable format
const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
