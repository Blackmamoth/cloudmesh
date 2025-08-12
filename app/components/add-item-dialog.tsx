"use client";

import React, { useState, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  RiArrowDownSLine, 
  RiCloseCircleLine 
} from "@remixicon/react";
import { 
  File, 
  CloudUpload, 
  Upload, 
  Plus,
  Folder,
  FolderPlus,
  FileText
} from "lucide-react";
import Image from "next/image";
import googledrivelogo from "@/public/google-drive-logo.webp";
import onedrivelogo from "@/public/onedrive-logo.webp";
import dropboxlogo from "@/public/dropbox-logo.png";

// Mock cloud accounts - you can move this to a constants file
const cloudAccounts = [
  { id: "gdrive-1", name: "john.doe@gmail.com", provider: "Google Drive", logo: googledrivelogo },
  { id: "gdrive-2", name: "work@company.com", provider: "Google Drive", logo: googledrivelogo },
  { id: "onedrive-1", name: "john.doe@outlook.com", provider: "OneDrive", logo: onedrivelogo },
  { id: "dropbox-1", name: "john.doe@dropbox.com", provider: "Dropbox", logo: dropboxlogo },
];

interface AddItemDialogProps {
  trigger?: React.ReactNode;
  onUpload?: (files: File[], accountId: string, folderName?: string) => void;
  onCreateFolder?: (folderName: string, accountId: string, files?: File[]) => void;
  variant?: "default" | "icon";
  className?: string;
}

type DialogMode = "choice" | "upload-files" | "create-folder";

export default function AddItemDialog({ 
  trigger, 
  onUpload,
  onCreateFolder,
  variant = "default",
  className
}: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("choice");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [includeFilesInFolder, setIncludeFilesInFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadFiles = () => {
    if (onUpload) {
      onUpload(selectedFiles, selectedAccount);
    } else {
      // Default behavior for demo
      alert("Files uploaded successfully! (UI Demo)");
    }
    
    // Reset and close
    resetDialog();
    setOpen(false);
  };

  const handleCreateNewFolder = () => {
    if (onCreateFolder) {
      onCreateFolder(folderName, selectedAccount, includeFilesInFolder ? selectedFiles : undefined);
    } else {
      // Default behavior for demo
      alert(`Folder "${folderName}" created successfully! (UI Demo)`);
    }
    
    // Reset and close
    resetDialog();
    setOpen(false);
  };

  const resetDialog = () => {
    setMode("choice");
    setSelectedFiles([]);
    setSelectedAccount("");
    setIsDragOver(false);
    setFolderName("");
    setIncludeFilesInFolder(false);
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const truncateFileName = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - (extension?.length || 0) - 3);
    return `${truncatedName}...${extension}`;
  };

  // Default trigger button if none provided
  const defaultTrigger = variant === "icon" ? (
    <Button size="icon" className={className}>
      <Plus className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="default" className={className}>
      <Plus className="size-5 -ms-1.5 text-white" />
      Add
    </Button>
  );

  const renderChoiceDialog = () => (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Add to Cloud Storage
        </AlertDialogTitle>
        <AlertDialogDescription>
          Choose what you would like to add
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      <div className="grid grid-cols-2 gap-4 py-4">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all"
          onClick={() => setMode("create-folder")}
        >
          <FolderPlus className="size-8 text-primary" />
          <span className="text-sm font-medium">Create New Folder</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all"
          onClick={() => setMode("upload-files")}
        >
          <FileText className="size-8 text-primary" />
          <span className="text-sm font-medium">Add Files</span>
        </Button>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={resetDialog}>Cancel</AlertDialogCancel>
      </AlertDialogFooter>
    </>
  );

  const renderCreateFolderDialog = () => (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <FolderPlus className="size-5" />
          Create New Folder
        </AlertDialogTitle>
        <AlertDialogDescription>
          Create a new folder in your cloud storage account
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      <div className="space-y-4">
        {/* Folder Name */}
        <div className="space-y-2">
          <Label htmlFor="folder-name">Folder Name</Label>
          <Input
            id="folder-name"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </div>

        {/* Select Account */}
        <div className="space-y-2">
          <Label>Select Account</Label>
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

        {/* Optional: Add Files to Folder */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-files"
              checked={includeFilesInFolder}
              onChange={(e) => setIncludeFilesInFolder(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="include-files" className="text-sm font-medium cursor-pointer">
              Add files to this folder (optional)
            </Label>
          </div>
          
          {includeFilesInFolder && (
            <div className="space-y-2 mt-2">
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
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <div className="text-sm font-medium">Selected Files:</div>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <File className="size-4" />
                        <span className="text-sm truncate">{truncateFileName(file.name)}</span>
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
          )}
        </div>
      </div>

      <AlertDialogFooter>
        <Button variant="ghost" onClick={() => setMode("choice")}>Back</Button>
        <AlertDialogCancel onClick={resetDialog}>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={handleCreateNewFolder}
          disabled={!selectedAccount || !folderName.trim()}
        >
          Create Folder
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );

  const renderUploadFilesDialog = () => (
    <>
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
          <Label>Select Account</Label>
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
          <Label>Select Files</Label>
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
            <div className="space-y-2 max-h-60 max-w-full overflow-y-auto">
              <div className="text-sm font-medium">Selected Files:</div>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <File className="size-4" />
                    <span className="text-sm truncate">{truncateFileName(file.name)}</span>
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
        <Button variant="ghost" onClick={() => setMode("choice")}>Back</Button>
        <AlertDialogCancel onClick={resetDialog}>Cancel</AlertDialogCancel>
        <AlertDialogAction 
          onClick={handleUploadFiles}
          disabled={!selectedAccount || selectedFiles.length === 0}
        >
          Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="min-w-[600px] max-h-[90vh] overflow-y-auto">
        {mode === "choice" && renderChoiceDialog()}
        {mode === "create-folder" && renderCreateFolderDialog()}
        {mode === "upload-files" && renderUploadFilesDialog()}
      </AlertDialogContent>
    </AlertDialog>
  );
}
