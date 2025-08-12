"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { RiFilter3Line } from "@remixicon/react";
import { DATE_RANGE_OPTIONS, FILE_TYPE_OPTIONS, PROVIDER_OPTIONS } from "./constants";

export default function FilterPopover({ table, onAnyFilterChange }: { table: any; onAnyFilterChange?: () => void }) {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("");

  useEffect(() => {
    const providerFilter = (table.getColumn("provider")?.getFilterValue() as string[]) || [];
    const typeFilter = (table.getColumn("type")?.getFilterValue() as string[]) || [];
    const dateFilter = (table.getColumn("modifiedAt")?.getFilterValue() as string) || "";

    setSelectedProviders(providerFilter);
    setSelectedFileTypes(typeFilter);
    setSelectedDateRange(dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, table.getState().columnFilters]);

  const handleProviderChange = (value: string, checked: boolean) => {
    const newValues = checked ? [...selectedProviders, value] : selectedProviders.filter((v) => v !== value);
    setSelectedProviders(newValues);
    table.getColumn("provider")?.setFilterValue(newValues.length ? newValues : undefined);
    onAnyFilterChange?.();
  };

  const handleFileTypeChange = (value: string, checked: boolean) => {
    const newValues = checked ? [...selectedFileTypes, value] : selectedFileTypes.filter((v) => v !== value);
    setSelectedFileTypes(newValues);
    table.getColumn("type")?.setFilterValue(newValues.length ? newValues : undefined);
    onAnyFilterChange?.();
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    table.getColumn("modifiedAt")?.setFilterValue(value || undefined);
    onAnyFilterChange?.();
  };

  const clearAllFilters = () => {
    setSelectedProviders([]);
    setSelectedFileTypes([]);
    setSelectedDateRange("");
    table.resetColumnFilters();
    onAnyFilterChange?.();
  };

  const hasActiveFilters = selectedProviders.length > 0 || selectedFileTypes.length > 0 || selectedDateRange;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <RiFilter3Line className="mr-2 h-4 w-4" />
          Filter
          {hasActiveFilters && <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-6">
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
                  <label htmlFor={`provider-${provider.value}`} className="flex items-center space-x-2 text-sm font-normal cursor-pointer">
                    <Image src={provider.logo} alt={provider.label} className="w-4 h-4" />
                    <span>{provider.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

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
                  <label htmlFor={`type-${fileType.value}`} className="flex items-center space-x-2 text-sm font-normal cursor-pointer">
                    <fileType.icon className="w-4 h-4" />
                    <span>{fileType.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

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
                  <label htmlFor={`date-${dateOption.value}`} className="text-sm font-normal cursor-pointer">
                    {dateOption.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

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


