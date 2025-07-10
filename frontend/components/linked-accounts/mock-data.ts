export interface LinkedAccount {
  id: string;
  provider: string;
  name: string;
  email: string;
  avatar: string;
  storageUsed: number; // in MB
  storageTotal: number; // in MB
  lastSynced: string;
  status: "healthy" | "syncing" | "error";
  errorMessage?: string;
  syncEnabled: boolean;
  linkedAt: string;
  tokenExpiration: string;
}

export const mockAccounts: LinkedAccount[] = [
  {
    id: "gd-1",
    provider: "Google Drive",
    name: "John Doe",
    email: "john.doe@gmail.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user1",
    storageUsed: 3200, // 3.2 GB
    storageTotal: 15360, // 15 GB
    lastSynced: "2023-07-15T14:30:00",
    status: "healthy",
    syncEnabled: true,
    linkedAt: "2023-01-15T10:30:00",
    tokenExpiration: "2023-08-15T10:30:00",
  },
  {
    id: "gd-2",
    provider: "Google Drive",
    name: "Work Account",
    email: "john.doe@company.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user2",
    storageUsed: 18432, // 18 GB
    storageTotal: 30720, // 30 GB
    lastSynced: "2023-07-15T12:15:00",
    status: "syncing",
    syncEnabled: true,
    linkedAt: "2023-02-20T14:45:00",
    tokenExpiration: "2023-08-20T14:45:00",
  },
  {
    id: "db-1",
    provider: "Dropbox",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user3",
    storageUsed: 1843, // 1.8 GB
    storageTotal: 2048, // 2 GB
    lastSynced: "2023-07-14T09:45:00",
    status: "error",
    errorMessage: "Authentication token expired",
    syncEnabled: true,
    linkedAt: "2023-03-10T09:15:00",
    tokenExpiration: "2023-07-10T09:15:00", // Already expired
  },
  {
    id: "od-1",
    provider: "OneDrive",
    name: "Alex Johnson",
    email: "alex.johnson@outlook.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user4",
    storageUsed: 512, // 0.5 GB
    storageTotal: 5120, // 5 GB
    lastSynced: "2023-07-15T08:30:00",
    status: "healthy",
    syncEnabled: false, // Sync disabled
    linkedAt: "2023-04-05T16:20:00",
    tokenExpiration: "2023-08-05T16:20:00",
  },
  {
    id: "box-1",
    provider: "Box",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user5",
    storageUsed: 9216, // 9 GB
    storageTotal: 10240, // 10 GB
    lastSynced: "2023-07-15T11:20:00",
    status: "healthy",
    syncEnabled: true,
    linkedAt: "2023-05-12T13:40:00",
    tokenExpiration: "2023-09-12T13:40:00",
  },
];
