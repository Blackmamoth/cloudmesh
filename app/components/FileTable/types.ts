export interface Item {
  id: string;
  image: string;
  name: string;
  type:
    | "document"
    | "image"
    | "spreadsheet"
    | "presentation"
    | "pdf"
    | "video"
    | "other";
  size: number;
  provider: string;
  owner: {
    name: string;
    avatar: string;
    email?: string;
  };
  modifiedAt: string; // ISO string for filtering
  deletedAt?: string | null;
  deletedBy?: {
    name: string;
    avatar: string;
    email?: string;
  };
  originalPath?: string;
  previewUrl?: string | null;
  viewUrl?: string | null;
  contentUrl?: string | null;
}

export type ActiveFilter = {
  type: "provider" | "fileType" | "dateRange";
  value: string;
  label: string;
  // Using any here to avoid pulling UI/icon types in a shared type file
  logo?: any;
  icon?: any;
};


