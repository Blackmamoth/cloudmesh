import googledrivelogo from "@/public/google-drive-logo.webp";
import onedrivelogo from "@/public/onedrive-logo.webp";
import dropboxlogo from "@/public/dropbox-logo.png";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  Video,
  Download,
  File,
} from "lucide-react";

export const PROVIDER_OPTIONS = [
  { value: "Google Drive", label: "Google Drive", logo: googledrivelogo },
  { value: "OneDrive", label: "OneDrive", logo: onedrivelogo },
  { value: "Dropbox", label: "Dropbox", logo: dropboxlogo },
];

export const FILE_TYPE_OPTIONS = [
  { value: "document", label: "Document", icon: FileText },
  { value: "image", label: "Image", icon: FileImage },
  { value: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet },
  { value: "presentation", label: "Presentation", icon: Presentation },
  { value: "pdf", label: "Pdf", icon: Download },
  { value: "video", label: "Video", icon: Video },
  { value: "other", label: "Other", icon: File },
];

export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisyear", label: "This year" },
];


