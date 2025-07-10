export type FileType =
  | string
  | "document"
  | "image"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "other";

export interface File {
  id: string;
  name: string;
  type: FileType;
  size: number; // in bytes
  provider: string;
  owner: {
    name: string;
    email: string;
    avatar: string;
  };
  modifiedAt: string;
}

export type ViewMode = "table" | "grid";

export interface SortOption {
  field: "name" | "size" | "modifiedAt";
  direction: "asc" | "desc";
}

export interface FilterOptions {
  provider: string[];
  fileType: FileType[];
  dateModified: string | null;
}
