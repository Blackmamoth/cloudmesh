import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import RowActions from "./RowActions";
import type { Item } from "./types";
import { FILE_TYPE_OPTIONS, PROVIDER_OPTIONS } from "./constants";
import { dateRangeFilterFn, formatFileSize, getFileTypeIcon, getDate, multiSelectFilterFn } from "./utils";
import React from "react";

export function getColumns({
  data,
  setData,
}: {
  data: Item[];
  setData: React.Dispatch<React.SetStateAction<Item[]>>;
}): ColumnDef<Item>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return (
          <div className="flex items-center gap-3 min-w-0">
            {getFileTypeIcon(row.original.type)}
            <div className="font-medium truncate" title={name}>
              {name}
            </div>
          </div>
        );
      },
      size: 180,
      enableHiding: false,
    },
    {
      header: "Size",
      accessorKey: "size",
      cell: ({ row }) => <span className="text-muted-foreground">{formatFileSize(row.getValue("size") as number)}</span>,
      size: 110,
    },
    {
      header: "Provider",
      accessorKey: "provider",
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Image
            src={row.getValue("provider") === "Google Drive" ? PROVIDER_OPTIONS[0].logo : row.getValue("provider") === "OneDrive" ? PROVIDER_OPTIONS[1].logo : PROVIDER_OPTIONS[2].logo}
            alt={row.getValue("provider")}
            className="w-4 h-4 mr-1"
          />
          {row.getValue("provider") as string}
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
          <img className="rounded-full" src={row.original.owner.avatar} width={20} height={20} alt={row.original.owner.name} />
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
        const typeOption = FILE_TYPE_OPTIONS.find((opt) => opt.value === type);
        const Icon = typeOption?.icon as any;
        return (
          <Badge variant="outline">
            {Icon && <Icon className="w-3 h-3 mr-1" />}
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
      cell: ({ row }) => <RowActions setData={setData} data={data} item={row.original} />,
      size: 60,
      enableHiding: false,
    },
  ];
}


