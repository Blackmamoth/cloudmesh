import { File } from "../../lib/types";

// Generate random date within the last 30 days
const getRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);

  date.setDate(date.getDate() - daysAgo);

  return date.toISOString();
};

// Generate random file size between 10KB and 100MB
const getRandomSize = () => {
  return Math.floor(
    Math.random() * (100 * 1024 * 1024 - 10 * 1024) + 10 * 1024,
  );
};

// Mock users
const users = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user1",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user2",
  },
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user3",
  },
];

// Mock file data
export const mockFiles: File[] = [
  {
    id: "file-1",
    name: "Project Proposal.docx",
    type: "document",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[0],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-2",
    name: "Budget 2023.xlsx",
    type: "spreadsheet",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[1],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-3",
    name: "Team Photo.jpg",
    type: "image",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[2],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-4",
    name: "Product Presentation.pptx",
    type: "presentation",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[0],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-5",
    name: "Contract.pdf",
    type: "pdf",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[1],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-6",
    name: "Meeting Notes.docx",
    type: "document",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[2],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-7",
    name: "Logo Design.png",
    type: "image",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[0],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-8",
    name: "Sales Report Q2.xlsx",
    type: "spreadsheet",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[1],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-9",
    name: "User Manual.pdf",
    type: "pdf",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[2],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-10",
    name: "Client Pitch.pptx",
    type: "presentation",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[0],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-11",
    name: "Research Data.xlsx",
    type: "spreadsheet",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[1],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-12",
    name: "Office Layout.jpg",
    type: "image",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[2],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-13",
    name: "Project Timeline.docx",
    type: "document",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[0],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-14",
    name: "Invoice #1234.pdf",
    type: "pdf",
    size: getRandomSize(),
    provider: "Dropbox",
    owner: users[1],
    modifiedAt: getRandomDate(),
  },
  {
    id: "file-15",
    name: "Marketing Strategy.pptx",
    type: "presentation",
    size: getRandomSize(),
    provider: "Google Drive",
    owner: users[2],
    modifiedAt: getRandomDate(),
  },
];
