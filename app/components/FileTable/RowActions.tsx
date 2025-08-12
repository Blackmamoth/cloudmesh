"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RiMoreLine } from "@remixicon/react";
import { buildDownloadUrl, buildPreviewUrl, triggerDownload } from "./utils";
import { getJwtToken } from "@/lib/token";
import type { Item } from "./types";

export default function RowActions({
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
  const [openViewer, setOpenViewer] = useState(false);

  const handleDelete = async () => {
    try {
      const accessToken = await getJwtToken();
      const response = await fetch("/api/files/trash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { access_token: accessToken.token } : {}),
        },
        body: JSON.stringify({ file_ids: [item.id] }),
      });

      startUpdateTransition(() => {
        if (response.ok) {
          const updatedData = data.filter((dataItem) => dataItem.id !== item.id);
          setData(updatedData);
        }
        setShowDeleteDialog(false);
      });
    } catch (e) {
      startUpdateTransition(() => setShowDeleteDialog(false));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button size="icon" variant="ghost" className="shadow-none text-muted-foreground/60" aria-label="Edit item">
              <RiMoreLine className="size-5" size={20} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setOpenViewer(true)}>View</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                const url = buildDownloadUrl(item);
                if (url) {
                  triggerDownload(url, item.name);
                }
              }}
            >
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>Copy Link</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} variant="destructive" className="dark:data-[variant=destructive]:focus:bg-destructive/10">
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openViewer} onOpenChange={setOpenViewer}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="truncate" title={item.name}>
              {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Preview of the selected file</DialogDescription>
          </DialogHeader>
          <div className="h-[calc(85vh-64px)] bg-background">
            {(() => {
              const previewUrl = buildPreviewUrl(item);
              if (!previewUrl) {
                return (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
                    No preview available.{" "}
                    {item.viewUrl && (
                      <a className="ml-1 underline" href={item.viewUrl} target="_blank" rel="noreferrer">
                        Open in new tab
                      </a>
                    )}
                  </div>
                );
              }

              if (item.type === "image") {
                return <img src={previewUrl} alt={item.name} className="w-full h-full object-contain" />;
              }

              if (item.type === "pdf") {
                return (
                  <object data={previewUrl} type="application/pdf" className="w-full h-full">
                    <iframe title={item.name} src={previewUrl} className="w-full h-full" />
                  </object>
                );
              }

              return (
                <iframe title={item.name} src={previewUrl} className="w-full h-full" allow="clipboard-read; clipboard-write" allowFullScreen />
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatePending}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} disabled={isUpdatePending} className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


