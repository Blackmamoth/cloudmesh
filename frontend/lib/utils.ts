import { redisClient } from "./redis";
import { FileType } from "./types";

export const getJWTToken = async (token: string) => {
  const response = await fetch("/api/auth/token", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json();
  return body.token;
};

export const generateOAuthState = async (userID: string) => {
  const response = await fetch("/api/get-nonce");
  const body = await response.json();
  const nonce = body.nonce;
  return btoa(JSON.stringify({ user_id: userID, nonce }));
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    // Yesterday
    return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    // This week
    return (
      date.toLocaleDateString([], { weekday: "short" }) +
      `, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    );
  } else {
    // Older
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

export const getFileIcon = (fileType: FileType): string => {
  switch (fileType) {
    case "document":
      return "lucide:file-text";
    case "image":
      return "lucide:image";
    case "spreadsheet":
      return "lucide:table";
    case "presentation":
      return "lucide:monitor";
    case "pdf":
      return "lucide:file";
    default:
      return "lucide:file";
  }
};
