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

// Trash-specific interface extending File
export interface TrashItem extends File {
  deletedAt: string;
  deletedBy: {
    name: string;
    email: string;
    avatar: string;
  };
  originalPath: string;
}

export type ViewMode = "table" | "grid";

export interface SortOption {
  field: "name" | "size" | "modifiedAt";
  direction: "asc" | "desc";
}

// Trash-specific sort options
export interface TrashSortOption {
  field: "name" | "size" | "modifiedAt" | "deletedAt";
  direction: "asc" | "desc";
}

export interface FilterOptions {
  provider: string[];
  fileType: FileType[];
  dateModified: string | null;
}

// Trash-specific filter options
export interface TrashFilterOptions {
  provider: string[];
  fileType: FileType[];
  dateDeleted: string | null;
  deletedBy: string[];
}
