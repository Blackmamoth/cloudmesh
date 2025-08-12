import { create } from "zustand";

export interface File {
    id: string;
    name: string;
    size: number;
    is_folder: boolean;
    is_trashed: boolean;
    thumbnail_link: string;
    preview_link: string;
    web_view_link: string;
    web_content_link: string | null;
    modified_time: Date;
    account_name: string;
    avatar_url: string;
    provider: string;
}

export interface FileRepsonse {
    file_count: number;
    files: File[];
    total_files: number;
    setFiles: (files: File[]) => void;
}

const useFilesStore = create<FileRepsonse>((set, get) => ({
    files: [],
    file_count: 0,
    total_files: 0,
    setFiles: (files: File[]) => set({ files }),

}));

export default useFilesStore;