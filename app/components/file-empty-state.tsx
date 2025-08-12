"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import AddItemDialog from "@/components/add-item-dialog";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Video,
  File,
  Presentation,
  FolderOpen,
  Image,
  FileCode,
  FileArchive,
  FileAudio,
  Plus,
} from "lucide-react";

interface FileEmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export default function FileEmptyState({
  searchQuery,
  onClearSearch,
}: FileEmptyStateProps) {
  // Floating icons configuration - positioned around the center with animation delays
  const floatingIcons = [
    { Icon: FileSpreadsheet, className: "top-[15%] left-[20%]", size: 28, delay: "0s" },
    { Icon: FileText, className: "top-[10%] left-[50%]", size: 24, delay: "0.5s" },
    { Icon: FolderOpen, className: "top-[20%] right-[25%]", size: 26, delay: "1s" },
    { Icon: Image, className: "top-[40%] right-[15%]", size: 24, delay: "1.5s" },
    { Icon: Video, className: "bottom-[35%] right-[20%]", size: 28, delay: "2s" },
    { Icon: FileCode, className: "bottom-[15%] right-[40%]", size: 22, delay: "2.5s" },
    { Icon: File, className: "bottom-[25%] left-[25%]", size: 24, delay: "3s" },
    { Icon: FileImage, className: "top-[35%] left-[15%]", size: 26, delay: "3.5s" },
  ];

  return (
    <div className="relative flex items-center justify-center py-24 px-4 min-h-[500px]">
      {/* Add CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-20px);
          }
        }
        .floating-icon {
          animation: float 6s ease-in-out infinite;
        }
            `}</style>
      
      {/* Background floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => {
          const IconComponent = item.Icon;
          return (
            <div
              key={index}
              className={`absolute ${item.className} opacity-[0.08] dark:opacity-[0.05] floating-icon`}
              style={{
                transform: "translate(-50%, -50%)",
                animationDelay: item.delay,
              }}
            >
              <IconComponent 
                size={item.size * 1.5} 
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
          );
        })}
      </div>
      
      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Central icon with background */}
        <div className="relative mb-6">
          {/* Outer circle */}
          <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-muted/20 to-muted/10 rounded-full blur-xl" />
          {/* Inner circle with icon */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-2xl shadow-sm flex items-center justify-center">
            <FileText 
              size={32} 
              className="text-muted-foreground/80"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          No files found
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-sm">
          {searchQuery ? (
            <>
                  Your search <span className="font-medium text-foreground">"{searchQuery}"</span> did not
              match any files. Please try again.
            </>
          ) : (
            "You haven't uploaded any files yet. Start by adding your first document."
          )}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {searchQuery && onClearSearch && (
            <Button
              variant="outline"
              onClick={onClearSearch}
              className="min-w-[140px]"
            >
              Clear search
            </Button>
          )}
          <AddItemDialog 
            trigger={
              <Button className="min-w-[140px] bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}