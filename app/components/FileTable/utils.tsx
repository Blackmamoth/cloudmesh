"use client";

import type { FilterFn } from "@tanstack/react-table";
import type { Item } from "./types";
import { Download, File, FileImage, FileSpreadsheet, Presentation, Video, FileText } from "lucide-react";

// Infer a coarse file type from the file name
export function inferTypeFromName(fileName: string): Item["type"] {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (!ext) return "other";
  if (["doc", "docx", "txt", "rtf", "md"].includes(ext)) return "document";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["ppt", "pptx", "key"].includes(ext)) return "presentation";
  if (["pdf"].includes(ext)) return "pdf";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  return "other";
}

// Normalize provider labels to match UI filter options
export function normalizeProviderLabel(provider: string): string {
  const p = (provider || "").toLowerCase();
  if (p.includes("google") || p === "drive" || p.includes("gdrive")) return "Google Drive";
  if (p.includes("onedrive") || p.includes("microsoft")) return "OneDrive";
  if (p.includes("dropbox")) return "Dropbox";
  return provider;
}

// Build an embeddable preview URL per provider when possible
export function buildPreviewUrl(item: Item): string | null {
  const direct = item.previewUrl || item.viewUrl || item.contentUrl || null;
  const provider = (item.provider || "").toLowerCase();

  if (!direct) return null;

  try {
    const url = new URL(direct);
    // Google Drive: prefer /preview path
    if (provider.includes("google")) {
      if (url.hostname.includes("drive.google.com")) {
        const preview = direct.replace("/view", "/preview").replace("/edit", "/preview");
        return preview;
      }
      return direct;
    }

    // Dropbox: use raw=1 for direct rendering
    if (provider.includes("dropbox")) {
      if (url.searchParams.has("dl")) {
        url.searchParams.delete("dl");
      }
      url.searchParams.set("raw", "1");
      return url.toString();
    }

    // OneDrive: add embed=1 to enable embedding where supported
    if (provider.includes("onedrive") || provider.includes("microsoft")) {
      if (!url.searchParams.has("embed")) {
        url.searchParams.set("embed", "1");
      }
      return url.toString();
    }

    return direct;
  } catch {
    return direct;
  }
}

// Build a direct(ish) download URL per provider
export function buildDownloadUrl(item: Item): string | null {
  const provider = (item.provider || "").toLowerCase();
  const content = item.contentUrl || null;
  const view = item.viewUrl || null;

  if (content) {
    try {
      const url = new URL(content);
      if (provider.includes("dropbox")) {
        url.searchParams.delete("raw");
        url.searchParams.set("dl", "1");
        return url.toString();
      }
      if (provider.includes("onedrive") || provider.includes("microsoft")) {
        url.searchParams.set("download", "1");
        return url.toString();
      }
      return url.toString();
    } catch {
      return content;
    }
  }

  if (!view) return null;

  try {
    const url = new URL(view);
    if (provider.includes("dropbox")) {
      if (url.searchParams.has("raw")) url.searchParams.delete("raw");
      url.searchParams.set("dl", "1");
      return url.toString();
    }

    if (provider.includes("onedrive") || provider.includes("microsoft")) {
      url.searchParams.set("download", "1");
      return url.toString();
    }

    if (provider.includes("google") && url.hostname.includes("drive.google.com")) {
      const match = view.match(/\/d\/([A-Za-z0-9_-]+)\//);
      const id = match?.[1];
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
      return view.replace("/view", "").concat(view.includes("?") ? "&" : "?").concat("export=download");
    }
  } catch {
    // noop
  }

  return view;
}

// Trigger a download via an anchor click
export function triggerDownload(url: string, filename?: string) {
  try {
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Download response not ok");
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        if (filename) a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = url;
        document.body.appendChild(iframe);
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 60000);
      });
  } catch {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 60000);
  }
}

// Generic filter functions
export const multiSelectFilterFn: FilterFn<Item> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  const value = row.getValue(columnId) as string;
  return filterValue.includes(value);
};

export const dateRangeFilterFn: FilterFn<Item> = (row, columnId, filterValue: string) => {
  if (!filterValue) return true;
  const cellValue = row.getValue(columnId) as string;
  const cellDate = new Date(cellValue);
  const now = new Date();

  switch (filterValue) {
    case "today":
      return cellDate.toDateString() === now.toDateString();
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return cellDate.toDateString() === yesterday.toDateString();
    }
    case "last7days": {
      const week = new Date(now);
      week.setDate(week.getDate() - 7);
      return cellDate >= week;
    }
    case "last30days": {
      const month = new Date(now);
      month.setDate(month.getDate() - 30);
      return cellDate >= month;
    }
    case "thisyear": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return cellDate >= yearStart;
    }
    default:
      return true;
  }
};

export const getDate = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Function to get file type icon
export const getFileTypeIcon = (type: string) => {
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
export const formatFileSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};


