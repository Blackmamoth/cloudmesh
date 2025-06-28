import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";

export const UploadButton = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        multiple
        className="hidden"
        type="file"
        onChange={() => {
          // Handle file upload logic here
        }}
      />

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3,
        }}
      >
        <Dropdown placement="top">
          <DropdownTrigger>
            <Button
              isIconOnly
              className="rounded-full shadow-lg backdrop-blur-lg bg-primary-500/95"
              color="primary"
              size="lg"
            >
              <Icon className="text-2xl" icon="lucide:plus" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Upload options"
            className="backdrop-blur-lg bg-content1/95"
          >
            <DropdownItem
              key="upload"
              startContent={<Icon icon="lucide:upload" />}
              onPress={handleUploadClick}
            >
              Upload Files
            </DropdownItem>
            <DropdownItem
              key="folder"
              startContent={<Icon icon="lucide:folder-plus" />}
            >
              Create Folder
            </DropdownItem>
            <DropdownItem key="link" startContent={<Icon icon="lucide:link" />}>
              Add Cloud Link
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </motion.div>
    </>
  );
};
