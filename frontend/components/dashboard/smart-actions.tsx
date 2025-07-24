import React, { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";

import { authClient } from "@/lib/auth-client";
import { mockAccounts } from "@/components/linked-accounts/mock-data";

// Mock data for smart actions
const smartActions = [
  {
    id: "Upload Files",
    name: "Upload Files",
    description: "Upload files to your cloud storage",
    icon: "lucide:upload",
    color: "text-primary bg-primary-50 dark:bg-primary-900/20",
    action: "",
    type: "modal", // Add type to distinguish modal actions from navigation actions
  },
  {
    id: "connect-provider",
    name: "Connect Another Provider",
    description: "Add a new cloud storage provider",
    icon: "lucide:plus-circle",
    color: "text-success bg-success-50 dark:bg-success-900/20",
    action: "/accounts",
    type: "navigation",
  },
  {
    id: "deduplicate",
    name: "Deduplicate Files",
    description: "Find and manage duplicate files across providers",
    icon: "lucide:copy",
    color: "text-warning bg-warning-50 dark:bg-warning-900/20",
    action: "/files?deduplicate=true",
    type: "navigation",
  },
  {
    id: "optimize-storage",
    name: "Optimize Storage",
    description: "Find large files and free up space",
    icon: "lucide:hard-drive",
    color: "text-secondary bg-secondary-50 dark:bg-secondary-900/20",
    action: "/files?optimize=true",
    type: "navigation",
  },
];

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  sizeError?: boolean;
}

export const SmartActionsCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: session } = authClient.useSession();

  // Filter accounts to show only Google Drive and Dropbox (supported by backend)
  const availableAccounts = mockAccounts.filter(
    account => account.provider === "Google Drive" || account.provider === "Dropbox"
  );

  const handleActionClick = (action: typeof smartActions[0]) => {
    if (action.type === "modal" && action.id === "Upload Files") {
      setIsOpen(true);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    
    // Filter out files that are already selected (based on name and size)
    const filteredNewFiles = newFiles.filter(newFile => 
      !selectedFiles.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );
    
    // Combine existing files with new files
    const allFiles = [...selectedFiles, ...filteredNewFiles];
    setSelectedFiles(allFiles);
    
    const maxFileSize = 50 * 1024 * 1024; // 50MB per file
    
    // Create progress tracking for all files
    const allProgress: UploadProgress[] = allFiles.map(file => {
      // Check if this file already has progress tracking
      const existingProgress = uploadProgress.find(p => p.fileName === file.name);
      if (existingProgress) {
        return existingProgress;
      }
      
      // Create new progress tracking for new files
      const sizeError = file.size > maxFileSize;
      return {
        fileName: file.name,
        progress: 0,
        status: sizeError ? 'error' as const : 'pending' as const,
        sizeError,
        error: sizeError ? `File exceeds 50MB limit (${formatFileSize(file.size)})` : undefined
      };
    });
    setUploadProgress(allProgress);
    
    // Clear the input value so the same file can be selected again if removed and re-added
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    const newProgress = uploadProgress.filter((_, i) => i !== index);
    setUploadProgress(newProgress);
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setUploadProgress([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'lucide:file-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'lucide:image';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'lucide:video';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'lucide:music';
      case 'doc':
      case 'docx':
        return 'lucide:file-text';
      case 'xls':
      case 'xlsx':
        return 'lucide:table';
      case 'ppt':
      case 'pptx':
        return 'lucide:monitor';
      case 'zip':
      case 'rar':
      case '7z':
        return 'lucide:archive';
      default:
        return 'lucide:file';
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !selectedAccount || !session?.user?.id) {
      addToast({
        title: "Upload Error",
        description: "Please select files and an account",
        color: "danger",
      });
      return;
    }

    // Check for files with size errors
    const hasFileSizeErrors = uploadProgress.some(progress => progress.sizeError);
    if (hasFileSizeErrors) {
      addToast({
        title: "Upload Error",
        description: "Some files exceed the 50MB size limit",
        color: "danger",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Update progress to show uploading
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: 'uploading' as const, progress: 0 }))
      );

      // Simulate upload progress
      const totalFiles = selectedFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        // Simulate upload progress for each file
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate upload time
          
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i 
                ? { ...item, progress, status: progress === 100 ? 'completed' as const : 'uploading' as const }
                : item
            )
          );
        }
      }

      addToast({
        title: "Upload Successful",
        description: `${selectedFiles.length} file(s) uploaded successfully to ${availableAccounts.find(acc => acc.id === selectedAccount)?.provider}`,
        color: "success",
      });

      // Reset form
      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedAccount("");
        setUploadProgress([]);
        setIsOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Mark all files as error
      setUploadProgress(prev => 
        prev.map(item => ({ 
          ...item, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );

      addToast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      setSelectedFiles([]);
      setSelectedAccount("");
      setUploadProgress([]);
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'uploading':
        return 'primary';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = 500 * 1024 * 1024; // 500MB total
  const maxFileSize = 50 * 1024 * 1024; // 50MB per file

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Smart Actions</h3>
            <p className="text-sm text-foreground-500 mt-1">
              Quick actions to manage your cloud storage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {smartActions.map((action) => (
              <Button
                key={action.id}
                as={action.type === "navigation" ? Link : "button"}
                className="h-auto py-4 px-4 justify-start flex-col items-start"
                href={action.type === "navigation" ? action.action : undefined}
                variant="flat"
                onPress={() => handleActionClick(action)}
              >
                <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                  <Icon className="text-xl" icon={action.icon} />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.name}</p>
                  <p className="text-xs text-foreground-500 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Upload Files Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={handleModalClose} 
        size="2xl"
        isDismissable={!isUploading}
        hideCloseButton={isUploading}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:upload" className="text-xl" />
                  Upload Files
                </div>
                <p className="text-sm text-foreground-500 font-normal">
                  Upload files to your connected cloud storage accounts
                </p>
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-6">
                  {/* Account Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Account
                    </label>
                    <Select
                      placeholder="Choose a cloud storage account"
                      selectedKeys={selectedAccount ? [selectedAccount] : []}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setSelectedAccount(key);
                      }}
                      isDisabled={isUploading}
                    >
                                                                   {availableAccounts.map((account) => (
                        <SelectItem
                          key={account.id}
                          textValue={`${account.name} (${account.provider})`}
                          startContent={
                            <Icon 
                              icon={account.provider === "Google Drive" ? "logos:google-drive" : "logos:dropbox"} 
                              className="text-lg"
                            />
                          }
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">{account.name}</span>
                            <span className="text-xs text-foreground-400">
                              {account.email} • {account.provider}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* File Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Files
                    </label>
                    <div className="border-2 border-dashed border-foreground-200 dark:border-foreground-700 rounded-lg p-6 text-center hover:border-primary-300 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelection}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Icon icon="lucide:upload-cloud" className="text-4xl text-foreground-400 mx-auto mb-2" />
                        <p className="text-sm text-foreground-600 mb-1">
                          Click to upload files or drag and drop
                        </p>
                                                 <p className="text-xs text-foreground-400">
                           Maximum: 50MB per file, 500MB total
                         </p>
                      </label>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">
                          Selected Files ({selectedFiles.length})
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-500">
                            Total: {formatFileSize(totalSize)}
                          </span>
                                                     {totalSize > maxTotalSize && (
                             <Chip color="danger" size="sm">
                               Exceeds total limit
                             </Chip>
                           )}
                           {!isUploading && selectedFiles.length > 0 && (
                             <Button
                               size="sm"
                               variant="flat"
                               color="danger"
                               onPress={handleClearAllFiles}
                             >
                               Clear All
                             </Button>
                           )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedFiles.map((file, index) => {
                          const progress = uploadProgress[index];
                          return (
                            <div key={index} className="bg-content2 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Icon icon={getFileIcon(file.name)} className="text-lg flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-foreground-500">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Chip
                                    color={getStatusColor(progress?.status || 'pending')}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {progress?.status === 'uploading' && 'Uploading'}
                                    {progress?.status === 'completed' && 'Done'}
                                    {progress?.status === 'error' && 'Error'}
                                    {progress?.status === 'pending' && 'Ready'}
                                  </Chip>
                                  {!isUploading && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                      onPress={() => handleRemoveFile(index)}
                                      className="min-w-unit-6 w-unit-6 h-unit-6"
                                    >
                                      <Icon icon="lucide:x" className="text-sm" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {progress?.status === 'uploading' && (
                                <Progress
                                  value={progress.progress}
                                  color="primary"
                                  size="sm"
                                  className="mb-1"
                                />
                              )}
                              
                              {progress?.status === 'error' && progress.error && (
                                <p className="text-xs text-danger mt-1">{progress.error}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload Requirements */}
                  <div className="bg-content2 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:info" className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground-600">
                                                 <p className="font-medium mb-1">Upload Requirements:</p>
                         <ul className="space-y-1">
                           <li>• Maximum file size: 50MB per file</li>
                           <li>• Maximum total upload size: 500MB</li>
                           <li>• Files will be uploaded to the selected cloud account</li>
                           <li>• Supported providers: Google Drive, Dropbox</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  isDisabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleUpload}
                  isDisabled={
                    !selectedFiles.length || 
                    !selectedAccount || 
                    totalSize > maxTotalSize ||
                    uploadProgress.some(progress => progress.sizeError) ||
                    isUploading
                  }
                  isLoading={isUploading}
                >
                  {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
};
